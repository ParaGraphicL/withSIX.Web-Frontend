import {inject} from 'aurelia-framework';
import {IBasketItem, BasketItemType, IBreezeMod, ModsHelper, Helper, FolderType, IReactiveCommand,
  BasketService, UiContext, uiCommand2, ViewModel, Base, MenuItem, IMenuItem, GameClientInfo, uiCommand, Mediator, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IContentState, ItemState,
  Abort, UninstallContent, OpenFolder, LaunchContent, InstallContent, UnFavoriteContent, FavoriteContent, IBreezeUser, ContentHelper,
  breeze, ModHelper, IBreezeCollection, IBreezeCollectionVersion} from '../../../framework';
import {GameBaskets, Basket} from '../../game-baskets';
import {DialogService} from 'aurelia-dialog';
import {EditPlaylistItem} from './edit-playlist-item';
import {AddModsToCollections} from '../../games/add-mods-to-collections';


interface IPlayModel {
  level: number;
  item: IBasketItem,
  isDependency?: boolean;
  chain: Map<string, IBasketItem>;
  localChain: string[];
  currentGameId: string;
  stat: { sizePacked: number; }
}

@inject(UiContext, BasketService, DialogService)
export class PlaylistItem extends ViewModel {
  isForActiveGame: boolean;
  gameInfo: GameClientInfo;
  basket: GameBaskets;
  model: IBasketItem;
  chain: Map<string, IBasketItem>;
  dependencies: IBasketItem[] = [];
  menuItems: IMenuItem[] = [];
  bottomActions: IMenuItem[] = [];
  launchMenuItem: IMenuItem;
  level: number;
  url: string;
  localChain: string[];
  showDependencies = false;
  image: string;
  currentGameId: string;
  state: IContentState;
  isDependency: boolean;
  stat;
  isActive: boolean;
  isBusy: boolean;

  isInstalledObservable;
  isNotInstalledObservable;
  canExecuteObservable;

  addToCollections;

  diagnose: IReactiveCommand<void>;
  edit: IReactiveCommand<void>;
  removeFromBasket: IReactiveCommand<void>;
  omni: IReactiveCommand<void>;
  install: IReactiveCommand<void>;
  uninstall: IReactiveCommand<void>;
  update: IReactiveCommand<void>;
  launch: IReactiveCommand<void>;
  abort: IReactiveCommand<void>;
  openFolder: IReactiveCommand<void>;
  openConfigFolder: IReactiveCommand<void>;
  gameName: string;
  itemType: string;

  get isInstalled() { return this.itemState != ItemState.Incomplete };
  get hasUpdateAvailable() { return this.isInstalled && this.itemState == ItemState.UpdateAvailable }
  // Is really 'not uptodate'
  get isNotInstalled() { return !this.isInstalled || this.itemState != ItemState.Uptodate };

  constructor(ui: UiContext, private basketService: BasketService, private dialogService: DialogService) {
    super(ui);
  }

  getNoteInfo() { return { text: this.model.name || this.model.packageName, href: this.url } };

