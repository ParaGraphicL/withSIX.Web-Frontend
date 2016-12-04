import { EventAggregator } from 'aurelia-event-aggregator';
import { inject } from 'aurelia-framework';
import { ReactiveBase } from './base';
import { _Indexer } from './legacy/base';
import { Toastr } from './toastr';
import { ObservableEventAggregator } from './reactive';
import { W6 } from './withSIX';
import { BasketType, IBasketModel, IBasketItem, BasketState, IBasketCollection, IBaskets } from './legacy/baskets';
import { createError } from "../helpers/utils/errors";
import { EntityExtends } from "./entity-extends";
import { W6Context } from './w6context';
import { ContentHelper } from './helpers';

import { Tools } from './tools';

import {
  ActionType, IActionNotification, Client, ConnectionState, IContentState, ItemState, IContentStateChange, IContentStatusChange, IClientInfo, IActionTabStateUpdate, IContentGuidSpec, IContentsBase, IContentBase,
  IUserErrorAdded, IUserErrorResolved
} from 'withsix-sync-api';
import { ClientWrapper, AppEventsWrapper, StateChanged } from './client-wrapper';


@inject(EventAggregator, W6, Client, Toastr, ClientWrapper, AppEventsWrapper)
export class BasketService extends ReactiveBase {
  private clientInfos: { [id: string]: GameClientInfo } = {};
  private clientPromises: { [id: string]: Promise<GameClientInfo> } = {};
  busyCount = 0;

  constructor(private eventBus: EventAggregator, private w6: W6, private client: Client, public logger: Toastr, private clientWrapper: ClientWrapper, private appEvents: AppEventsWrapper) {
    super();

    this.initialize();

    this.subscriptions.subd(d => {
      d(this.clientWrapper.stateChanged.subscribe(async (state) => {
        switch (state.newState) {
          case ConnectionState.connected:
            try {
              await this.handleConnected();
            } catch (err) {
              this.tools.Debug.log("$$$ err", err);
              throw err;
            }
            break;
          case ConnectionState.disconnected:
          case ConnectionState.reconnecting:
            //this.handleDisconnected();
            break;
          default:
        }
      }));
    });
  }

  private baskets: IBaskets;
  private constructedBaskets: _Indexer<any> = {};
  lastActiveItem: string;
  hasConnected: boolean;

  refresh() { this.initialize(); }

  abort(gameId: string) { return this.client.abort(gameId); };

  private createLocalBaskets(): IBaskets {
    return {
      gameBaskets: {},
    };
  }

  getGameBaskets(gameId: string) {
    if (this.constructedBaskets[gameId] != null) return this.constructedBaskets[gameId];

    if (this.baskets.gameBaskets[gameId] == null) this.baskets.gameBaskets[gameId] = {
      activeId: null,
      collections: []
    };

    var basketModel = this.baskets.gameBaskets[gameId];
    try {
      var i = basketModel.collections.length;
    } catch (e) {
      this.logger.error("A Game Basket Group was damaged and had to be reset", "Error Loading Game Baskets");
      delete this.baskets.gameBaskets[gameId];
      return this.getGameBaskets(gameId);
    }

    return this.constructedBaskets[gameId] = this.w6.api.createGameBasket(gameId, basketModel);
  }

  addToBasket(gameId: string, item: IBasketItem) {
    this.performTransaction(() => {
      var baskets = this.getGameBaskets(gameId);
      baskets.active.toggleInBasket(Object.assign({ gameId: gameId }, item));
    });
  }

  public async performTransaction(t: () => Promise<void> | void) {
    await t();
    this.saveChanges();
  }

  private initialize() {
    if (window.localStorage.getItem("withSIX.baskets") == null) {
      this.baskets = this.createLocalBaskets();
      this.saveChanges();
    } else
      this.baskets = JSON.parse(window.localStorage.getItem("withSIX.baskets"));
  }

  public saveChanges() { window.localStorage.setItem("withSIX.baskets", JSON.stringify(this.baskets)); }

