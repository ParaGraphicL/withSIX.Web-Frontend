import {ViewModel, Query, DbQuery, handlerFor, IGame, ITab, IMenuItem, MenuItem, uiCommand2, VoidCommand,
  CollectionScope, IBreezeCollectionVersion, IBreezeCollectionVersionDependency, BasketItemType, TypeScope, UiContext, CollectionHelper, Confirmation, MessageDialog,
  ReactiveList, IBasketItem, FindModel, ActionType, BasketState, BasketType, ConnectionState, Debouncer, GameChanged, uiCommandWithLogin2, GameClientInfo, UninstallContent,
  IBreezeCollection, IRequireUser, IUserInfo, W6Context, Client, UploadService, BasketService, CollectionDataService, DbClientQuery, Utils, requireUser, ICollection} from '../../../framework';
import {CreateCollectionDialog} from '../../games/collections/create-collection-dialog';
import {Basket, GameBaskets} from '../../game-baskets';
import {inject} from 'aurelia-framework';
import {DeleteCollection, ForkCollection, LoadCollectionIntoBasket, GetDependencies} from '../../profile/content/collection';

interface ICollectionsData {
  collections: IPlaylistCollection[];
}

@inject(UiContext, BasketService, Client)
export class Playlist extends ViewModel {
  rxProperties: IDisposable;
  rxList: ReactiveList<IBasketItem>;
  model: ITab;
  menuItems: IMenuItem[] = [];
  serverOrMissionMenuItems: IMenuItem[] = [];
  shown = false;
  CollectionScope = CollectionScope;
  scopes = CollectionHelper.scopes;
  scopeHints = CollectionHelper.scopeHints;
  collection: IPlaylistCollection;
  findModel: FindModel<ICollection>;
  collections: IPlaylistCollection[] = [];
  collectionMenu = [];

  constructor(ui: UiContext, protected basketService: BasketService, protected client: Client) {
    super(ui);
  }

  get collectionScopeIcon() { return this.collection ? CollectionHelper.scopeIcons[this.collection.scope] : ''; }
  get collectionScopeHint() { return this.collection ? CollectionHelper.scopeHints[this.collection.scope] : null; }

  get isExecuting() { return this.action.isExecuting || this.gameInfo.clientInfo.gameLock; }
  get activeGameName() { return !this.w6.activeGame.id ? "" : this.w6.activeGame.slug.replace("-", " "); }
  get activeBasket() { return this.baskets.active; }
  get basket() { return this.activeBasket.model; }
  get basketItems() { return this.baskets.active.model.items; }
  get chain() { return this.activeBasket.chain; }
  get basketCount() { return this.basket.items.length; }
  get basketTotalCount() { return this.activeBasket.chain.size; }
  get stat() { return this.activeBasket.stat; }
  get basketTotalSize() { return this.stat.sizePacked; }
  get collectionChanged() { return this.basket.changed; }
  set collectionChanged(value: boolean) { this.basket.changed = value; }
  get isCollection() { return this.collection != null; }
  get isYourCollection() { return this.isCollection && this.collection.typeScope == TypeScope.Published }
  get hasItems() { return this.basket.items.length > 0 }
  get canAbort() { return this.gameInfo.clientInfo.canAbort; }
  get activeStateClass() { return Playlist.getStateClass(this.baskets ? this.baskets.active : null, this); }

  lockBasket = false;
  isSearchOpen = false;
  overrideBasketState = "";
  game = { id: null, slug: null };
  gameInfo: GameClientInfo = new GameClientInfo(null, null, null);
  baskets: GameBaskets;
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
  get defaultPlaylistUrl() { return this.assets.defaultPlaylistUrl }
  get locked() { return this.lockBasket || this.gameInfo.isLocked; }
  get canSaveBasket() { return this.baskets && this.baskets.active && this.baskets.active.model.items.length > 0 }

