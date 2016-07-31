import {UiContext, ViewModel, uiCommand2, Query, DbQuery, DbClientQuery, handlerFor, IContent, TypeScope, IGame, IContentStatusChange, IContentStateChange, ItemState, IContentState,
  InstallContents, ContentDeleted, GameChanged, IBreezeMod, breeze} from '../../../framework';
import {inject} from 'aurelia-framework';
import {GetGames} from '../library/games';

@inject(UiContext)
export class Index extends ViewModel {
  heading = "home"
  clientEnabled: boolean;
  model: IHomeData;

  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    try {
      this.model = await new GetHome().handle(this.mediator)
      this.clientEnabled = true;
    } catch (err) {
      this.tools.Debug.warn("Error trying to fetch overall home", err);
      this.clientEnabled = false;
      try {
        let x = await new GetGames().handle(this.mediator);
        this.model = <IHomeData>x;
      } catch (err) {
        this.tools.Debug.warn("Error trying to fetch games", err);
      }
    }
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
      d(this.eventBus.subscribe("content.contentInstalled", this.handleContentInstalled));
      d(this.eventBus.subscribe("content.recentItemRemoved", (args: string) => {
        this.model.recent.delete(args);
        [this.model.newContent.get(args), this.model.updates.get(args)].forEach(x => {
          if (x != null) x.lastUsed = null;
        });
      }));
      d(this.eventBus.subscribe("content.recentItemUsed", (gameId, id, usedAt) => {
        var recentContent = this.model.recent;
        recentContent.forEach(x => {
          if (x.id == id)
            x.lastUsed = usedAt;
        });
      }));
      d(this.eventBus.subscribe("content.recentItemAdded", (evt, gameId, recentContent) => this.model.recent.set(recentContent.id, recentContent)));
      d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
      d(this.eventBus.subscribe("status.contentStatusChanged", this.handleContentStatusChanged));
    });
  }

  contentDeleted = (evt: ContentDeleted) => {
    this.model.newContent.delete(evt.id);
    this.model.updates.delete(evt.id);
    this.model.recent.delete(evt.id);
  }

  handleContentStatusChanged = (stateChange: IContentStatusChange) => this.handleStateChange(stateChange);
  handleContentStateChanged = (stateChange: IContentStateChange) => angular.forEach(stateChange.states, state => this.handleStateChange(state));
  handleContentInstalled = (evt, gameId, installedContent) => this.model.newContent.set(installedContent.id, installedContent)

  handleStateChange(state: IContentState) {
    if (state.state == ItemState.NotInstalled) {
      this.model.newContent.delete(state.id);
      this.model.updates.delete(state.id);
    } else if (state.state == ItemState.Uptodate) {
      this.model.updates.delete(state.id);
    }
  }

  updateAll = uiCommand2("Update all", async () => {
    var commands = Array.from(this.model.updates.values()).asEnumerable()
      .groupBy(x => x.gameId, x => x.id,
      (key, elements) => new InstallContents(key, elements.map(x => { return { id: x } }), { text: "Available updates" }, true))
      .toArray();
    for (let i in commands)
      await commands[i].handle(this.mediator);
  }, { cls: "warn", icon: 'withSIX-icon-Hexagon-Upload2' });
}

interface IHomeData {
  updates: Map<string, IContent>;
  newContent: Map<string, IContent>;
  recent: Map<string, IContent>;
  games: Map<string, IGame>;
}
class GetHome extends Query<IHomeData> { }

@handlerFor(GetHome)
class GetHomeHandler extends DbClientQuery<GetHome, IHomeData> {
  public async handle(request: GetHome): Promise<IHomeData> {
    //return GetHomeHandler.designTimeData();
    var home: {
      updates: IContent[];
      newContent: IContent[];
      recent: IContent[];
      games: IGame[];
    } = await this.client.getHome();

    // TODO: Collections
    var allMods = home.newContent.concat(home.recent).concat(home.updates);

    var onlineModsInfo = await this.getOnlineModsInfo(allMods.map(x => x.id));
    allMods.forEach(x => {
      if (onlineModsInfo.has(x.id)) {
        var oi = onlineModsInfo.get(x.id);
        this.augmentModInfo(oi, x);
      }
    });

    return {
      updates: this.tools.enumToMap(home.updates.asEnumerable().orderByDescending(x => x.updatedVersion || ''), x => x.id),
      games: home.games.toMap(x => x.id),
      newContent: this.tools.enumToMap(home.newContent.asEnumerable().orderByDescending(x => x.lastInstalled || ''), x => x.id),
      recent: this.tools.enumToMap(home.recent.asEnumerable().orderByDescending(x => x.lastUsed || ''), x => x.id)
    }
  }

  augmentModInfo(x: IBreezeMod, mod) {
    Object.assign(mod, {
      image: this.w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
      size: x.size,
      sizePacked: x.sizePacked,
      stat: x.stat,
      author: x.authorText || x.author.displayName,
      authorSlug: x.author ? x.author.slug : null,
    })
  }

  async getOnlineModsInfo(ids: string[]) {
    var jsonQuery = {
      from: 'Mods',
      where: {
        'id': { in: [...new Set(ids)] }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery)
      .select(['avatar', 'avatarUpdatedAt', 'size', 'sizePacked', 'author', 'authorText']);
    var r = await this.context.executeQuery<IBreezeMod>(query);
    return r.results.toMap(x => x.id);
  }

  static async designTimeData() {
    return {
      updates: [{
        id: "x",
        name: "Test mod",
        slug: "test-mod",
        type: "mod",
        isFavorite: false,
        gameSlug: "arma-3",
        gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
      }, {
          id: "x",
          name: "Test mod 2",
          slug: "test-mod-2",
          type: "mod",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 3",
          slug: "test-mod-3",
          type: "mod",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
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
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 2",
          slug: "test-mod-2",
          type: "mod",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test mod 3",
          slug: "test-mod-3",
          type: "mod",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
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
        gameSlug: "arma-3",
        gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
      }, {
          id: "x",
          name: "Test collection 2",
          slug: "test-collection-2",
          type: "collection",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }, {
          id: "x",
          name: "Test collection 3",
          slug: "test-collection-3",
          type: "collection",
          isFavorite: false,
          gameSlug: "arma-3",
          gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }],
      games: [{
        id: "x",
        slug: 'arma-3',
        name: 'ARMA 3',
        type: "game",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
      },
        {
          id: "x",
          slug: 'arma-2',
          name: 'ARMA 2',
          type: "game",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        },
        {
          id: "x",
          slug: 'GTA-5',
          name: 'GTA 5',
          type: "game",
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }]
    };
  }
}
