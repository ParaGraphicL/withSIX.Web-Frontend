import {inject} from 'aurelia-framework';
import {IContentGuidSpec, BasketItemType, IBasketItem, BasketService, Base, GameClientInfo, uiCommand, uiCommand2, UiContext, MenuItem, ViewModel, Mediator, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IContent, ItemState, IContentState,
  RemoveRecent, Abort, UninstallContent, LaunchContent, OpenFolder, InstallContent, UnFavoriteContent, FavoriteContent, GameChanged, IMenuItem, FolderType, LaunchAction, IReactiveCommand} from '../../../framework';
import {Router} from 'aurelia-router';
import {GameBaskets, Basket} from '../../game-baskets';
import {AddModsToCollections} from '../../games/add-mods-to-collections';

@inject(UiContext, BasketService)
export class ContentViewModel<TContent extends IContent> extends ViewModel {
  baskets: GameBaskets;
  model: TContent;
  icon: string;
  path: string;
  image: string;
  gameName: string;
  gameInfo: GameClientInfo;

  isInstalledObservable;
  canExecuteObservable;

  addToCollections: IReactiveCommand<any>;
  openFolder: IReactiveCommand<void>;
  diagnose: IReactiveCommand<void>;
  install: IReactiveCommand<void>;
  update: IReactiveCommand<void>;
  omni: IReactiveCommand<void>;
  uninstall: IReactiveCommand<void>;
  launch: IReactiveCommand<void>;
  abort: IReactiveCommand<void>;
  removeRecent: IReactiveCommand<void>;
  addToBasket: IReactiveCommand<void>;
  openConfigFolder: IReactiveCommand<any>;
  state: IContentState = this.getDefaultState();
  bottomMenuActions = [];
  url: string;
  source?: {img: string; text: string};

  isForActiveGame: boolean;
  launchMenuItem: MenuItem<any>;

  getDefaultState() { return { state: ItemState.NotInstalled, version: null, id: this.model ? this.model.id : null, gameId: this.model ? this.model.gameId : null } }

  get statTitle() { return 'install' }
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
  // TODO: This could be modeled by events similar to the state handling?
  static isInBasketFunction = (basket, id) => basket.content.has(id);

  toggleFavorite = () => this.model.isFavorite
    ? new UnFavoriteContent(this.model.id).handle(this.mediator)
    : new FavoriteContent(this.model.id).handle(this.mediator);

  busyStates = [ItemState.Installing, ItemState.Updating, ItemState.Uninstalling, ItemState.Launching];

  constructor(ui: UiContext, protected basketService: BasketService) {
    super(ui);
  }