  async activate(model) {
    if (this.model === model) return;
    if (this.w6.activeGame.id) await this.gameChanged(this.w6.activeGame);
    this.model = model;

    this.menuItems.push(new MenuItem(this.saveBasket));
    this.menuItems.push(new MenuItem(this.clearBasket));

    this.subscriptions.subd(d => {
      d(this.action);
      d(this.findModel = new FindModel(this.findCollections, (col: IPlaylistCollection) => this.selectCollection(col), e => e.name));
      d(ViewModel.toProperty(this.observeEx(x => x.isCollection).select(x => x ? "Save as new collection" : "Save as collection"), x => x.name, this.saveBasket));
      d(this.saveBasket);
      d(this.saveBasket2);
      d(this.disposeOld);
      d(this.abort = uiCommand2("Cancel", async () => {
        await this.client.abort(this.activeBasket.model.gameId);
      }, {
          isVisibleObservable: this.observeEx(x => x.isExecuting),
          canExecuteObservable: this.observeEx(x => x.canAbort),
          cls: "ignore-close abort-btn",
          icon: "icon withSIX-icon-X",
          textCls: "aurelia-hide"
        }));
      d(this.unloadCollection = uiCommand2("", this.unload, {
        icon: "icon withSIX-icon-X",
        cls: 'ignore-close text-button',
        tooltip: 'Unload collection'
      }));
      d(this.saveCollection = uiCommand2("Save", async () => {
        await new Save({
          id: this.collection.id,
          scope: this.collection.scope,
          dependencies: this.basket.items.map(x => { return { dependency: x.packageName, constraint: x.constraint } })
        }).handle(this.mediator);
        this.collectionChanged = false;
      }, {
          cls: 'ok ignore-close',
          canExecuteObservable: this.observeEx(x => x.hasItems),
          isVisibleObservable: this.observeEx(x => x.collectionChanged).combineLatest(this.observeEx(x => x.isYourCollection), (x, y) => x && y)
        }));
      d(this.undoCollection = uiCommand2("Cancel", async () => {
        await this.updateCollections();
        this.disposeOld();
        let col = this.collections.asEnumerable().first(x => x.id == this.collection.id);
        await this.loadCollectionVersion(col.latestVersionId, col.gameId);
        this.updateCollection(col);
      }, {
          cls: 'cancel ignore-close',
          isVisibleObservable: this.observeEx(x => x.collectionChanged)
        }));
      d(this.appEvents.gameChanged.subscribe(this.gameChanged));
    });

    if (this.basket.collectionId) {
      let c = this.collections.asEnumerable().firstOrDefault(x => x.id == this.basket.collectionId);
      if (c) this.updateCollection(c, this.collectionChanged);
      else this.basket.collectionId = null;
    }
  }
  newBasket = () => this.baskets.replaceBasket()
  deleteBasket = () => this.baskets.deleteBasket(this.baskets.active);
  unload = async () => {
    if (!this.isCollection || !this.collectionChanged || await this.confirm("Do you wish to discard the changes?")) {
      this.updateCollection(null);
      this.newBasket();
    }
  }

  findCollections = async (searchItem: string) => {
    await this.updateCollections();
    return searchItem ? this.collections.asEnumerable().where(x => x.name && x.name.containsIgnoreCase(searchItem)).toArray() : this.collections
  }

  toggleSearch = () => { this.isSearchOpen = !this.isSearchOpen; }
  closeSearch = () => { this.isSearchOpen = false; }

