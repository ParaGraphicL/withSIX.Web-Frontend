import {IBasketItem, BasketItemType, GameClientInfo, UiContext, uiCommand2, uiCommandWithLogin2, ViewModel, MenuItem, IMenuItem, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IContent, TypeScope, ItemState, IContentStateChange, IContentStatusChange, IContentState, BasketService,
  InstallContents, ContentDeleted, breeze, IBreezeMod} from '../../../../framework';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BaseGame} from '../../lib';
import {CreateCollectionDialog} from '../../../games/collections/create-collection-dialog';

import {Index as SettingsIndex} from '../../../../features/settings/index';

@inject(UiContext, BasketService)
export class Index extends BaseGame {
  clientEnabled: boolean;
  heading = "Library";
  updates: IContent[];
  newContent: IContent[];
  recent: IContent[];
  basket: any;
  gameInfo: GameClientInfo;

  constructor(ui: UiContext, private basketService: BasketService) { super(ui); }

  openGameSettings() {
    let model = { module: "games", games: { id: this.game.id } };
    this.dialog.open({ viewModel: SettingsIndex, model: model })
  }

  async activate(params, routeConfig) {
    super.activate(params, routeConfig);
    try {
      let x = await new GetGameHome(this.game.id).handle(this.mediator);
      this.updates = x.updates.asEnumerable().orderByDescending(x => x.updatedVersion || '').toArray();
      this.newContent = x.newContent.asEnumerable().orderByDescending(x => x.lastInstalled || '').toArray();
      this.recent = x.recent.asEnumerable().orderByDescending(x => x.lastUsed || '').toArray();
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
        let item = this.recent.asEnumerable().firstOrDefault(x => x.id == args);
        if (item) this.tools.removeEl(this.recent, item);
        [this.newContent.asEnumerable().firstOrDefault(x => x.id == args), this.updates.asEnumerable().firstOrDefault(x => x.id == args)]
          .forEach(x => {
            if (x != null) x.lastUsed = null;
          });
      }));
      d(this.eventBus.subscribe("content.recentItemUsed", (gameId, id, usedAt) => {
        if (this.game.id != gameId)
          return;
        var recentContent = this.recent;
        recentContent.forEach(x => {
          if (x.id == id)
            x.lastUsed = usedAt;
        });
      }));
      d(this.eventBus.subscribe("content.recentItemAdded", (evt, gameId, recentContent) => {
        if (this.game.id == gameId)
          this.recent.push(recentContent);
      }));
      d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
      d(this.eventBus.subscribe("status.contentStatusChanged", this.handleContentStatusChanged));
    })

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

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      var item = list.asEnumerable().firstOrDefault(x => x.id == id);
      if (item) this.tools.removeEl(list, item);

    }
    deleteIfHas(this.newContent, evt.id);
    deleteIfHas(this.updates, evt.id);
    deleteIfHas(this.recent, evt.id);
  }

  handleContentInstalled = (evt, gameId, installedContent) => {
    if (this.game.id == gameId) this.newContent.push(installedContent);
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
      var item = this.newContent.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) this.tools.removeEl(this.newContent, item);
      item = this.updates.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) this.tools.removeEl(this.updates, item);
    } else if (state.state == ItemState.Uptodate) {
      var item = this.updates.asEnumerable().firstOrDefault(x => x.id == state.id);
      if (item) this.tools.removeEl(this.updates, item);
    }
  }

  addMod = uiCommandWithLogin2("Mod", async () => this.legacyMediator.openAddModDialog(this.game.slug), { icon: "icon withSIX-icon-Nav-Mod" })
  addMission = uiCommandWithLogin2("Mission", async () => this.navigateInternal(this.w6.url.play + '/' + this.game.slug + '/missions/new'), { icon: "icon withSIX-icon-Nav-Mission" });
  addCollection = uiCommandWithLogin2("Collection", async () => this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.game } }), { icon: "icon withSIX-icon-Nav-Collection" })
  updateAll = uiCommand2("Update all", () => new InstallContents(this.game.id, Array.from(this.updates.values()).map(x => { return { id: x.id } }), { text: "Available updates" }).handle(this.mediator), { cls: "warn", icon: 'withSIX-icon-Hexagon-Upload2' });
  addContentMenu: IMenuItem[] = [
    new MenuItem(this.addCollection),
    new MenuItem(this.addMod),
    new MenuItem(this.addMission)
  ]

  updatedToBasketInfo() {
    return Array.from(this.updates.values()).map(x => this.toBasketInfo(x));
  }

  toBasketInfo(content: IContent): IBasketItem {
    return {
      id: content.id, packageName: content.packageName,
      gameId: content.gameId,
      itemType: BasketItemType.Mod,
      author: content.author || "N/A",
      image: content.image,
      name: content.name,
      sizePacked: content.sizePacked
    }
  }
}

export interface IHomeData {
  updates: any[];
  newContent: any[];
  recent: any[];
  installedMissionsCount: number;
  installedModsCount: number;
}
export class GetGameHome extends Query<IHomeData> {
  constructor(public id: string) { super() }
}

@handlerFor(GetGameHome)
class GetGameHomeHandler extends DbClientQuery<GetGameHome, IHomeData> {
  public async handle(request: GetGameHome): Promise<IHomeData> {
    //return GetHomeHandler.designTimeData(request);
    var r: IHomeData = await this.client.getGameHome(request.id);
    r.recent.forEach(x => x.showRecent = true)

    // TODO: Collections
    var allMods = r.newContent.concat(r.recent).concat(r.updates);
    await this.handleModAugments(allMods);

    return r;
  }

  static async designTimeData(request: GetGameHome) {
    return {
      updates: [{
        id: "x",
        name: "Test mod",
        slug: "test-mod",
        type: "mod",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
      }, {
          id: "x",
          name: "Test mod 2",
          slug: "test-mod-2",
          type: "mod",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 3",
          slug: "test-mod-3",
          type: "mod",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }],
      newContent: [
        {
          id: "x",
          name: "Test mod",
          slug: "test-mod",
          type: "mod",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 2",
          slug: "test-mod-2",
          type: "mod",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 3",
          slug: "test-mod-3",
          type: "mod",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }
      ],
      recent: [{
        id: "x",
        name: "Test collection",
        slug: "test-collection",
        type: "collection",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
      }, {
          id: "x",
          name: "Test collection 2",
          slug: "test-collection-2",
          type: "collection",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test collection 3",
          slug: "test-collection-3",
          type: "collection",
          isFavorite: false,
          gameId: request.id,
          gameSlug: "arma-3",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }]
    };
  }
}