  get hasLastUsed() { return this.state.lastUsed != null; }
  get isActive() { return this.gameInfo.isLocked && this.basketService.lastActiveItem === this.model.id };
  get canAbort() { return this.gameInfo.clientInfo.canAbort; }
  get hasUpdateAvailable() { return this.itemState === ItemState.UpdateAvailable; }
  get isInstalled() { return !this.isIncomplete && this.itemState !== ItemState.NotInstalled; }
  get canBeUninstalled() { return this.isIncomplete || this.isInstalled; }
  get isIncomplete() { return this.itemState === ItemState.Incomplete; }
  get activeGameId() { return this.w6.activeGame.id }
  get canAddToBasket() { return this.activeGameId === this.model.gameId; }
  get isInBasket() { return ContentViewModel.isInBasketFunction(this.baskets.active, this.model.id); }
  get isBusy() { return this.busyStates.some(x => x === this.itemState) }
  get progressClass() {
    if (!(this.state.state == ItemState.Updating || this.state.state == ItemState.Installing)) return null;
    var percent = Math.round(this.state.progress);
    if (percent < 1)
      return "content-in-progress content-progress-0";
    if (percent > 100)
      return "content-in-progress content-progress-100";

    return "content-in-progress content-progress-" + percent;
  };
  get versionInfo() {
    if (this.state.version) {
      if (!this.desiredVersion) return this.state.version;
      if (this.itemState == ItemState.Uptodate) return this.state.version; // we return the state version because the model version might be out of sync atm..
      return this.state.version == this.desiredVersion ? this.desiredVersion : `${this.state.version} / ${this.desiredVersion}`;
    }
    // if (this.model.installedVersion) {
    //   if (!this.model.version) return this.model.installedVersion;
    //   return this.model.installedVersion == this.model.version ? this.model.version : `${this.model.installedVersion} / ${this.model.version}`;
    // }
    return this.desiredVersion;
  }
  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.itemState); }
  get itemBusyClass() { return this.basketService.getItemBusyClassInternal(this.itemState) }
  get itemState() { return this.state.state; }
  get basketableText() { return this.isInBasket ? "Remove from Playlist" : "Add to Playlist" }
  get basketableIcon() { return this.isInBasket ? "withSIX-icon-X" : "withSIX-icon-Add" }
  get desiredVersion() { return this.model.version }
  get type() { return this.model.type }

  async activate(model: TContent) {
    this.model = model;
    this.gameInfo = await this.basketService.getGameInfo(this.model.gameId); // hack
    this.baskets = this.basketService.getGameBaskets(model.gameId); // hack
    this.path = this.getPath();
    this.image = this.getImage();
    this.gameName = (this.model.originalGameSlug || this.model.gameSlug).replace("-", " ");
    this.isForActiveGame = !this.model.originalGameId || this.model.originalGameId == this.model.gameId;

    this.url = '/p/' + this.getPath();

    if (this.image) {
      // TODO: Use Publishers instead
      if (this.image.includes('steamusercontent.com')) this.source = { img: this.w6.url.img.steam, text: 'Steam Workshop' }
      else if (this.image.includes('community.playstarbound.com')) this.source = { img: this.w6.url.img.chucklefish, text: 'Starbound Community Forums' }
      else if (this.image.includes('nomansskymods.com')) this.source = { img: this.w6.url.img.unknown, text: 'NoMansSkyMods' }
      else if (this.image.includes('nexusmods.com')) this.source = { img: this.w6.url.img.unknown, text: 'Nexus Mods' }
      else if (this.image.includes('moddb.com')) this.source = { img: this.w6.url.img.unknown, text: 'ModDB' }
      else if (this.image.includes('curse.com')) this.source = { img: this.w6.url.img.unknown, text: 'Curse' }
    }

    //this.tools.Debug.log("Mod State: " + this.model.packageName, this.model.version, this.model.id, this.state);
    this.subscriptions.subd(d => {
      this.updateState();
      this.isInstalledObservable = this.whenAnyValue(x => x.isInstalled);
      this.canExecuteObservable = this.gameInfo.observeEx(x => x.canExecute).combineLatest(this.whenAnyValue(x => x.isBusy), (can, busy) => can && !busy);

      d(this.eventBus.subscribe('refreshContentInfo-' + this.model.gameId, x => this.updateState()))
      d(this.eventBus.subscribe('contentInfoStateChange-' + this.model.id, x => this.updateState()))

      d(this.addToBasket = uiCommand2("toggle in playlist", async () => this.basketService.addToBasket(this.model.gameId, this.toBasketInfo()), {
        isVisibleObservable: this.whenAnyValue(x => x.canAddToBasket)
      }));

      if ((<any>this.model).showRecent) {
        d(this.removeRecent = uiCommand2("Remove as Recent", () => new RemoveRecent(this.model.gameId, this.model.id).handle(this.mediator),
          {
            icon: 'withSIX-icon-Folder-Remove',
            isVisibleObservable: this.whenAnyValue(x => x.hasLastUsed),
            canExecuteObservable: this.canExecuteObservable
          }))
      }

      d(this.abort = uiCommand2("", () => new Abort(this.model.gameId, this.model.id).handle(this.mediator), {
        isVisibleObservable: this.whenAnyValue(x => x.isActive),
        canExecuteObservable: this.whenAnyValue(x => x.canAbort),
        icon: "icon withSIX-icon-Hexagon-Pause", tooltip: "Pause"
      }));
      d(this.uninstall = uiCommand2("Uninstall", this.uninstallInternal, {
        isVisibleObservable: this.whenAnyValue(x => x.canBeUninstalled),
        canExecuteObservable: this.canExecuteObservable,
        icon: "icon withSIX-icon-Square-X"
      }));

      d(this.omni = uiCommand2("", () => (!this.isInstalled || this.hasUpdateAvailable) ? this.installInternal() : this.launchInternal(), {
        canExecuteObservable: this.canExecuteObservable,
        icon: "content-state-icon",
        textCls: "content-state-text"
      }));

      d(this.install = uiCommand2("Install", this.installInternal, {
        isVisibleObservable: this.whenAnyValue(x => x.isInstalled).map(x => !x).combineLatest(this.whenAnyValue(x => x.hasUpdateAvailable).map(x => !x), (x, y) => x && y),
        canExecuteObservable: this.canExecuteObservable,
        icon: 'withSIX-icon-Hexagon-Download2'
      }));

      d(this.update = uiCommand2("Update", this.installInternal, {
        isVisibleObservable: this.whenAnyValue(x => x.hasUpdateAvailable),
        canExecuteObservable: this.canExecuteObservable,
        icon: 'withSIX-icon-Hexagon-Upload2'
      }));

      d(this.launch = uiCommand2("Launch", this.launchInternal, {
        isVisibleObservable: this.isInstalledObservable,
        canExecuteObservable: this.canExecuteObservable,
        icon: "withSIX-icon-Hexagon-Play"
      }));

      d(this.diagnose = uiCommand2("Diagnose", this.diagnoseInternal, {
        isVisibleObservable: this.isInstalledObservable,
        canExecuteObservable: this.canExecuteObservable,
        icon: 'withSIX-icon-Tools'
      }));
      d(this.whenAnyValue(x => x.hasUpdateAvailable)
        .skip(1) // we need to first 'setupMenuItems'
        .subscribe(x => this.handleUpdateAvailable(x)));

      d(this.openFolder = uiCommand2("Open folder", () => new OpenFolder(this.model.gameId, this.type === 'mod' ? this.model.id : this.tools.emptyGuid).handle(this.mediator), {
        isVisibleObservable: this.isInstalledObservable,
        icon: 'withSIX-icon-Folder'
      }))
      if (this.shouldAddConfigAction)
        d(this.openConfigFolder = uiCommand2("Open config folder", () => new OpenFolder(this.model.gameId, this.type === 'mod' ? this.model.id : this.tools.emptyGuid, FolderType.Config).handle(this.mediator), { icon: 'icon withSIX-icon-Folder', isVisibleObservable: this.isInstalledObservable }));

    });

    this.setupMenuItems();
    this.handleUpdateAvailable(this.hasUpdateAvailable);
    let m = <any>this.model;
    this.installs = this.type === 'collection' ? m.subscribers : m.statInstall;
    this.totalInstalls = this.type === 'collection' ? m.subscribers : m.statTotalInstall;
    this.updatedAt = m.updated || m.updatedAt || this.model.updatedVersion || this.model.lastUpdated || this.model.lastInstalled;

    this.hasRealAuthor = model.authorSlug != 'withSIX-o-bot';
  }

  get shouldAddConfigAction() { return this.model.gameSlug.startsWith('Arma'); }
  hasRealAuthor: boolean;

  updatedAt: Date;

  installs: number;
  totalInstalls: number;

  getInstallSpec() { return { id: this.model.id } }

  protected installInternal = async () => { this.emitGameChanged(); await new InstallContent(this.model.gameId, this.getInstallSpec(), this.getNoteInfo()).handle(this.mediator) }
  protected launchInternal = async (action?: LaunchAction) => { this.emitGameChanged(); await new LaunchContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator) }
  protected uninstallInternal = async () => { this.emitGameChanged(); if (await this.confirm("Are you sure you want to uninstall this content?")) await new UninstallContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator) }
  protected diagnoseInternal = async () => { this.emitGameChanged(); await new InstallContent(this.model.gameId, { id: this.model.id }, this.getNoteInfo(), true, true).handle(this.mediator) }
  protected emitGameChanged = () => this.eventBus.publish(new GameChanged(this.model.gameId, this.model.gameSlug)); // incase we are on Home..

  getNoteInfo() { return { text: this.model.name || this.model.packageName, href: this.url } };
  updateState() { this.state = (this.gameInfo.clientInfo.content[this.model.id] || this.getDefaultState()); }

  handleUpdateAvailable(updateAvailable: boolean) {
    if (updateAvailable) {
      this.tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
      this.bottomMenuActions.push(this.launchMenuItem);
    } else
      this.tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
  }

  toBasketInfo(): IBasketItem {
    return {
      id: this.model.id, packageName: this.model.packageName,
      gameId: this.model.gameId,
      itemType: BasketItemType.Mod,
      author: this.model.author || "N/A",
      image: this.model.image,
      name: this.model.name,
      sizePacked: this.model.sizePacked
    }
  }

  setupAddToBasket() {
    this.subscriptions.subd(d => {
      this.topActions.push(new MenuItem(this.addToBasket, { name: "", icon: "content-basketable-icon", textCls: "content-basketable-text", cls: "content-basketable-button" }))
      this.topMenuActions.push(new MenuItem(this.addToBasket));
      d(this.whenAnyValue(x => x.isInBasket).subscribe(x => { this.addToBasket.name = this.basketableText; this.addToBasket.icon = this.basketableIcon }));
      if (this.isLoggedIn) {
        d(this.addToCollections = uiCommand2("Add to ...", async () => this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [this.model] } }), { icon: 'withSIX-icon-Nav-Collection' }));
        this.topMenuActions.push(new MenuItem(this.addToCollections));
      }
    });
  }

  setupMenuItems() {
    // TODO: instead of accessing the bsket here, we should just have a variable, and perhaps event monitoring instead?
    this.launchMenuItem = new MenuItem(this.launch);
    this.topMenuActions.push(this.launchMenuItem);
    this.topMenuActions.push(new MenuItem(this.install));
    this.topMenuActions.push(new MenuItem(this.update));
    this.topMenuActions.push(new MenuItem(this.diagnose));
    this.topMenuActions.push(new MenuItem(this.uninstall));
    if (this.removeRecent) this.topMenuActions.push(new MenuItem(this.removeRecent))
    this.topMenuActions.push(new MenuItem(this.openFolder));
    if (this.shouldAddConfigAction) this.topMenuActions.push(new MenuItem(this.openConfigFolder));
    this.bottomActions.push(new MenuItem(this.omni));
    this.bottomActions.push(new MenuItem(this.abort));
  }

  getPath() {
    var slug = this.model.name ? this.model.name.sluggify() : null;
    var path = `${this.model.gameSlug}/${this.type}s/${this.model.id.toShortId()}`;
    return slug ? path + "/" + slug : path;
  }
  getImage() { return this.model.image ? this.w6.url.getContentAvatarUrl(this.model.image, (<any>this.model).imageUpdatedAt) : this.defaultAssetUrl; }

  topActions: IMenuItem[] = []
  topMenuActions: IMenuItem[] = [
    // new MenuItem("Toggle Favorite", this.toggleFavorite, {
    // icon: "icon withSIX-icon-Square-X" // TODO
    // })
  ]
  bottomActions: IMenuItem[] = []
}
