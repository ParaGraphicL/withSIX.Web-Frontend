import { createError } from "../helpers/utils/errors";
import { EntityExtends } from "./entity-extends";
import { ICancellationToken } from "./reactive";
import { Tools } from "./tools";
import { W6Context } from "./w6context";
import { W6 } from "./withSIX";
import { inject } from "aurelia-framework";

import ApolloClient, { createNetworkInterface } from "apollo-client";
import gql from "graphql-tag";

interface IManagedServer {
  id: string;
  location: ServerLocation;
  size: ServerSize;
  secondaries: { size: ServerSize }[];

  additionalSlots: number;

  name: string;
  password: string;
  adminPassword: string;

  settings: IArmaSettings;

  mods: { id: string, constraint?: string }[];
  missions: { id: string }[];
}

interface IManagedServerListItem {
  id: string; name: string; gameId: string; userId: string
}

interface IArmaSettings {
  battlEye: boolean; verifySignatures: boolean; vonQuality: number;
  persistent: boolean; disableVon: boolean; drawingInMap: boolean; forceRotorLibSimulation: boolean; enableDefaultSecurity: boolean; allowedFilePatching: boolean;
}

export interface IServerClient {
  servers: ServersApi;
}

//const OperationCancelledException = createError("OperationCancelledException", Tools.AbortedException);
const OperationFailedException = createError("OperationFailedException");

abstract class ApiBase {
  constructor(private ctx: W6Context, private basePath: string) { }

  // TODO: Location based job redir
  protected _get<T>(path: string) { return this.ctx.getCustom<T>(`${this.basePath}${path}`); }
  protected _delete<T>(path: string) { return this.ctx.deleteCustom<T>(`${this.basePath}${path}`); }
  protected _post<T>(path: string, data?) { return this.ctx.postCustom<T>(`${this.basePath}${path}`, data); }

  protected delay(delay: number) { return new Promise((res) => setTimeout(res, delay)); }

  protected async _pollOperationState<T>(id: string, operationId: string, ct?: ICancellationToken) {
    let status: IOperationStatusT<T> = { state: OperationState.Queued, result: null };

    while ((!ct || !ct.isCancellationRequested) && status.state < OperationState.Completed) {
      //try {
      status = await this.getOperation<T>(id, operationId);
      //} catch (err) {
      // todo
      //}
      await this.delay(2000);
    }
    if (ct && ct.isCancellationRequested && status.state < OperationState.Completed) {
      await this.cancelOperation(id, operationId);
      status.state = OperationState.Cancelled;
    }
    if (status.state !== OperationState.Completed) {
      if (status.state === OperationState.Cancelled) { throw new Tools.AbortedException(status.message); }
      throw new OperationFailedException(`Operation did not succeed: ${OperationState[status.state]} ${status.message}`);
    }
    return status.result;
  }

  private cancelOperation(id: string, operationId: string) { return this._delete(`/${id}/operations/${operationId}`); }
  private getOperation<T>(id: string, operationId: string) { return this._get<IOperationStatusT<T>>(`/${id}/operations/${operationId}`); }
}

enum OperationState {
  Queued,
  Progressing,
  Completed,
  Cancelled,
  Failed
}

interface IOperationStatus {
  state: OperationState;
  message?: string;
  progress?: number;
}

interface IOperationStatusT<T> extends IOperationStatus {
  result: T;
}

export interface IServerSession { address: string; state: ServerState; message: string; endtime: Date }

enum Action {
  Start,
  Stop,
  Restart,
  Prepare,
  Scale
}

class ServersApi extends ApiBase {
  constructor(ctx: W6Context) { super(ctx, "/server-manager/servers"); }

  async createOrUpdate(server) {
    // TODO: Creation/Updating could be a long running op, in such case we should adopt the same Operation model as the actions (start/stop etc)
    const opId = await this._post<string>(`/`, server);
    return await this.get(opId);
  }

  list(gameId: string) { return this._get<{ items: IManagedServerListItem[] }>(`/?gameId=${gameId}`); }
  get(id: string) { return this._get<IManagedServer>(`/${id}`); }
  session(id: string) { return this._get<IServerSession>(`/${id}/session`); }