  saveBasketInternal = async () => {
    var activeBasket = this.baskets.active;
    var basket = activeBasket.model;
    var gameSlug = this.game.slug;
    var model = {
      name: null, // basket.name
      gameId: basket.gameId,
      version: "0.0.1",
      forkedCollectionId: basket.collectionId,
      dependencies: basket.items.asEnumerable().where(x => x.packageName ? true : false).select(x => { return { dependency: x.packageName, constraint: x.constraint } }).toArray()
    };
    if (model.dependencies.length == 0)
      throw new Error("There are no items in this playlist...");

    var result = await this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.game, model: model } });
    if (result.wasCancelled) return;
    await this.unload();
  }

  saveAsNewCollectionInternal = () => this.baskets.active.saveAsNewCollection();

  saveBasket = uiCommandWithLogin2("Create Collection", this.saveBasketInternal, {
    canExecuteObservable: this.observeEx(x => x.canSaveBasket),
    isVisibleObservable: this.observeEx(x => x.canSaveBasket),
    cls: 'save-as-collection',
    icon: 'withSIX-icon-Hexagon-Cloud'
  });
  saveBasket2 = uiCommandWithLogin2("Save as\nCollection", this.saveBasketInternal, {
    canExecuteObservable: this.observeEx(x => x.canSaveBasket),
    isVisibleObservable: this.observeEx(x => x.canSaveBasket),
    cls: 'save-as-collection',
    icon: 'withSIX-icon-Hexagon-Cloud'
  });
  saveBasket3 = uiCommandWithLogin2("Save as \nCopy", this.saveAsNewCollectionInternal, {
    canExecuteObservable: this.observeEx(x => x.canSaveBasket),
    isVisibleObservable: this.observeEx(x => x.canSaveBasket),
    cls: 'save-as-collection',
    icon: 'withSIX-icon-Hexagon-Cloud',
    tooltip: 'This will create an identical copy of this collection that you can edit'
  });
  clearBasket = uiCommand2("Clear", this.unload, { icon: "icon withSIX-icon-Square-X", cls: "ignore-close" });

  async getMyCollections() {
    var result = await new GetMyCollections(this.game.id, true).handle(this.mediator);
    return result.collections;
  }

  debouncer = Debouncer.debouncePromise(() => this.getMyCollections(), 0);

  async updateCollections() { this.collections = await this.debouncer(); }


  // This is static, a workaround for Aurelia to refresh the info regularly

  // TODO: Only refresh based on events:
  // 1. Refresh when action finishes
  // 2. Refresh when individual content states change
  // 3. Refresh when version info changed of individual items (constraint )
  static getStateClass(basket: Basket, pl: Playlist) { return pl.getStateClass(basket); }

  getStateClass(basket: Basket) {
    if (!this.w6.miniClient.isConnected) {
      if (this.locked) return "busy";
      return "no-client";
    }

    if (this.overrideBasketState != "") return this.overrideBasketState;
    let cInfo = this.gameInfo.clientInfo;
    if (this.action.isExecuting && cInfo.actionInfo && cInfo.actionInfo.type == ActionType.Start) return "busy-active";
    if (cInfo.gameLock || cInfo.globalLock) return "busy";

    if (basket == null) return "install";
    if (this.locked) return "busy";
    switch (basket.getState(this.gameInfo.clientInfo)) {
      case BasketState.Unknown:
        return "install";
      case BasketState.Install:
        return "install";
      case BasketState.Launch:
        return "launch";
      case BasketState.Syncing:
        return "syncing";
      case BasketState.Update:
        return "update";
    }
    return null;
  };

  disposeOld = () => {
    if (this.rxList) this.rxList.dispose();
    if (this.rxProperties) this.rxProperties.dispose();
  }

  updateCollection(c: IPlaylistCollection, startVal = false) {
    this.disposeOld();
    this.collection = c;
    if (c != null) {
      (<any>this.collection).url = `/p/${this.collection.gameSlug}/collections/${this.collection.id.toShortId()}/${this.collection.name.sluggifyEntityName()}`;
      this.rxList = this.listFactory.getList(this.basket.items);
      let listObs = Rx.Observable.merge(this.rxList.itemsAdded.select(x => true), this.rxList.itemsRemoved.select(x => true), this.rxList.itemChanged.where(x => x.propertyName == "constraint").take(1).select(x => true));
      let objObs = ViewModel.observeEx(c, x => x.scope).skip(1).take(1).select(x => true);
      let obs = Rx.Observable.merge(listObs, objObs).startWith(startVal).take(2);
      listObs.subscribe(x => { this.tools.Debug.log("$$$ list val", x); });
      objObs.subscribe(x => { this.tools.Debug.log("$$$ obj val", x); });
      obs.subscribe(x => { this.tools.Debug.log("$$$ merged val", x); });
      this.rxProperties = this.toProperty(obs, x => x.collectionChanged)
    } else {
      this.collectionChanged = false;
    }
    this.setupCollectionMenu();
  }

  abort;
  unloadCollection;
  saveCollection;
  undoCollection;
  action = uiCommand2("Execute", () => this.executeBasket(this.activeBasket), { canExecuteObservable: this.observeEx(x => x.isNotLocked) });

  gameChanged = async (info: GameChanged) => {
    let equal = this.game.id == info.id;
    this.tools.Debug.log("$$$ ClientBar Game Changed: ", info, equal);
    if (equal) return;
    // TODO: All this data should actually change at once!
    this.baskets = null;
    this.game.id = info.id;
    this.game.slug = info.slug;
    this.collections = [];
    //this.gameInfo = null;
    if (this.game.id) {
      this.gameInfo = await this.basketService.getGameInfo(this.game.id);
      await this.updateCollections();
    }
    this.baskets = this.game.id ? this.basketService.getGameBaskets(this.game.id) : null;
  }

  async executeBasket(basket: Basket) {
    if (this.client.state == ConnectionState.disconnected) {
      //await this.client.getInfo(); // TODO: this shouyld not be needed! // instead of connection.promise();
      return;
    }
    if (this.locked) {
      this.toastr.error("Client is currently busy", "Busy");
      return;
    }
    if (basket.model.basketType == BasketType.SingleCollection) {
      var gb = this.basketService.getGameBaskets(basket.model.gameId);
      gb.subscribeCollection(basket.model.id);
    }

    // TODO: This is largely duplicate with basket-service GameBaskets,
    let state = basket.getState(this.gameInfo.clientInfo);
    switch (state) {
      case BasketState.Unknown:
        await basket.install();
        return;
      case BasketState.Install:
        this.overrideBasketState = "syncing";
        this.lockBasket = true;
        try {
          await basket.install();
        } finally {
          this.overrideBasketState = "";
          this.lockBasket = false;
        };
        return;
      case BasketState.Launch:
        this.overrideBasketState = "launching";
        this.lockBasket = true;
        try {
          await basket.launch();
        } finally {
          this.overrideBasketState = "";
          this.lockBasket = false;
        };
        return;
      case BasketState.Syncing:
        return;
      case BasketState.Update:
        await basket.install()
        return;
      default: {
        throw new Error("Unknown action!");
      }
    }
  }

  get isNotLocked() { return !this.locked; }

  selectCollection = async (col: IPlaylistCollection) => {
    if (this.basket.items.length == 0 || (this.collection != null && !this.collectionChanged) || await this.confirm("Do you want to overwrite your current Playlist?")) {
      await this.loadCollection(col);
      this.findModel.searchItem = '';
      this.isSearchOpen = false;
    }
  }
  visitCollection = (col: ICollection) => this.navigateInternal(`/p/${col.gameSlug}/collections/${col.id.toShortId()}/${col.name.sluggifyEntityName()}`)
  loadCollection = async (col: IPlaylistCollection) => {
    this.disposeOld();
    await new LoadCollectionIntoBasket(col.id).handle(this.mediator);
    this.updateCollection(col);
  }
  setupCollectionMenu() {
    this.collectionMenu = [];
    if (!this.isCollection) return;
    let published = this.collection.typeScope == TypeScope.Published;
    this.subscriptions.subd(d => {
      if (published) {
        let edit;
        d(edit = uiCommand2("Edit", async () => this.navigateInternal("/p/" + this.collection.gameSlug + "/collections/" + this.collection.id.toShortId() + "/" + this.collection.name.sluggify() + "/content/edit"), { icon: "icon withSIX-icon-Edit-Pencil" }))
        this.collectionMenu.push(new MenuItem(edit))
      }

      let fork;
      d(fork = uiCommand2("Save as copy", async () => {
        let id = await new ForkCollection(this.collection.id).handle(this.mediator);
        this.navigateInternal("/p/" + this.collection.gameSlug + "/collections/" + id.toShortId() + "/" + (this.collection.name + " [Forked]").sluggify());
        await this.unload();
      }, { icon: "fa fa-code-fork" }));
      this.collectionMenu.push(new MenuItem(fork));

      if (this.collection.typeScope != null) {
        let del;
        d(del = this.createDeleteCommand());
        this.collectionMenu.push(new MenuItem(del));
      }
    });
  }

  createDeleteCommand = () => this.collection.typeScope == TypeScope.Subscribed
    ? uiCommand2("Unsubscribe", () => this.deleteInternal("This will unsubscribe from the collection, do you want to continue?", "Unsubscribe collection?"),
      { icon: "icon withSIX-icon-Square-X" })
    : uiCommand2("Delete", () => this.deleteInternal("This will delete your collection, do you want to continue?", "Delete collection?"), { icon: "icon withSIX-icon-Square-X" })

  deleteInternal = async (title: string, message: string) => {
    let isInstalled = this.activeBasket.getState(this.gameInfo.clientInfo) >= 3;
    let confirmations: Confirmation[] = isInstalled ? [{ text: 'Uninstall all mods from this collection', icon: 'withSIX-icon-Alert', hint: "This will physically delete all the content of this collection, even if its being used elsewhere" }] : undefined; // todo; have the checked ones come back over the result instead?
    let r = await this.showMessageDialog(title, message, MessageDialog.YesNo, confirmations);
    if (r.output != "yes") return;
    // TODO: Extend delete?
    if (isInstalled && confirmations[0].isChecked)
      await new UninstallContent(this.collection.gameId, this.collection.id, { text: this.collection.name }).handle(this.mediator);

    await new DeleteCollection(this.collection.id, this.collection.gameId, this.collection.typeScope).handle(this.mediator);
    await this.unload();
  }

  loadCollectionVersion = async (id, gameId) => {
    let dependencies = await new GetDependencies(id).handle(this.mediator);
    this.newBasket();
    this.activeBasket.replaceItems(dependencies.map(x => {
      return {
        name: x.dependency,
        packageName: x.dependency,
        constraint: x.constraint,
        id: x.modDependencyId,
        itemType: BasketItemType.Mod,
        gameId: gameId,
        image: null,
        author: null,
        sizePacked: null
      }
    }));
  }

  attached() { setTimeout(() => this.shown = true, 0.6 * 1000); } // animation delay. // TODO: have actual animation end trigger..
}

