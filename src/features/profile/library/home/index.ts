import {
  IBasketItem, BasketItemType, GameClientInfo, UiContext, uiCommand2, uiCommandWithLogin2, ViewModel, MenuItem, IMenuItem, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IContent, TypeScope, ItemState, IContentStateChange, IContentStatusChange, IContentState, BasketService,
  InstallContents, ContentDeleted, breeze, IBreezeMod, IGameHome
} from "../../../../framework";
import { inject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { BaseGame } from "../../lib";
import { CreateCollectionDialog } from "../../../games/collections/create-collection-dialog";

import { Index as SettingsIndex } from "../../../../features/settings/index";

@inject(UiContext, BasketService)
export class Index extends BaseGame {
  clientEnabled: boolean;
  heading = "Library";
  updates: IContent[];
  newContent: IContent[];
  recent: IContent[];
  basket: any;
  gameInfo: GameClientInfo;

  addMod = uiCommandWithLogin2("Mod",
    async () => this.legacyMediator.openAddModDialog(this.game.slug), { icon: "icon withSIX-icon-Nav-Mod" });
  addMission = uiCommandWithLogin2("Mission",
    async () => this.navigateInternal(this.w6.url.play + "/" + this.game.slug + "/missions/new"), {
      icon: "icon withSIX-icon-Nav-Mission",
    });
  addCollection = uiCommandWithLogin2("Collection",
    async () => this.dialog.open({ model: { game: this.game, viewModel: CreateCollectionDialog } }), {
      icon: "icon withSIX-icon-Nav-Collection",
    });
  updateAll = uiCommand2("Update all",
    () => new InstallContents(this.game.id, this.updates.map(x => ({ id: x.id })), { text: "Available updates" })
      .handle(this.mediator), {
      canExecuteObservable: this.observeEx(x => x.hasUpdates),
      cls: "warn", icon: "withSIX-icon-Hexagon-Upload2",
      isVisibleObservable: this.observeEx(x => x.clientEnabled),
    });

  addContentMenu: IMenuItem[] = [
    new MenuItem(this.addCollection),
    new MenuItem(this.addMod),
    new MenuItem(this.addMission),
  ];

  get hasUpdates() { return this.updates && this.updates.length > 0; }

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      let item = list.asEnumerable().firstOrDefault(x => x.id === id);
      if (item) { this.tools.removeEl(list, item); }
    };
    deleteIfHas(this.newContent, evt.id);
    deleteIfHas(this.updates, evt.id);
    deleteIfHas(this.recent, evt.id);
  }

  handleContentInstalled = (evt, gameId, installedContent) => { if (this.game.id === gameId) { this.newContent.push(installedContent); } }

  handleContentStatusChanged = (stateChange: IContentStatusChange) => {
    if (stateChange.gameId !== this.game.id) { return; }
    this.handleStateChange(stateChange);
  };

  handleContentStateChanged = (stateChange: IContentStateChange) => {
    if (stateChange.gameId !== this.game.id) { return; }
    angular.forEach(stateChange.states, state => this.handleStateChange(state));
  };

  handleStateChange = (state: IContentState) => {
    if (state.state === ItemState.NotInstalled) {
      let item = this.newContent.asEnumerable().firstOrDefault(x => x.id === state.id);
      if (item) { this.tools.removeEl(this.newContent, item); }
      item = this.updates.asEnumerable().firstOrDefault(x => x.id === state.id);
      if (item) { this.tools.removeEl(this.updates, item); }
    } else if (state.state === ItemState.Uptodate) {
      let item = this.updates.asEnumerable().firstOrDefault(x => x.id === state.id);
      if (item) { this.tools.removeEl(this.updates, item); }
    }
  }

  constructor(ui: UiContext, private basketService: BasketService) { super(ui); }

  openGameSettings() {
    let model = { module: "games", games: { id: this.game.id } };
    this.dialog.open({ viewModel: SettingsIndex, model: model });
  }

  async activate(params, routeConfig) {
    super.activate(params, routeConfig);
    try {
      let x = await new GetGameHome(this.game.id).handle(this.mediator);
      this.updates = x.updates.asEnumerable().orderByDescending(x => x.updatedVersion || "").toArray();
      this.newContent = x.newContent.asEnumerable().orderByDescending(x => x.lastInstalled || "").toArray();
      this.recent = x.recent.asEnumerable().orderByDescending(x => x.lastUsed || "").toArray();
      this.clientEnabled = true;
    } catch (err) {
      this.tools.Debug.warn("Error trying to fetch game home", err);
      this.clientEnabled = false;
    }

    this.basket = this.basketService.getGameBaskets(this.game.id); // hack
    this.gameInfo = await this.basketService.getGameInfo(this.game.id); // hack

    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
      d(this.eventBus.subscribe("content.contentInstalled", this.handleContentInstalled));
      d(this.eventBus.subscribe("content.recentItemRemoved", (args: string) => {
        let item = this.recent.asEnumerable().firstOrDefault(x => x.id === args);
        if (item) { this.tools.removeEl(this.recent, item); }
        [this.newContent.asEnumerable().firstOrDefault(x => x.id === args), this.updates.asEnumerable().firstOrDefault(x => x.id === args)]
          .forEach(x => {
            if (x != null) { x.lastUsed = null; }
          });
      }));
      d(this.eventBus.subscribe("content.recentItemUsed", (gameId, id, usedAt) => {
        if (this.game.id !== gameId) { return; }
        let recentContent = this.recent;
        recentContent.forEach(x => { if (x.id === id) { x.lastUsed = usedAt; } });
      }));
      d(this.eventBus.subscribe("content.recentItemAdded", (evt, gameId, recentContent) => {
        if (this.game.id === gameId) { this.recent.push(recentContent); }
      }));
      d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
      d(this.eventBus.subscribe("status.contentStatusChanged", this.handleContentStatusChanged));
    });

    /*
    this.subscriptions.subd(d => {
    d(this.eventBus.subscribe("content.contentUnfavorited", args => {
      var gameId = args[0];
      var id = args[1];
      if (this.game.id != gameId)
          return;
      var toRemove = [];
      var favoriteContent = $scope.clientContentInfo.favoriteContent;
      favoriteContent.forEach(x => {
          if (x.id == id) toRemove.push(x);
      });
      if (toRemove.length == 0)
          return;
      this.applyIfNeeded(() => toRemove.forEach(x => favoriteContent.splice(favoriteContent.indexOf(x), 1)));
  }));
  d(this.eventBus.subscribe("content.contentFavorited", args => {
    var gameId = args[0];
    var id = args[1];
    var favoriteItem = args[2];

      var favoriteContent = $scope.clientContentInfo.favoriteContent;
      if (this.game.id == gameId && !favoriteContent.some(x => x.id == favoriteItem.id))
          this.applyIfNeeded(() => favoriteContent.push(favoriteItem));
  }));
  d(this.client.getGameContent(this.game.id)
      .then(cInfo => Object.assign(this.clientContentInfo, cInfo)));
    });
    */
  }

  deactivate() { this.subscriptions.dispose(); }

  updatedToBasketInfo() { return this.updates.map(x => this.toBasketInfo(x)); }

  toBasketInfo(content: IContent): IBasketItem {
    return {
      id: content.id, packageName: content.packageName,
      gameId: content.gameId,
      itemType: BasketItemType.Mod,
      author: content.author || "N/A",
      image: content.image,
      name: content.name,
      sizePacked: content.sizePacked,
    };
  }
}

export class GetGameHome extends Query<IGameHome> {
  constructor(public id: string) { super(); }
}

@handlerFor(GetGameHome)
class GetGameHomeHandler extends DbClientQuery<GetGameHome, IGameHome> {
  public async handle(request: GetGameHome): Promise<IGameHome> {
    let r = await this.client.getGameHome(request.id);
    r.recent.forEach(x => (<any>x).showRecent = true);

    // TODO: Collections
    let allMods = r.newContent.concat(r.recent).concat(r.updates);
    await this.handleModAugments(allMods);

    return r;
  }
}
