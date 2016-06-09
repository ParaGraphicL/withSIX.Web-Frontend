import {IBasketItem, BasketItemType, Base, ICollection, ViewModelWithModel, Query, DbClientQuery, handlerFor, IGame, ITab, IMenuItem, MenuItem, uiCommand2, IContentStatusChange, IContentStateChange, IContentState, ItemState,
  InstallContents, ContentDeleted} from '../../../framework';
import {GetGameHome, IHomeData} from '../../profile/library/home/index';
import {BaseGame} from '../../profile/lib';

export interface IHomeD extends IHomeData {
  collections: ICollection[];
  homeLoaded: boolean;
  collectionsLoaded: boolean;
}

export class Library extends ViewModelWithModel<ITab> {
  home: IHomeD = { updates: [], recent: [], newContent: [], collections: [], installedMissionsCount: null, installedModsCount: null, homeLoaded: false, collectionsLoaded: false };
  topBarItems: IMenuItem[] = [];
  menuItems: IMenuItem[] = [];
  game: { id: string };
  shown = false;

  async activate(model: ITab) {
    super.activate(model);

    if (this.w6.activeGame.id) {
      this.game = { id: this.w6.activeGame.id }
    } else {
      this.game = { id: null }
    }

    //this.topBarItems.push(new MenuItem(this.openFavorites));
    let openMods = new MenuItem(this.openMods)
    this.topBarItems.push(openMods);
    let openMissions = new MenuItem(this.openMissions);
    this.topBarItems.push(openMissions);
    let openCollections = new MenuItem(this.openCollections);
    this.topBarItems.push(openCollections);
    let openUpdates = new MenuItem(this.openUpdates);
    this.topBarItems.push(openUpdates);

    this.subscriptions.subd(d => {
      d(Base.observeEx(this.home.updates, x => x.length).subscribe(x => openUpdates.count = x));
      d(Base.observeEx(this.home.collections, x => x.length).subscribe(x => openCollections.count = x));
      d(Base.observeEx(this.home, x => x.installedMissionsCount).subscribe(x => openMissions.count = x));
      d(Base.observeEx(this.home, x => x.installedModsCount).subscribe(x => openMods.count = x));
      d(Base.observeEx(this.home, x => x.homeLoaded).subscribe(x => {
        openUpdates.count = this.home.updates.length;
        openMissions.count = this.home.installedMissionsCount;
        openMods.count = this.home.installedModsCount;
      }));
      d(Base.observeEx(this.home, x => x.collectionsLoaded).subscribe(x => openCollections.count = this.home.collections.length));
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
      d(this.eventBus.subscribe("content.contentInstalled", this.handleContentInstalled));
      d(this.eventBus.subscribe("content.recentItemRemoved", (args: string) => {
        let item = this.home.recent.asEnumerable().firstOrDefault(x => x.id == args);
        if (item) Tools.removeEl(this.home.recent, item);
        [this.home.newContent.asEnumerable().firstOrDefault(x => x.id == args), this.home.updates.asEnumerable().firstOrDefault(x => x.id == args)]
          .forEach(x => {
            if (x != null) x.lastUsed = null;
          });
      }));
      d(this.eventBus.subscribe("content.recentItemUsed", (gameId, id, usedAt) => {
        if (this.game.id != gameId)
          return;
        var recentContent = this.home.recent;
        recentContent.forEach(x => {
          if (x.id == id)
            x.lastUsed = usedAt;
        });
      }));
      d(this.eventBus.subscribe("content.recentItemAdded", (evt, gameId, recentContent) => {
        if (this.game.id == gameId)
          this.home.recent.push(recentContent);
      }));
      d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
      d(this.eventBus.subscribe("status.contentStatusChanged", this.handleContentStatusChanged));
    })
  }

  attached() {
    setTimeout(() => { this.shown = true; }, 0.6 * 1000); // animation delay. // TODO: have actual animation end trigger..
  }

  get activeGameName() { return !this.w6.activeGame.id ? "" : this.w6.activeGame.slug.replace("-", " "); }

  openFavorites = uiCommand2("Favorites", async () => this.navigateInternal(`/me/library/${this.w6.activeGame.slug}/favorites`), { icon: "icon withSIX-icon-Star-Outline" })
  openMods = uiCommand2("Mods", async () => this.navigateInternal(`/me/library/${this.w6.activeGame.slug}/mods`), { icon: "icon withSIX-icon-Nav-Mod" })
  openMissions = uiCommand2("Missions", async () => this.navigateInternal(`/me/library/${this.w6.activeGame.slug}/missions`), { icon: "icon withSIX-icon-Nav-Mission" })
  openCollections = uiCommand2("Collections", async () => this.navigateInternal(`/me/library/${this.w6.activeGame.slug}/collections`), { icon: "icon withSIX-icon-Nav-Collection" })
  openUpdates = uiCommand2("Updates", async () => this.navigateInternal(`/me/library/${this.w6.activeGame.slug}`), { icon: "icon withSIX-icon-Upload", cls: "update" })

  openLibrary() { this.navigateInternal('/me/library' + (this.w6.activeGame.id ? '/' + this.w6.activeGame.slug : '')); }
  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      var item = list.asEnumerable().firstOrDefault(x => x.id == id);
      if (item) Tools.removeEl(list, item);

    }
    deleteIfHas(this.home.newContent, evt.id);
    deleteIfHas(this.home.updates, evt.id);
    deleteIfHas(this.home.recent, evt.id);
    deleteIfHas(this.home.collections, evt.id);
  }

  handleContentInstalled = (evt, gameId, installedContent) => {
    if (this.game.id == gameId) this.home.newContent.push(installedContent);
  }

  handleContentStatusChanged = (stateChange: IContentStatusChange) => {
    if (stateChange.gameId != this.game.id) return;
    this.handleStateChange(stateChange);
  };

  handleContentStateChanged = (stateChange: IContentStateChange) => {
    if (stateChange.gameId != this.game.id) return;
    angular.forEach(stateChange.states, state => this.handleStateChange(state));
  };

  handleStateChange = (state: IContentState) => {
    if (state.state == ItemState.NotInstalled) {
      var item = this.home.newContent.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) Tools.removeEl(this.home.newContent, item);
      item = this.home.updates.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) Tools.removeEl(this.home.updates, item);
      item = this.home.collections.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) Tools.removeEl(this.home.collections, item);
    } else if (state.state == ItemState.Uptodate) {
      var item = this.home.updates.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) Tools.removeEl(this.home.updates, item);
    }
  }
}