  async handleConnected() {
    this.hasConnected = true;

    let promises = [];
    this.tools.Debug.log("$$$ handling connected", this.clientInfos);
    for (let i in this.clientInfos) {
      if (this.clientInfos.hasOwnProperty(i)) {
        promises.push(this.updateClientInfo(this.clientInfos[i]));
      }
    }

    let activeGame = this.w6.activeGame;
    if (activeGame.id != null) await this.client.selectGame(activeGame.id);

    await Promise.all(promises);
  }

  async Int(clientInfo: GameClientInfo) {
    try {
      await this.updateClientInfo(clientInfo);
    } catch (err) {
      this.tools.Debug.log("$$$ err", err);
      this.clientPromises[clientInfo.game.id] = null;
    }
    return clientInfo;
  }

  informAngular = () => this.appEvents.emitBasketChanged();

  async updateClientInfo(clientInfo: GameClientInfo) {
    this.busyCount = this.busyCount + 1;
    try {
      var cInfo = await this.client.getGameInfo(clientInfo.game.id);
      Object.assign(clientInfo.clientInfo, { actionInfo: null }, cInfo);
      this.tools.Debug.log("$$$ ClientInfo Update", clientInfo.clientInfo);
      this.eventBus.publish('refreshContentInfo-' + clientInfo.game.id);
      this.informAngular();
    } finally {
      this.busyCount = this.busyCount - 1;
    }
  }

  getGameInfo(gameId: string) {
    if (gameId == null) throw new Error("called with null gameId");
    if (this.clientPromises[gameId]) return this.clientPromises[gameId];

    this.subscriptions.subd(d => d(this.clientInfos[gameId] = new GameClientInfo(this.eventBus, this.appEvents, this.clientWrapper, gameId)));
    let ci = this.clientInfos[gameId];
    //if (this.client.state != ConnectionState.connected) return Promise.resolve(ci);
    //return this.clientPromises[gameId] = this.Int(ci);
    this.tools.Debug.log("$$$ Getting game info", gameId);
    return this.clientPromises[gameId] = this.client.state === ConnectionState.connected ? this.Int(ci) : Promise.resolve(ci);
    // we update the info later on
  }

  // TODO: Duplication in controllers
  private getItemStateClass(id: string, gameId: string, constraint?: string) {
    var gameInfo = this.clientInfos[gameId];
    if (gameInfo == null) return "install";
    let ciItem = gameInfo.clientInfo.content[id];
    return this.getItemStateClassInternal(ContentHelper.getConstentStateInitial(ciItem, constraint));
  };

  getItemStateClassInternal(itemState: ItemState) {
    if (itemState == null)
      return "install";
    switch (itemState) {
      case ItemState.Uptodate:
        return "uptodate";
      case ItemState.NotInstalled:
        return "install";
      case ItemState.UpdateAvailable:
        return "updateavailable";
      case ItemState.Incomplete:
        return "incomplete";
      case ItemState.Installing:
        return "installing";
      case ItemState.Updating:
        return "updating";
      case ItemState.Launching:
        return "launching";
      case ItemState.Uninstalling:
        return "uninstalling";
      default:
        return "install";
    }
  }

  getItemBusyClassInternal(itemState: ItemState) {
    switch (itemState) {
      case ItemState.Installing:
      case ItemState.Uninstalling:
      case ItemState.Updating:
      case ItemState.Launching:
        return "busy";
      default:
        return "";
    }
  }
}

interface IDlc {
  packageName: string;
  name: string;
}

interface IExtendedClientInfo extends IClientInfo {
  dlcs: IDlc[];
}

export class GameClientInfo extends ReactiveBase {
  defaults: { speed: number; progress: number; };
  clientInfo: IExtendedClientInfo = {
    content: {},
    globalLock: false, //obsolete
    gameLock: false,
    isRunning: false,
    canAbort: false,
    actionInfo: null,
    userErrors: [],
    dlcs: []
  }

  game: { id: string }

  get isLocked() { return this.clientInfo.gameLock; }
  get canExecute() { return !this.isLocked; }