interface IDependency {
  dependency: string;
  constraint?: string;
}

interface ICollectionData {
  id: string;
  scope: CollectionScope,
  dependencies: IDependency[];
}

class Save extends VoidCommand {
  constructor(public model: ICollectionData) { super() }
}

@handlerFor(Save)
class SaveHandler extends DbQuery<Save, void> {
  async handle(request: Save) {
    // var servers = [];
    // var repositories = [];
    // if (request.model.repositories)
    //   repositories = repositories.concat(request.model.repositories.split(";"));
    // if (request.model.servers[0].address)
    //   servers.push(request.model.servers[0]);
    await this.context.postCustom("collections/" + request.model.id, {
      scope: request.model.scope,
      dependencies: request.model.dependencies
      //preferredClient: request.model.preferredClient
    })
  }
}

interface ICollectionModel {
  name: string;
  initialVersion: {
    dependencies: { dependency: string, constraint?: string }[],
    version: string;
  }
}

// class NotTemporaryMenuItem<T> extends MenuItem<T> {
//   constructor(name: string, action: () => Promise<any>, private bar: ClientBar, options?) { super(name, action, () => bar.model && bar.model.active.model.isTemporary, options); }
// }


@requireUser()
export class GetMyCollections extends Query<ICollectionsData> implements IRequireUser {
  constructor(public id: string, public includeSubscribed = true) { super() }
  user: IUserInfo;
}