  async activate(model: IPlayModel) {
    if (model == null) throw Error("model cannot be null!");
    if (model.item == null) throw Error("model.item cannot be null!");
    if (model.chain == null) throw Error("model.chain cannot be null!");
    if (model.currentGameId == null) throw Error("model.currentGameId cannot be null!");
    if (model.level == null) throw Error("model.chain cannot be null!");
    if (model.stat == null) throw Error("model.stat cannot be null!");
    this.model = model.item;
    if (this.model.id == null) this.tools.Debug.log("$$$ null id!", this.model);
    this.chain = model.chain;
    this.stat = model.stat;
    this.currentGameId = model.currentGameId;
    this.localChain = model.localChain || [];
    this.level = model.level;
    this.isDependency = model.isDependency;
    if (this.level === 0 || !this.chain.has(this.model.id))
      this.chain.set(this.model.id, this.model);
    if (this.level !== 0) this.showDependencies = true;
    this.basket = this.basketService.getGameBaskets(model.currentGameId);
    this.url = this.getBasketItemUrl();

    this.gameInfo = await this.basketService.getGameInfo(model.currentGameId); // hack

    this.isForActiveGame = this.model.gameId == model.currentGameId;

    this.itemType = this.model.itemType === BasketItemType.Collection ? 'mod' : 'dependency';

    try {
      // TODO: WHy use such complicated things when we have an id already??
      if (this.model.id) {
        let data = this.model.itemType == BasketItemType.Mod ? await new GetModDependencies(this.model.packageName, this.model.gameId, this.localChain, this.chain, this.currentGameId, this.model.id).handle(this.mediator)
          : await new GetCollectionDependencies(this.model.gameId, this.model.id, this.localChain, this.chain, this.currentGameId).handle(this.mediator);
        this.dependencies = data.dependencies;
        this.model.name = data.name;
        this.model.sizePacked = data.sizePacked;
        this.model.author = data.authorText || data.author.displayName;
        this.model.image = data.avatar ? this.w6.url.getUsercontentUrl2(data.avatar, data.avatarUpdatedAt) : null;
        (<any>this.model).version = data.version;
      } else {
        this.dependencies = [];
        this.model.sizePacked = 0;
      }
    } catch (err) {
      this.tools.Debug.error("Error while trying to retrieve dependencies for " + this.model.id, err);
    }

    if (this.model.itemType !== BasketItemType.Collection) this.stat.sizePacked = this.stat.sizePacked + this.model.sizePacked;
    this.image = this.model.image || this.w6.url.getAssetUrl('img/noimage.png');

    this.gameName = (this.isForActiveGame ? this.w6.activeGame.slug : 'Arma-2').replace("-", " "); //(this.model.originalGameSlug || this.model.gameSlug).replace("-", " ");

    this.subscriptions.subd(d => {
      this.updateState();
      this.isInstalledObservable = this.whenAnyValue(x => x.isInstalled);
      this.isNotInstalledObservable = this.whenAnyValue(x => x.isNotInstalled);
      this.canExecuteObservable = this.gameInfo.observeEx(x => x.canExecute).combineLatest(this.whenAnyValue(x => x.isBusy), (can, busy) => can && !busy);

      d(this.eventBus.subscribe('refreshContentInfo-' + model.currentGameId, x => this.updateState()));
      d(this.eventBus.subscribe('contentInfoStateChange-' + this.model.id, x => this.updateState()));

      d(this.abort = uiCommand2("Cancel", async () => {
        await new Abort(this.model.gameId, this.model.id).handle(this.mediator);
      }, {
          isVisibleObservable: this.whenAnyValue(x => x.isActive),
          icon: "icon withSIX-icon-X"
        }));
      d(this.uninstall = uiCommand2("Uninstall", async () => {
        //this.emitGameChanged();
        if (await this.confirm("Are you sure you want to uninstall this content?"))
          await new UninstallContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator)
      }, {
          isVisibleObservable: this.isInstalledObservable,
          canExecuteObservable: this.canExecuteObservable,
          icon: "icon withSIX-icon-Square-X"
        }));

      d(this.omni = uiCommand2("", () => (!this.isInstalled || this.hasUpdateAvailable) ? this.installInternal() : this.launchInternal(), {
        canExecuteObservable: this.canExecuteObservable,
        icon: "content-state-icon",
        textCls: "content-state-text"
      }));


      d(this.install = uiCommand2("", async () => {
        //this.emitGameChanged();
        await this.installInternal();
      }, {
          isVisibleObservable: this.whenAnyValue(x => x.isInstalled).map(x => !x).combineLatest(this.whenAnyValue(x => x.hasUpdateAvailable).map(x => !x), (x, y) => x && y),
          canExecuteObservable: this.canExecuteObservable,
          icon: "content-state-icon",
          textCls: "content-state-text" // TODO
        }));

      d(this.update = uiCommand2("Update", this.installInternal, {
        isVisibleObservable: this.whenAnyValue(x => x.hasUpdateAvailable),
        canExecuteObservable: this.canExecuteObservable,
        icon: 'withSIX-icon-Hexagon-Upload2'
      }));

      d(this.launch = uiCommand2("Launch", async () => {
        //this.emitGameChanged();
        await this.launchInternal();
      }, {
          isVisibleObservable: this.isInstalledObservable,
          canExecuteObservable: this.canExecuteObservable,
          icon: "content-state-icon" // TODO
        }));

      d(this.diagnose = uiCommand2("Diagnose", async () => {
        await new InstallContent(this.model.gameId, { id: this.model.id }, this.getNoteInfo(), true, true).handle(this.mediator)
      }, {
          isVisibleObservable: this.isInstalledObservable,
          canExecuteObservable: this.canExecuteObservable,
          icon: 'withSIX-icon-Tools'
        }));
      if (this.isLoggedIn) {
        d(this.addToCollections = uiCommand2("Add to ...", async () => this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [this.model] } }), { icon: 'withSIX-icon-Nav-Collection' }));
      }
      d(this.whenAnyValue(x => x.hasUpdateAvailable)
        .skip(1)
        .subscribe(x => {
          //this.install.name = x ? "Update" : "Install"
          this.handleUpdateAvailable(x);
        }));

      d(this.openFolder = uiCommand2("Open folder", () => new OpenFolder(this.model.gameId, this.model.id).handle(this.mediator), {
        isVisibleObservable: this.isInstalledObservable,
        icon: 'withSIX-icon-Folder'
      }));
      if (this.w6.activeGame.slug.startsWith('Arma')) {
        d(this.openConfigFolder = uiCommand2("Open config folder", () => new OpenFolder(this.model.gameId, this.model.id, FolderType.Config).handle(this.mediator), { icon: 'icon withSIX-icon-Folder', isVisibleObservable: this.isInstalledObservable }));
      }

      d(this.edit = uiCommand2("Select Version", async () => {
        await this.dialogService.open({ viewModel: EditPlaylistItem, model: this.model });
        this.informAngular();
      }, { icon: "icon withSIX-icon-Edit-Pencil", cls: "ignore-close", canExecuteObservable: this.whenAnyValue(x => x.canEdit) }));

      d(this.removeFromBasket = uiCommand2("Remove", async () => {
        this.basket.active.removeFromBasket(this.model);
        //this.basket.cloneBasket(this.basket.active);
        //this.informAngular();
        // TODO: This should require the dependency chain to be reset .. hm
      }, { icon: "icon withSIX-icon-Square-X", canExecuteObservable: this.whenAnyValue(x => x.canEdit) }));

    });

    this.setupMenuItems();
    this.handleUpdateAvailable(this.hasUpdateAvailable);
  }

  revert() {
    if (this.model.itemType != BasketItemType.Collection) this.stat.sizePacked = this.stat.sizePacked - this.model.sizePacked;
    //Tools.Debug.log("$$$ deactivating", this.model);
    //this.dependencies.forEach(x => this.chain.delete(x.id));
    if (this.chain.get(this.model.id) === this.model)
      this.chain.delete(this.model.id);
  }

  unbind() { this.revert(); }

  get canEdit() { return !this.basket.active.model.isTemporary; }

  installInternal = () => new InstallContent(this.model.gameId, { id: this.model.id, constraint: this.model.constraint }, this.getNoteInfo()).handle(this.mediator);
  launchInternal = () => new LaunchContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator)

  setupMenuItems() {
    this.launchMenuItem = new MenuItem(this.launch);
    if (!this.isDependency) {
      this.menuItems.push(new MenuItem(this.edit));
      this.menuItems.push(new MenuItem(this.removeFromBasket));
    }
    if (this.isLoggedIn) this.menuItems.push(new MenuItem(this.addToCollections));
    this.menuItems.push(this.launchMenuItem);
    this.menuItems.push(new MenuItem(this.install));
    this.menuItems.push(new MenuItem(this.update));
    this.menuItems.push(new MenuItem(this.diagnose));
    this.menuItems.push(new MenuItem(this.uninstall));
    this.menuItems.push(new MenuItem(this.openFolder));
    if (this.openConfigFolder) this.menuItems.push(new MenuItem(this.openConfigFolder));


    this.bottomActions.push(new MenuItem(this.omni));
    //this.bottomMenuActions.push(new MenuItem(this.launch));
  }

  handleUpdateAvailable(updateAvailable: boolean) {
    // if (updateAvailable) {
    //   this.tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
    //   this.bottomMenuActions.push(this.launchMenuItem);
    // } else
    //   this.tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
  }

  updateState() { this.state = this.gameInfo.clientInfo.content[this.model.id]; }

  get progressClass() {
    let state = this.state;
    if (!state || !(state.state == ItemState.Updating || state.state == ItemState.Installing || state.state == ItemState.Uninstalling)) return null;
    let percent = Math.round(state.progress);
    if (percent < 1) return "content-in-progress content-progress-0";
    if (percent > 100) return "content-in-progress content-progress-100";
    return "content-in-progress content-progress-" + percent;
  };

  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.itemState); }
  get itemState() { return this.state ? this.calculateState(this.state.state, this.state.version, this.model.constraint) : null; }
  calculateState(state: ItemState, version: string, constraint: string) { return ContentHelper.getContentState(state, version, constraint); }
  // .filter(x => x.itemType != BasketItemType.Collection)
  get dependencySize() { return this.localChain.map(x => this.chain.get(x)).filter(x => x != null).map(x => x.sizePacked).filter(x => x != null).asEnumerable().sum() }

  informAngular = () => this.appEvents.emitBasketChanged();

  // TODO: why do sub dependencies not return when switching dependencies into and out of playlists??
  // get isVisible() {
  //   // getter and setter, but wth
  //   let id = this.model.id;
  //   if (!this.chain.has(id) || (this.chain.get(id) !== this && this.level == 0)) this.chain.set(id, this);
  //   return this.chain.get(id) === this;
  // }

  // TODO: Fix this pathname madness by having a gameSlug handy!
  getBasketItemUrl() { return this.model.id ? this.w6.url.play + "/" + this.w6.activeGame.slug + "/" + BasketItemType[this.model.itemType || 0].toLowerCase() + "s/" + this.model.id.toShortId() + "/" + this.model.name.sluggifyEntityName() : null; }
}