  start(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Start, undefined, ct); }
  stop(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Stop, undefined, ct); }
  restart(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Restart, undefined, ct); }
  prepare(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Prepare, undefined, ct); }
  scale(id: string, size: ServerSize, ct?: ICancellationToken) { return this.changeState(id, Action.Scale, { size }, ct); }

  private async changeState(id: string, action: Action, data?, ct?: ICancellationToken) {
    const operationId = await this._post<string>(`/${id}/${Action[action].toLowerCase()}`, data);
    await this._pollOperationState(id, operationId, ct);
  }
}

@inject(W6Context)
export class ServerClient implements IServerClient {
  servers: ServersApi;
  constructor(ctx: W6Context) {
    this.servers = new ServersApi(ctx);
  }
}

export enum ServerState {
  Initializing,

  PreparingContent,
  ContentPrepared,

  Provisioning = 5000,
  Provisioned,

  PreparingLaunch,

  LaunchingGame = 6000,

  GameIsRunning = 7000,

  StoppingInstances,

  Failed = 9999,
  InstancesShutdown = 50000

  //End
}

export enum ServerAction {
  Start,
  Stop,
  Prepare,
  Restart // Incl Config+Content preparation
}

export class ManagedServer extends EntityExtends.BaseEntity {
  id: string;

  location: ServerLocation = ServerLocation.WestEU;
  size: ServerSize = ServerSize.Normal;
  secondaries: { size: ServerSize }[] = [];

  additionalSlots = 0;

  name: string;
  password: string;
  adminPassword: string;

  // TODO: Game specific
  settings: IArmaSettings = <any>{ battlEye: true, drawingInMap: true, verifySignatures: true, vonQuality: 12, enableDefaultSecurity: true };

  mods: Map<string, { id: string }> = new Map<string, { id: string }>();
  missions: Map<string, { id: string }> = new Map<string, { id: string }>();
  state: IServerSession;
  interval = 2 * 1000; // todo; adjust interval based on state, also should restart on each action?

  constructor(private data) {
    super();
    this.state = this.getDefaultState();
    Object.assign(this, data);
  }

  getDefaultState() { return <any>{ state: ServerState.Initializing }; }

  monitor(client: IServerClient, ct: { isCancellationRequested: boolean }) {
    return new Promise<void>(async (res, rej) => {
      try {
        while (!ct.isCancellationRequested) {
          try {
            const session = await client.servers.session(this.id);
            this.state = session;
          } catch (err) {
            if (err.status === 404) { this.state = this.getDefaultState(); }
          }
          await new Promise((res2) => setTimeout(res2, this.interval));
        }
      } catch (err) {
        rej(err);
      }
      res();
    });
  }

  toggleMod(mod: { id: string; name: string }) {
    if (this.mods.has(mod.id)) {
      this.mods.delete(mod.id);
      ManagedServer.eventPublisher(new RemovedModFromServer(mod, this));
    } else {
      this.mods.set(mod.id, mod);
      ManagedServer.eventPublisher(new ModAddedToServer(mod, this));
    }
  }

  toggleMission(mission: { id: string; name: string }) {
    if (this.missions.has(mission.id)) { this.missions.delete(mission.id); } else { this.missions.set(mission.id, mission); }
  }

  hasMod(id: string) { return this.mods.has(id); }
  hasMission(id: string) { return this.missions.has(id); }

  // TODO: Decreased interval while actions are running..
  start(client: IServerClient) { return client.servers.start(this.id); }
  stop(client: IServerClient) { return client.servers.stop(this.id); }
  restart(client: IServerClient) { return client.servers.restart(this.id); }
  prepare(client: IServerClient) { return client.servers.prepare(this.id); }
}

export class ModAddedToServer {
  constructor(public mod: { name: string; id: string }, public server: ManagedServer) { }
}

export class RemovedModFromServer {
  constructor(public mod: { name: string; id: string }, public server: ManagedServer) { }
}

interface IGame { id: string; servers: IManagedServer[]; }

export class Game {
  activeServer: ManagedServer;
  servers: Map<string, ManagedServer>;
  id: string;

  constructor(data: { id: string, servers: Map<string, ManagedServer> }) {
    this.id = data.id;
    this.servers = data.servers;
    if (this.servers.size > 0) {
      this.activeServer = this.servers[0];
    } else {
      this.activeServer = this.create();
    }
  }

  get(id: string) { return this.servers.get(id); }

  create() {
    const s = new ManagedServer(<IManagedServer>{ id: Tools.generateGuid() });
    this.servers.set(s.id, s);
    return s;
  }

  //add(server: Server) { this.servers.push(server); }
  remove(server: ManagedServer) { this.servers.delete(server.id); }
}


