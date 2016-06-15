import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {Base} from './base';
import {Toastr} from './toastr';
import {ObservableEventAggregator} from './reactive';
import {LegacyBasketService, BasketType, IBasketModel, IBasketItem, BasketState, IBasketCollection, W6Context} from './legacy';
import {ContentHelper} from './helpers';
import {ActionType, IActionNotification, Client, ConnectionState, IContentState, ItemState, IContentStateChange, IContentStatusChange, IClientInfo, IActionTabStateUpdate, StateChanged, IContentGuidSpec, IContentsBase, IContentBase,
  IUserErrorAdded, IUserErrorResolved} from 'withsix-sync-api';
import {ClientWrapper, AppEventsWrapper} from './client-wrapper';
import {GameBaskets} from '../features/game-baskets';

@inject(LegacyBasketService, EventAggregator, W6, Client, Toastr, ClientWrapper, AppEventsWrapper)
export class BasketService extends Base {
  private clientInfos: { [id: string]: GameClientInfo } = {};
  private clientPromises: { [id: string]: Promise<GameClientInfo> } = {};
  busyCount = 0;

  constructor(public basketService: LegacyBasketService, private eventBus: EventAggregator, private w6: W6, private client: Client, public logger: Toastr, private clientWrapper: ClientWrapper, private appEvents: AppEventsWrapper) {
    super();

    this.subscriptions.subd(d => {
      d(this.clientWrapper.stateChanged.subscribe(async (state) => {
        switch (state.newState) {
          case ConnectionState.connected:
            try {
              await this.handleConnected();
            } catch (err) {
              Tools.Debug.log("$$$ err", err);
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

  getGameBaskets = (gameId: string) => <GameBaskets>this.basketService.getGameBaskets(gameId)

  refresh() { this.basketService.refresh(); }

  get lastActiveItem() { return this.basketService.lastActiveItem; }
  set lastActiveItem(value: string) { this.basketService.lastActiveItem = value; }
  abort(gameId: string) { return this.basketService.abort(gameId); }

  async handleConnected() {
    this.basketService.settings.hasConnected = true;

    let promises = [];
    Tools.Debug.log("$$$ handling connected", this.clientInfos);
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
      Tools.Debug.log("$$$ err", err);
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
      Tools.Debug.log("$$$ ClientInfo Update", clientInfo.clientInfo);
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
    Tools.Debug.log("$$$ Getting game info", gameId);
    return this.clientPromises[gameId] = this.client.state == ConnectionState.connected ? this.Int(ci) : Promise.resolve(ci);
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

export class GameClientInfo extends Base {
  defaults: { speed: number; progress: number; };
  clientInfo: IClientInfo = {
    content: {},
    // TODO: status is currently in the client something global.., must be made per game
    globalLock: false,
    gameLock: false,
    isRunning: false,
    canAbort: false,
    actionInfo: null,
    userErrors: []
  }

  game: { id: string }

  get isLocked() { return this.clientInfo.globalLock || this.clientInfo.gameLock; }
  get canExecute() { return !this.isLocked; }

  constructor(private eventBus?: EventAggregator, private appEvents?: AppEventsWrapper, private clientWrapper?: ClientWrapper, gameId?: string) {
    super();
    this.game = { id: gameId };
    if (gameId == null) return;

    this.defaults = { speed: null, progress: null };

    let withInform = (fnc) => { let r = fnc(); this.informAngular(); return r; }

    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe("status.locked", () => withInform(() => this.clientInfo.globalLock = true)));
      d(this.eventBus.subscribe("status.unlocked", () => withInform(() => this.clientInfo.globalLock = false)));
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
      d(this.clientWrapper.userErrorResolved.subscribe(x => Tools.removeEl(this.clientInfo.userErrors, this.clientInfo.userErrors.asEnumerable().firstOrDefault(e => e.id == x.id))));
    });
  }

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
    if (state.state == ItemState.NotInstalled) {
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
  SignalFailed = 420
}