  constructor(private eventBus?: EventAggregator, private appEvents?: AppEventsWrapper, private clientWrapper?: ClientWrapper, gameId?: string) {
    super();
    this.game = { id: gameId };
    if (gameId == null) return;

    this.defaults = { speed: null, progress: null };

    let withInform = (fnc) => { let r = fnc(); this.informAngular(); return r; }

    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe("status.launchedGame", (id: string) => {
        if (this.game.id != id) return;
        this.clientInfo.isRunning = true;
        this.informAngular();
      }));
      d(this.eventBus.subscribe("status.terminatedGame", (id: string) => {
        if (this.game.id != id) return;
        this.clientInfo.isRunning = false;
        this.informAngular();
      }));

      d(this.eventBus.subscribe("status.lockedGame", (args) => {
        let id = args[0];
        if (this.game.id != id) return;
        this.clientInfo.gameLock = true;
        this.clientInfo.canAbort = args[1];
        this.informAngular();
      }));
      d(this.eventBus.subscribe("status.unlockedGame", (id: string) => {
        if (this.game.id != id) return;
        this.clientInfo.gameLock = false;
        this.clientInfo.canAbort = false;
        this.informAngular();
      }));
      d(this.eventBus.subscribe("status.contentStateChanged", (stateChange: IContentStateChange) => {
        if (stateChange.gameId != this.game.id) return;
        angular.forEach(stateChange.states, state => this.handleStateChange(state));
        this.informAngular();
      }));

      // TODO: this is actually progress stuff, not state like above
      d(this.eventBus.subscribe("status.contentStatusChanged", (stateChange: IContentStatusChange) => {
        if (stateChange.gameId != this.game.id) return;
        this.handleStateChange(stateChange);
        this.informAngular();
      }));

      d(this.eventBus.subscribe("content.recentItemUsed", (gameId: string, id: string, info: Date) => {
        if (gameId != this.game.id) return;
        let c = this.clientInfo.content[id];
        if (c) c.lastUsed = info;
      }));

      d(this.eventBus.subscribe("content.recentItemRemoved", (id: string) => {
        //if (gameId != this.game.id) return;
        let c = this.clientInfo.content[id];
        if (c) c.lastUsed = null;
      }));


      // TODO: Move to higher scope, because it is not just per game
      d(this.clientWrapper.actionNotification.subscribe(this.handleActionNotification));
      d(this.clientWrapper.actionUpdateNotification.subscribe(this.handleActionUpdate));
      d(this.clientWrapper.userErrorAdded.subscribe(x => this.clientInfo.userErrors.push(x.userError)));
      d(this.clientWrapper.userErrorResolved.subscribe(x => this.tools.removeEl(this.clientInfo.userErrors, this.clientInfo.userErrors.asEnumerable().firstOrDefault(e => e.id == x.id))));
    });
  }

  isDlcInstalled(dlc: string) { return this.clientInfo.dlcs && this.clientInfo.dlcs.some(x => x.packageName === dlc || x.name === dlc); }

  handleActionNotification = (x: IActionNotification) => {
    let childAction = {
      title: x.title,
      text: x.text,
      href: (<any>x).href,
      //details: null,
      //progress: null,
      //speed: null
    }
    this.clientInfo.actionInfo = {
      type: x.type,
      progress: x.type == ActionType.Start ? 0 : null,
      text: x.title + ' ' + x.text,
      nextActionInfo: x.nextActionInfo,
      childAction: childAction
    }
  }

  handleActionUpdate = (stateChange: IActionTabStateUpdate) => {
    if (!this.clientInfo.actionInfo) return;
    this.clientInfo.actionInfo.progress = stateChange.progress;
    this.clientInfo.actionInfo.childAction.title = stateChange.childAction.title;
    this.clientInfo.actionInfo.childAction.progress = stateChange.childAction.progress;
    this.clientInfo.actionInfo.childAction.speed = stateChange.childAction.speed;
    this.clientInfo.actionInfo.childAction.details = stateChange.childAction.details;
  }

  informAngular = () => this.appEvents.emitBasketChanged();

  handleStateChange(state: IContentState) {
    if (state.state === ItemState.NotInstalled) {
      delete this.clientInfo.content[state.id];
      this.eventBus.publish('contentInfoStateChange-' + state.id, null);
    } else if (this.clientInfo.content[state.id]) Object.assign(this.clientInfo.content[state.id], this.defaults, state);
    else {
      this.clientInfo.content[state.id] = state;
      this.eventBus.publish('contentInfoStateChange-' + state.id, state);
    }
  }

  dispose() { this.subscriptions.dispose(); }
}

