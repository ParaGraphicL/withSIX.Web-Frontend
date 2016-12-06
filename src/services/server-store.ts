import { createError } from "../helpers/utils/errors";
import { EntityExtends } from "./entity-extends";
import { gcl, gql } from "./graphqlclient";
import { ICancellationToken } from "./reactive";
import { Tools } from "./tools";
import { W6Context } from "./w6context";
import { W6 } from "./withSIX";
import { inject } from "aurelia-framework";

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
  status: {
    address
    state
    message
    endtime
  }
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
  status: IServerSession;

  constructor(private data) {
    super();
    this.status = this.getDefaultState();
    Object.assign(this, data);
  }

  getDefaultState() { return <any>{ state: ServerState.Initializing }; }

  async refreshState() {
    const { data }: IGQLResponse<{ server: { status: { address: string; state: ServerState; message: string; endtime: string } } }>
      = await gcl.query<any>({
        forceFetch: true,
        query: gql`
                query GetServerStatus($id: ID!) {
                  server(id: $id) {
                    status {
                      address
                      state
                      message
                      endtime
                    }
                  }
                }`,
        variables: {
          id: this.id,
        },
      });

    if (!data.server) {
      this.status = this.getDefaultState();
    } else {
      const { state, message, address, endtime } = data.server.status;
      this.status = { state, message, address, endtime: endtime ? new Date(endtime) : null };
    }
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
    this.overview = [{ id: this.activeServer.id, name: this.activeServer.name }];
  }

  get(id: string) { return this.servers.get(id); }

  overview: { id: string, name: string }[] = []

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
      status: s.status
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
      status: s.status,
    };
  }

  constructor(private w6: W6) {
    this.load();
  }

  interval = 2 * 1000; // todo; adjust interval based on state, also should restart on each action?

  monitor(client: IServerClient, ct: { isCancellationRequested: boolean }) {
    // TODO: Only monitor servers that actually exist on network
    return new Promise<void>(async (res, rej) => {
      while (!ct.isCancellationRequested) {
        try {
          await this.activeGame.activeServer.refreshState();
        } catch (err) {
          if (err.toString().indexOf('Failed request 404') > -1) { } else { rej(err); }
        }
        await new Promise((res2) => setTimeout(res2, this.interval));
      }
      res();
    });
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

  async select(id: string) {
    const game = this.activeGame;
    const { data }: IGQLResponse<{ server: IServerDataNode }> = await gcl.query<any>({
      query: gql`
        query GetServer($id: ID!) {
          server(id: $id) {
              ...BasicServerInfo
              adminPassword
              password
              additionalSlots
              settings {
                ...InterestingSettings
              }
              status {
                state
                address
                message
                endtime
              }
              secondaries {
                size
              }
              mods {
                edges {
                  constraint
                  node {
                    name
                    id
                  }
                }
              }
              missions {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
        }
        fragment InterestingSettings on ServerSettings {
          battlEye
          verifySignatures
          persistent
          disableVon
          drawingInMap
          forceRotorLibSimulation
          allowedFilePatching
          enableDefaultSecurity
          vonQuality
          motd
        }

        fragment BasicServerInfo on Server {
          id
          name
          gameId
          userId
          size
          location
        }
    `, variables: {
        id,
      }
    });
    const { server } = data;
    game.activeServer = ServerStore.storageToServer(this.toManagedServer(server));
  }

  async getServers(client: IServerClient, augmentMods: (mods: any[]) => Promise<void>) {
    const game = this.activeGame;

    const { firstServer, overview } = await this.queryServers();
    if (overview.length > 0) { game.overview = overview; }
    if (firstServer) { game.activeServer = ServerStore.storageToServer(firstServer); }
  }

  async queryServers(): Promise<{ firstServer: IManagedServer, overview: { id: string, name: string }[] }> {
    const { data }: IGQLViewerResponse<{ firstServer: IServerData, servers: { edges: { node: { id, name } }[] } }> = await gcl.query<any>({
      query: gql`
        query GetServers {
          viewer {
            servers {
              edges {
                node {
                  id
                  name
                }
              }
              totalCount
            }
            firstServer: servers(first: 1) {
              edges {
                node {
                  ...BasicServerInfo
                  adminPassword
                  password
                  additionalSlots
                  settings {
                    ...InterestingSettings
                  }
                  status {
                    address
                    state
                    message
                    endtime
                  }
                  secondaries {
                    size
                  }
                  mods {
                    edges {
                      constraint
                      node {
                        name
                        id
                      }
                    }
                  }
                  missions {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }
                }
                totalCount
              }
          }
        }
        fragment InterestingSettings on ServerSettings {
          battlEye
          verifySignatures
          persistent
          disableVon
          drawingInMap
          forceRotorLibSimulation
          allowedFilePatching
          enableDefaultSecurity
          vonQuality
          motd
        }

        fragment BasicServerInfo on Server {
          id
          name
          gameId
          userId
          size
          location
        }
    `});
    const server = data.viewer.firstServer.edges[0];
    // TODO: or would we change the shape of our views instead?
    // TODO: We could drop the edges indirection for non paged requirements, hmz
    const firstServer = server ? this.toManagedServer(server.node) : null;
    return {
      firstServer,
      overview: data.viewer.servers.edges.map(x => x.node).map(({ id, name }) => { return { id, name }; }),
    };
  }

  toManagedServer(server: IServerDataNode) {
    const { additionalSlots, adminPassword, gameId, id, location, name, password, secondaries,
      settings, size, status, userId, mods, missions } = server;
    return {
      additionalSlots, adminPassword, gameId, id, location, name, password, secondaries, settings, size, status, userId,
      missions: missions.edges.map(x => x.node),
      mods: mods.edges.map(x => x.node),
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

interface IGQLResponse<T> {
  data: T;
}

interface IGQLViewerResponse<T> extends IGQLResponse<{ viewer: T }> { }

interface IServerData {
  edges: {
    node: IServerDataNode
  }[]
}

interface IServerDataNode {
  id
  name
  gameId
  userId
  size: ServerSize
  location: ServerLocation
  adminPassword
  password
  additionalSlots
  settings: {
    battlEye
    verifySignatures
    persistent
    disableVon
    drawingInMap
    forceRotorLibSimulation
    allowedFilePatching
    enableDefaultSecurity
    vonQuality
    motd
  }
  status: {
    address
    state
    message
    endtime
  }
  secondaries: {
    size: ServerSize
  }[]
  mods: {
    edges: {
      constraint
      node: {
        name
        id
      }
    }[]
  }
  missions: {
    edges: {
      node: {
        id
        name
      }
    }[]
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