@inject(W6)
export class ServerStore {
  games: Map<string, Game>;


  public static storageToServer(s: IManagedServer): ManagedServer {
    return new ManagedServer({
      additionaSlots: s.additionalSlots,
      adminPassword: s.adminPassword,
      id: s.id,
      location: s.location,
      missions: s.missions.toMap(x => x.id),
      mods: s.mods.toMap(x => x.id),
      name: s.name,
      password: s.password,
      secondaries: s.secondaries,
      settings: s.settings,
      size: s.size,
    });
  }

  public static serverToStorage(s: ManagedServer): IManagedServer {
    return {
      additionalSlots: s.additionalSlots,
      adminPassword: s.adminPassword,
      id: s.id,
      location: s.location,
      missions: Array.from(s.missions.keys()).map(id => { return { id } }),
      mods: Array.from(s.mods.keys()).map(id => { return { id, constraint: (<any>s.mods.get(id)).constraint } }),
      name: s.name,
      password: s.password,
      secondaries: s.secondaries,
      settings: s.settings,
      size: s.size,
    };
  }

  constructor(private w6: W6) {
    this.load();
  }

  get activeGame() {
    const id = this.w6.activeGame.id;
    if (id == null) { return null; }

    if (!this.games.has(id)) {
      this.games.set(id, new Game({ id, servers: new Map<string, ManagedServer>() }));
    }
    return this.games.get(this.w6.activeGame.id);
  }

  load() {
    const storage = window.localStorage.getItem("w6.servers");
    const m: { games: IGame[] } = storage ? JSON.parse(storage) : { games: [] };
    this.games = storage ? m.games.map(x => this.storageToGame(x)).toMap(x => x.id) : new Map<string, Game>();
  }

  get(id: string) { return this.games.get(id); }

  async getServers(client: IServerClient, augmentMods: (mods: any[]) => Promise<void>) {
    const game = this.activeGame;
    const servers = await client.servers.list(game.id);

    if (Tools.env >= Tools.Environment.Staging) { this.graphTest(); }

    if (servers.items.length > 0) {
      const s = ServerStore.storageToServer(await client.servers.get(servers.items[0].id));
      await augmentMods(Array.from(s.mods.values()));
      game.activeServer = s;
    }
  }

  async graphTest() {
    // TODO: Include graph also on the frontend domain, so that we can use it during development?
    const networkInterface = createNetworkInterface({
      uri: Tools.env <= Tools.Environment.Staging ? "https://graph.withsix.com" : "http://localhost:5000/graphql",
      opts: {
        //credentials: 'same-origin',
      },
    });
    networkInterface.use([{
      applyMiddleware(req, next) {
        if (!req.options.headers) {
          req.options.headers = {};  // Create the header object if needed.
        }
        req.options.headers["authorization"] = localStorage.getItem("aurelia_token") ? `Bearer ${localStorage.getItem("aurelia_token")}` : null;
        next();
      }
    }]);
    const ac = new ApolloClient({ networkInterface });

    try {
      await ac.query({
        query: gql`
          query Awesome($id: String) {
            viewer {
    userName
    id
    servers {
      id
    }
  }
  server(id: $id) {
    id
    name
    mods {
      edges {
        constraint
        cursor
        node {
          name
          id
          packageName
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    missions {
      edges {
        cursor
        node {
          name
          id
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    adminPassword
    password
    size
    location
    additionalSlots
  }
      }
      `, variables: { id: "98731246-e77c-deec-e217-cdc8800aa14c" }
      })
        .then(x => {
          console.log("$$$$ GQL: RESULT", x);
        });
    } catch (err) {
      console.log("$$$$ GQL: ERR", err);
    }
  }

  save() {
    const games = Array.from(this.games.values()).map(x => this.gameToStorage(x));
    window.localStorage.setItem("w6.servers", JSON.stringify({ games }));
  }

  private storageToGame(game: IGame) {
    return new Game({ id: game.id, servers: game.servers.map(x => ServerStore.storageToServer(x)).toMap(x => x.id) });
  }

  private gameToStorage(game: Game) {
    return {
      id: game.id,
      servers: Array.from(game.servers.values()).map(x => ServerStore.serverToStorage(x)),
    }
  }
}

export enum ServerSize {
  VerySmall = -2,
  Small = -1,
  Normal = 0,
  Large
}

export enum ServerLocation {
  WestEU,
  WestUS
}
