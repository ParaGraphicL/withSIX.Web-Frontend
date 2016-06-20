import {W6Context, IBreezeMod, IUserInfo, Client, ModDataService, ISort, Query, DbClientQuery, handlerFor, requireUser, IRequireUser, Utils, IContent, TypeScope, BasketService,
  ContentDeleted} from '../../../../framework';
import {inject} from 'aurelia-framework';
import {BaseGame, Mod} from '../../lib';

export class Index extends BaseGame {
  heading = "Mods"
  gameName: string;
  items: IContent[];
  sort: ISort<IContent>[] = [{ name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];
  itemType = "mod";

  async activate(params, routeConfig) {
    super.activate(params, routeConfig);
    var r = await new GetMods(this.game.id).handle(this.mediator);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
    })
    this.items = r.mods;
  }

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      var item = list.asEnumerable().firstOrDefault(x => x.id == id);
      if (item) this.tools.removeEl(list, item);
    }
    deleteIfHas(this.items, evt.id);
  }

  createNew() { return this.legacyMediator.openAddModDialog(this.game.slug); }
}

interface IModsData {
  mods: IContent[];
}

@requireUser()
class GetMods extends Query<IModsData> implements IRequireUser {
  constructor(public id: string) { super() }
  user: IUserInfo;
}

@handlerFor(GetMods)
@inject(W6Context, Client, BasketService, ModDataService)
class GetModsHandler extends DbClientQuery<GetMods, IModsData> {
  constructor(dbContext, modInfoService, bs: BasketService, private modDataService: ModDataService) {
    super(dbContext, modInfoService, bs);
  }

  public async handle(request: GetMods) {
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
      this.getClientMods(request)
    ];

    if (request.user.slug) {
      p.push(this.modDataService.getAllModsByAuthor(request.user.slug, optionsTodo)
        .then(x => x.results.asEnumerable().select(x => this.convertOnlineMods(x))));
    }
    let results = await Promise.all<Enumerable<IContent>>(p);
    return <IModsData>{ mods: Utils.concatPromiseResults(results).toArray() };
    // return GetModsHandler.designTimeData(request);
  }

  async getClientMods(request: GetMods) {
    try {
      let x = await this.client.getGameMods(request.id);
      return x.mods.asEnumerable();
    } catch (err) {
      this.tools.Debug.warn("Error while trying to get mods from client", err);
      return [].asEnumerable();
    }
  }

  convertOnlineMods(mod: IBreezeMod): IContent {
    return {
      id: mod.id,
      author: mod.author ? mod.author.displayName : mod.authorText,
      authorSlug: mod.author ? mod.author.slug : null,
      image: this.w6.url.getContentAvatarUrl(mod.avatar, mod.avatarUpdatedAt),
      slug: mod.slug,
      name: mod.name,
      packageName: mod.packageName,
      gameId: mod.game.id,
      gameSlug: mod.game.slug,
      type: "mod",
      version: mod.latestStableVersion
    }
  }

  static async designTimeData(request: GetMods) {
    var testData = <any>[{
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
						}, {
        id: "x",
        name: "Test mod 4",
        slug: "test-mod-4",
        type: "mod",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
						}];
    return { mods: testData.concat(testData, testData) };
  }
}