interface IResult {
  name: string;
  dependencies: IBasketItem[];
  sizePacked: number;
  author: IBreezeUser;
  authorText: string;
  avatar: string;
  avatarUpdatedAt: Date;
  version: string;
}

class GetCollectionDependencies extends Query<IResult> {
  constructor(public gameId: string, public id: string, public localChain: string[], public chain: Map<string, IBasketItem>, public currentGameId: string) {
    super();
    if (gameId == null) throw new Error("gameId can't be null");
    if (id == null) throw new Error("id can't be null");
    if (currentGameId == null) throw new Error("currentGameId can't be null");
  }
}

@handlerFor(GetCollectionDependencies)
class GetCollectionDependenciesHandler extends DbQuery<GetCollectionDependencies, IResult> {
  async handle(request: GetCollectionDependencies) {
    let query = breeze.EntityQuery.from("Collections")
      .where(new breeze.Predicate("id", breeze.FilterQueryOp.Equals, request.id))
      //.withParameters({collectionId: request.id})
      .expand(["author", "latestVersion"])
      .select(["latestVersionId", "latestVersion", "sizePacked", "author", "avatarUpdatedAt", "avatar", "name"]);
    // TODO:
    //.where(request.chain, NOT, breeze.FilterQueryOp.Contains, "id");

    // todo; a manager per chain?
    let meta = await this.context.fetchMetadata();
    let manager = this.context.newManager();
    let r = await this.context.executeQueryWithManager<IBreezeCollection>(manager, query);
    let c = r.results[0];
    if (!c) return {}
    let sizePacked = Math.abs(c.sizePacked);
    //await c.latestVersion.entityAspect.loadNavigationProperty("dependencies");
    let q = breeze.EntityQuery.from("CollectionVersions").where(new breeze.Predicate("id", breeze.FilterQueryOp.Equals, c.latestVersionId)).expand("dependencies");
    await this.context.executeQueryWithManager<IBreezeCollectionVersion>(manager, q);
    // TODO: How to handle 'non network mods'
    let modDependencies = c.latestVersion.dependencies.map(x => x.modDependencyId).filter(x => x != null);
    let nonNetworkDependencies = c.latestVersion.dependencies.filter(x => !x.modDependencyId).map(x => {
      return <IBasketItem>{
        packageName: x.dependency,
        name: x.dependency,
        gameId: request.gameId
      }
    });

    nonNetworkDependencies.forEach(x => request.localChain.push(x.packageName));
    // if (request.gameId != request.currentGameId) {
    //   let compatibilityMods = ModsHelper.getCompatibilityModsFor(request.currentGameId, request.gameId);
    //   if (compatibilityMods.length > 0) {
    //     let compatibilityModIds = await ModHelper.getCompatibilityModIds(compatibilityMods, request.currentGameId, this.context);
    //     compatibilityModIds.forEach(x => { if (!modDependencies.some(x => x == x)) modDependencies.push(x) });
    //   }
    // }

    let dependencies = modDependencies.filter(d => !request.localChain.some(x => x === d));
    if (dependencies.length === 0)
      return {
        dependencies: nonNetworkDependencies,
        sizePacked: sizePacked,
        avatar: c.avatar,
        avatarUpdatedAt: c.avatarUpdatedAt,
        author: c.author,
        name: c.name,
        version: c.latestVersion.version
      };

    let cachedIds = dependencies.filter(x => request.chain.has(x));
    let idsToFetch = dependencies.asEnumerable().except(cachedIds).toArray();

    let fetchedResults: IBasketItem[] = [];

    let desiredFields = ["id", "name", "packageName", "author", "authorText", "gameId", "avatar", "avatarUpdatedAt", "sizePacked"];
    if (idsToFetch.length > 0) {
      var groupSize = 10;
      var groups = idsToFetch.map((item, index) => {
        return index % groupSize === 0 ? idsToFetch.slice(index, index + groupSize) : null;
      }).filter(x => x != null);

      for (var g of groups) {
        let op = { id: { in: g } };
        query = breeze.EntityQuery.from("Mods")
          .where(<any>op)
          .select(desiredFields);
        let r = await this.context.executeQueryWithManager<IBreezeMod>(manager, query);
        let results = r.results.map(x => Helper.modToBasket(x));
        results.forEach(x => request.chain.set(x.id, x));
        fetchedResults = fetchedResults.concat(results);
      }
    }

    let results = fetchedResults.concat(cachedIds.map(x => request.chain.get(x)));
    results.forEach(x => { request.localChain.push(x.id); });
    return {
      dependencies: results.concat(nonNetworkDependencies),
      sizePacked: sizePacked,
      avatar: c.avatar,
      avatarUpdatedAt: c.avatarUpdatedAt,
      author: c.author,
      name: c.name,
      version: c.latestVersion.version
    };

  }
}