export enum ProcessingState {
  //General,
  RequiresApprovalUploadFinished = -5,
  ManagerAbandoned = -4,
  RequiresApproval = -3,
  UserCancelled = -2,
  UnknownFailure = -1,
  Uninitialized = 0,
  Initializing = 1,
  Finished = 2,
  Yanked = 3,

  //ProcessingQueue
  QueuedForProcessing = 50,

  //Downloading
  AddingToDownloadService = 100,
  DownloadServiceUnavailible = 101,
  LinkUnavailible = 102,
  WaitingForDownloadStart = 110,
  Downloading = 120,
  DownloadingFailed = 121,
  Downloaded = 199,

  //Extraction
  Extracting = 200,
  ExtractFailed = 201,
  Extracted = 299,

  //RestructureTool
  Restructuring = 300,
  RestructureFailed = 301,
  RestructureWaitingOnAdmin = 310,

  //Network
  PreparingNetwork = 400,
  PreparingNetworkFailed = 401,
  Syncing = 410,
  SyncFailed = 411,
  NoChangesFound = 412,
  SignalFailed = 420
}

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

  mods: string[];
  missions: string[];
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

  protected async _pollOperationState<T>(id: string, operationId: string, ct?: Promise<void>) {
    let status: IOperationStatusT<T> = { state: OperationState.Queued, result: null };

    let cancelled = false;
    if (ct) { ct.then(_ => cancelled = true); }

    while (!cancelled && status.state < OperationState.Completed) {
      //try {
      status = await this.getOperation<T>(id, operationId);
      //} catch (err) {
      // todo
      //}
      await this.delay(2000);
    }
    if (cancelled && status.state < OperationState.Completed) {
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
  Prepare
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

  start(id: string, ct?: Promise<void>) { return this.changeState(id, Action.Start, ct); }
  stop(id: string, ct?: Promise<void>) { return this.changeState(id, Action.Stop, ct); }
  restart(id: string, ct?: Promise<void>) { return this.changeState(id, Action.Restart, ct); }
  prepare(id: string, ct?: Promise<void>) { return this.changeState(id, Action.Prepare, ct); }

  private async changeState(id: string, action: Action, ct?: Promise<void>) {
    const operationId = await this._post<string>(`/${id}/${Action[action].toLowerCase()}`);
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
  PreparingConfiguration,

  Provisioning = 5000,
  InstancesRunning,
  PreparingLaunch,

  LaunchingGame = 6000,

  GameIsRunning = 7000,

  Cancelling = 8000,

  StoppingInstances,
  GameExited,

  Failed = 9999,
  Cancelled = 10000,
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

  currentJobId: string;

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
    if (servers.items.length > 0) {
      game.activeServer = ServerStore.storageToServer(await client.servers.get(servers.items[0].id));
      await augmentMods(Array.from(game.activeServer.mods.values()));
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

  public static storageToServer(s: IManagedServer): ManagedServer {
    return new ManagedServer({
      adminPassword: s.adminPassword,
      additionaSlots: s.additionalSlots,
      id: s.id,
      location: s.location,
      missions: s.missions.toMapValue(x => x, x => { return { id: x } }),
      mods: s.mods.toMapValue(x => x, x => { return { id: x } }),
      name: s.name,
      password: s.password,
      secondaries: s.secondaries,
      settings: s.settings,
      size: s.size,
    });
  }

  public static serverToStorage(s: ManagedServer): IManagedServer {
    return {
      adminPassword: s.adminPassword,
      additionalSlots: s.additionalSlots,
      id: s.id,
      location: s.location,
      missions: Array.from(s.missions.keys()),
      mods: Array.from(s.mods.keys()),
      name: s.name,
      password: s.password,
      secondaries: s.secondaries,
      settings: s.settings,
      size: s.size,
    };
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
