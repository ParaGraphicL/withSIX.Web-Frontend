import {inject} from 'aurelia-framework';
import {IContentGuidSpec, BasketItemType, IBasketItem, BasketService, Base, GameClientInfo, uiCommand, uiCommand2, UiContext, MenuItem, ViewModel, Mediator, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IContent, ItemState, IContentState,
  RemoveRecent, Abort, UninstallContent, LaunchContent, OpenFolder, InstallContent, UnFavoriteContent, FavoriteContent, GameChanged, IMenuItem, FolderType} from '../../../framework';
import {Router} from 'aurelia-router';
import {GameBaskets, Basket} from '../../game-baskets';

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

  openFolder: ICommand<void>;
  diagnose: ICommand<void>;
  install: ICommand<void>;
  update: ICommand<void>;
  omni: ICommand<void>;
  uninstall: ICommand<void>;
  launch: ICommand<void>;
  abort: ICommand<void>;
  removeRecent: ICommand<void>;
  addToBasket: ICommand<void>;
  openConfigFolder: ICommand<any>;
  state: IContentState;
  bottomMenuActions = [];
  url: string;

  isForActiveGame: boolean;
  launchMenuItem: MenuItem<any>;

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

  get hasLastUsed() { return this.state && this.state.lastUsed != null; }
  get isActive() { return this.gameInfo.isLocked && this.basketService.lastActiveItem == this.model.id };
  get canAbort() { return this.gameInfo.clientInfo.canAbort; }
  get hasState() { return this.state != null; }
  get isIncomplete() { return this.hasState && this.state.state == ItemState.Incomplete; }
  get isInstalled() { return this.hasState && this.state.state != ItemState.Incomplete; }
  get canBeUninstalled() { return this.isIncomplete || this.isInstalled; }
  get hasUpdateAvailable() { return this.isInstalled && this.state.state == ItemState.UpdateAvailable; }
  get activeGameId() { return this.w6.activeGame.id }
  get canAddToBasket() { return this.activeGameId == this.model.gameId; }
  get isInBasket() { return ContentViewModel.isInBasketFunction(this.baskets.active, this.model.id); }
  get isBusy() { return this.state && this.busyStates.asEnumerable().contains(this.state.state) }
  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.state ? this.state.state : null); }
  get itemBusyClass() { return this.basketService.getItemBusyClassInternal(this.state ? this.state.state : null); }
  get progressClass() {
    let state = this.state;
    if (!state || !(state.state == ItemState.Updating || state.state == ItemState.Installing)) return null;
    var percent = Math.round(state.progress);
    if (percent < 1)
      return "content-in-progress content-progress-0";
    if (percent > 100)
      return "content-in-progress content-progress-100";

    return "content-in-progress content-progress-" + percent;
  };
  get versionInfo() {
    if (this.state && this.state.version) {
      if (!this.model.version) return this.state.version;
      if (this.state.state == ItemState.Uptodate) return this.state.version; // we return the state version because the model version might be out of sync atm..
      return this.state.version == this.model.version ? this.model.version : `${this.state.version} / ${this.model.version}`;
    }
    // if (this.model.installedVersion) {
    //   if (!this.model.version) return this.model.installedVersion;
    //   return this.model.installedVersion == this.model.version ? this.model.version : `${this.model.installedVersion} / ${this.model.version}`;
    // }
    return this.model.version;
  }

  async activate(model: TContent) {
    this.model = model;
    this.gameInfo = await this.basketService.getGameInfo(this.model.gameId); // hack
    this.baskets = this.basketService.basketService.getGameBaskets(model.gameId); // hack
    this.path = this.getPath();
    this.image = this.getImage();
    this.gameName = (this.model.originalGameSlug || this.model.gameSlug).replace("-", " ");
    this.isForActiveGame = !this.model.originalGameId || this.model.originalGameId == this.model.gameId;

    this.url = '/p/' + this.getPath();

    //Tk.Debug.log("Mod State: " + this.model.packageName, this.model.version, this.model.id, this.state);

    this.subscriptions.subd(d => {
      this.updateState();
      this.isInstalledObservable = this.observeEx(x => x.isInstalled);
      this.canExecuteObservable = this.gameInfo.observeEx(x => x.canExecute).combineLatest(this.observeEx(x => x.isBusy), (can, busy) => can && !busy);

      d(this.eventBus.subscribe('refreshContentInfo-' + this.model.gameId, x => this.updateState()))
      d(this.eventBus.subscribe('contentInfoStateChange-' + this.model.id, x => this.updateState()))

      d(this.addToBasket = uiCommand2("toggle in playlist", async () => this.basketService.basketService.addToBasket(this.model.gameId, this.toBasketInfo()), {
        isVisibleObservable: this.observeEx(x => x.canAddToBasket)
      }));

      d(this.removeRecent = uiCommand2("Remove as Recent", () => new RemoveRecent(this.model.gameId, this.model.id).handle(this.mediator),
        {
          icon: 'withSIX-icon-Folder-Remove',
          isVisibleObservable: this.observeEx(x => x.hasLastUsed),
          canExecuteObservable: this.canExecuteObservable
        }))

      d(this.abort = uiCommand2("", () => new Abort(this.model.gameId, this.model.id).handle(this.mediator), {
        isVisibleObservable: this.observeEx(x => x.isActive),
        canExecuteObservable: this.observeEx(x => x.canAbort),
        icon: "icon withSIX-icon-Hexagon-Pause", tooltip: "Pause"
      }));
      d(this.uninstall = uiCommand2("Uninstall", this.uninstallInternal, {
        isVisibleObservable: this.observeEx(x => x.canBeUninstalled),
        canExecuteObservable: this.canExecuteObservable,
        icon: "icon withSIX-icon-Square-X"
      }));

      d(this.omni = uiCommand2("", () => (!this.isInstalled || this.hasUpdateAvailable) ? this.installInternal() : this.launchInternal(), {
        canExecuteObservable: this.canExecuteObservable,
        icon: "content-state-icon",
        textCls: "content-state-text"
      }));

      d(this.install = uiCommand2("Install", this.installInternal, {
        isVisibleObservable: this.observeEx(x => x.isInstalled).select(x => !x).combineLatest(this.observeEx(x => x.hasUpdateAvailable).select(x => !x), (x, y) => x && y),
        canExecuteObservable: this.canExecuteObservable,
        icon: 'withSIX-icon-Hexagon-Download2'
      }));

      d(this.update = uiCommand2("Update", this.installInternal, {
        isVisibleObservable: this.observeEx(x => x.hasUpdateAvailable),
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
      d(this.observeEx(x => x.hasUpdateAvailable)
        .skip(1) // we need to first 'setupMenuItems'
        .subscribe(x => this.handleUpdateAvailable(x)));

      d(this.openFolder = uiCommand2("Open folder", () => new OpenFolder(this.model.gameId, this.model.type == 'mod' ? this.model.id : Tools.emptyGuid).handle(this.mediator), {
        isVisibleObservable: this.isInstalledObservable,
        icon: 'withSIX-icon-Folder'
      }))
      if (this.model.gameSlug.startsWith('Arma')) {
        d(this.openConfigFolder = uiCommand2("Open config folder", () => new OpenFolder(this.model.gameId, this.model.type == 'mod' ? this.model.id : Tools.emptyGuid, FolderType.Config).handle(this.mediator), { icon: 'icon withSIX-icon-Folder', isVisibleObservable: this.isInstalledObservable }));
      }
    });

    this.setupMenuItems();
    this.handleUpdateAvailable(this.hasUpdateAvailable);
    let m = <any>this.model;
    this.installs = this.model.type == 'collection' ? m.followers : m.statInstall;
    this.updatedAt = m.updated || m.updatedAt || m.updatedVersion;

    this.hasRealAuthor = model.authorSlug != 'withSIX-o-bot';
  }
  hasRealAuthor: boolean;

  updatedAt: Date;

  installs: number;

  getInstallSpec() { return { id: this.model.id } }

  installInternal = async () => { this.emitGameChanged(); await new InstallContent(this.model.gameId, this.getInstallSpec(), this.getNoteInfo()).handle(this.mediator) }
  launchInternal = async () => { this.emitGameChanged(); await new LaunchContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator) }
  uninstallInternal = async () => { this.emitGameChanged(); if (await this.confirm("Are you sure you want to uninstall this content?")) await new UninstallContent(this.model.gameId, this.model.id, this.getNoteInfo()).handle(this.mediator) }
  diagnoseInternal = async () => { this.emitGameChanged(); await new InstallContent(this.model.gameId, { id: this.model.id }, this.getNoteInfo(), true, true).handle(this.mediator) }
  emitGameChanged = () => this.eventBus.publish(new GameChanged(this.model.gameId, this.model.gameSlug)); // incase we are on Home..

  getNoteInfo() { return { text: this.model.name || this.model.packageName, href: this.url } };
  updateState() { this.state = this.gameInfo.clientInfo.content[this.model.id]; }

  handleUpdateAvailable(updateAvailable: boolean) {
    if (updateAvailable) {
      Tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
      this.bottomMenuActions.push(this.launchMenuItem);
    } else
      Tools.removeEl(this.bottomMenuActions, this.launchMenuItem);
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

  setupMenuItems() {
    // TODO: instead of accessing the bsket here, we should just have a variable, and perhaps event monitoring instead?
    this.launchMenuItem = new MenuItem(this.launch);
    this.topMenuActions.push(this.launchMenuItem);
    this.topMenuActions.push(new MenuItem(this.install));
    this.topMenuActions.push(new MenuItem(this.update));
    this.topMenuActions.push(new MenuItem(this.diagnose));
    this.topMenuActions.push(new MenuItem(this.uninstall));
    this.topMenuActions.push(new MenuItem(this.removeRecent))
    this.topMenuActions.push(new MenuItem(this.openFolder));
    this.topMenuActions.push(new MenuItem(this.openConfigFolder));
    this.bottomActions.push(new MenuItem(this.omni));
    this.bottomActions.push(new MenuItem(this.abort));
  }

  getPath() {
    var slug = this.model.name ? this.model.name.sluggify() : null;
    var path = `${this.model.gameSlug}/${this.model.type}s/${this.model.id.toShortId()}`;
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