class GetModDependencies extends Query<IResult> {
  constructor(public packageName: string, public gameId: string, public localChain: string[], public chain: Map<string, IBasketItem>, public currentGameId: string, public id = null) {
    super();
    if (packageName == null) throw new Error("packageName can't be null");
    if (gameId == null) throw new Error("gameId can't be null");
    if (currentGameId == null) throw new Error("currentGameId can't be null");
  }
}

@handlerFor(GetModDependencies)
class GetModDependenciesHandler extends DbQuery<GetModDependencies, IResult> {
  async handle(request: GetModDependencies) {
    let predicate = request.id ?
      new breeze.Predicate("id", breeze.FilterQueryOp.Equals, request.id)
      : new breeze.Predicate("packageName", breeze.FilterQueryOp.Equals, request.packageName).and(new breeze.Predicate("gameId", breeze.FilterQueryOp.Equals, request.gameId))
    let query = breeze.EntityQuery.from("Mods")
      .where(predicate)
      .expand(["dependencies", "categories", "author"])
      .select(["dependencies", "sizePacked", "tags", "authorText", "author", "avatarUpdatedAt", "avatar", "name", "latestStableVersion"]);
    // TODO:
    //.where(request.chain, NOT, breeze.FilterQueryOp.Contains, "id");

    // todo; a manager per chain?
    let meta = await this.context.fetchMetadata();
    let manager = this.context.newManager();
    let r = await this.context.executeQueryWithManager<IBreezeMod>(manager, query);
    let mod = r.results[0];
    if (!mod) return {
      name: request.packageName
    }
    let sizePacked = Math.abs(mod.sizePacked);
    let modDependencies = mod.dependencies.map(x => x.id);
    if (request.gameId != request.currentGameId) {
      let compatibilityMods = ModsHelper.getCompatibilityModsFor(request.currentGameId, request.gameId, mod.tags);
      if (compatibilityMods.length > 0) {
        let compatibilityModIds = await ModHelper.getCompatibilityModIds(compatibilityMods, request.currentGameId, this.context);
        compatibilityModIds.forEach(x => { if (!modDependencies.some(x => x == x)) modDependencies.push(x) });
      }
    }

    let dependencies = modDependencies.filter(x => !request.localChain.some(x => x == x)).map(x => x);
    if (dependencies.length == 0)
      return {
        dependencies: [],
        sizePacked: sizePacked,
        avatar: mod.avatar,
        avatarUpdatedAt: mod.avatarUpdatedAt,
        authorText: mod.authorText,
        author: mod.author,
        name: mod.name,
        version: mod.latestStableVersion
      };

    let cachedIds = dependencies.filter(x => request.chain.has(x));
    let idsToFetch = dependencies.asEnumerable().except(cachedIds).toArray();
    let fetchedResults: IBasketItem[] = [];

    let desiredFields = ["id", "name", "packageName", "author", "authorText", "gameId", "avatar", "avatarUpdatedAt", "sizePacked"];
    if (idsToFetch.length > 0) {
      let op = { id: { in: idsToFetch } };
      query = breeze.EntityQuery.from("Mods")
        .where(<any>op)
        .select(desiredFields);
      r = await this.context.executeQueryWithManager<IBreezeMod>(manager, query);
      fetchedResults = r.results.map(x => Helper.modToBasket(x));
      fetchedResults.forEach(x => request.chain.set(x.id, x));
    }

    let results = fetchedResults.concat(cachedIds.map(x => request.chain.get(x)));
    results.forEach(x => { request.localChain.push(x.id); });
    return {
      dependencies: results,
      sizePacked: sizePacked,
      avatar: mod.avatar,
      avatarUpdatedAt: mod.avatarUpdatedAt,
      authorText: mod.authorText,
      author: mod.author,
      name: mod.name,
      version: mod.latestStableVersion
    };
  }
}