@handlerFor(GetMyCollections)
@inject(W6Context, Client, UploadService, BasketService, CollectionDataService)
class GetMyCollectionsHandler extends DbClientQuery<GetMyCollections, ICollectionsData> {
  constructor(dbContext, client, uploadService, bs: BasketService, private collectionDataService: CollectionDataService) {
    super(dbContext, client, uploadService, bs);
  }
  public async handle(request: GetMyCollections): Promise<ICollectionsData> {
    var optionsTodo = {
      /*                    filter: {},
                          sort: {
                              fields: [],
                              directions: []
                          },
                          pagination: {}*/
    };
    // TODO: only if client connected get client info.. w6.miniClient.isConnected // but we dont wait for it so bad idea for now..
    // we also need to refresh then when the client is connected later?
    var p = [
      //this.getClientCollections(request)
    ];

    if (request.user.id) {
      p.push(this.getMyCollections(request, optionsTodo));
      if (request.includeSubscribed) p.push(this.getSubscribedCollections(request, optionsTodo));
    }
    var results = await Promise.all<Enumerable<IPlaylistCollection>>(p)
    return { collections: Utils.concatPromiseResults(results).toArray() };
    // return GetCollectionsHandler.designTimeData(request);
  }

  async getClientCollections(request: GetMyCollections) {
    var r = await this.client.getGameCollections(request.id);
    return r.collections.asEnumerable().select(x => { x.typeScope = TypeScope.Local; return x; });
  }

  async getMyCollections(request: GetMyCollections, options) {
    var r = await this.collectionDataService.getCollectionsByMeByGame(request.id, options)
    // for (var i in r) {
    //   var c = r[i];
    //   await c.latestVersion.entityAspect.loadNavigationProperty("dependencies");
    // }
    return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Published));
  }

  async getSubscribedCollections(request: GetMyCollections, options) {
    var r = await this.collectionDataService.getMySubscribedCollections(request.id, options);
    return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Subscribed));
  }

  convertOnlineCollection(collection: IBreezeCollection, type: TypeScope): IPlaylistCollection {
    return Object.assign({}, CollectionHelper.convertOnlineCollection(collection, type, this.w6), {
      modsCount: collection.modsCount,
      subscribersCount: collection.subscribersCount,
      scope: CollectionScope[collection.scope],
      size: collection.size,
      latestVersionId: collection.latestVersion.id
    });
  }
}

export interface IPlaylistCollection extends ICollection {
  id: string, name: string; typeScope: TypeScope,
  image: string, slug: string; gameId: string; gameSlug: string; version: string;
  author: string; modsCount: number; size: number; sizePacked: number; type: string;
  hasServers: boolean; subscribersCount: number; scope: CollectionScope;
  latestVersionId: string; authorSlug: string;
}
