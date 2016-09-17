import {BaseGame} from "../../lib";
import {W6Context, IBreezeMod, IUserInfo, Client, ModDataService, IModsData, ISort, Query, DbClientQuery, handlerFor, requireUser, IRequireUser, IContent, TypeScope, BasketService,
  ContentDeleted, breeze, IGamePagingRequest} from "../../../../framework";
import {inject} from "aurelia-framework";

export class Index extends BaseGame {
  heading = "Mods";
  gameName: string;
  items: IContent[];
  sort: ISort<IContent>[] = [{ name: "name" }, { name: "packageName" }];
  searchFields = ["name", "packageName"];
  itemType = "mod";

  async activate(params, routeConfig) {
    super.activate(params, routeConfig);
    let r = await new GetMods(this.game.id).handle(this.mediator);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
    });
    this.items = r.items;
  }

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      let item = list.asEnumerable().firstOrDefault(x => x.id === id);
      if (item) { this.tools.removeEl(list, item); }
    };
    deleteIfHas(this.items, evt.id);
  }

  createNew() { return this.legacyMediator.openAddModDialog(this.game.slug); }
}

@requireUser()
class GetMods extends Query<IModsData> implements IRequireUser {
  constructor(public id: string) { super(); }
  user: IUserInfo;
}

@handlerFor(GetMods)
@inject(W6Context, Client, BasketService, ModDataService)
class GetModsHandler extends DbClientQuery<GetMods, IModsData> {
  constructor(dbContext, modInfoService, bs: BasketService, private modDataService: ModDataService) {
    super(dbContext, modInfoService, bs);
  }

  public async handle(request: GetMods): Promise<IModsData> {
    let authorMods = request.user.slug ? this.getAuthoredMods(request) : Promise.resolve<IContent[]>([]);

    // TODO: only if client connected get client info.. w6.miniClient.isConnected // but we dont wait for it so bad idea for now..
    // we also need to refresh then when the client is connected later?
    const r = await this.getAllClientMods(request.id);
    r.items = r.items.concat(await authorMods);
    return r;
    // return GetModsHandler.designTimeData(request);
  }

  async getAuthoredMods(request: GetMods) {
    const optionsTodo = {};
    return this.modDataService.getAllModsByAuthorAndGame(request.user.slug, request.id, optionsTodo)
        .then(x => x.results.map(x => this.convertOnlineMods(x)))
  }

  async getAllClientMods(id: string) {
    const request = { id, page: 0 };
    let pageInfo = { items: [], page: 0, pageSize: 24, totalPages: 1 };
    let items = [];
    while (pageInfo.page < pageInfo.totalPages) {
      request.page++;
      pageInfo = await this.getClientMods(request);
      items = items.concat(pageInfo.items);
    }

    return Object.assign({}, pageInfo, { items });
  }

  async getClientMods(request: IGamePagingRequest) {
    try {
      let x = await this.client.getGameMods(request);
      await this.handleModAugments(x.items);
      return x;
    } catch (err) {
      this.tools.Debug.warn("Error while trying to get mods from client", err);
      return {items: [], page: 1, pageSize: 24, totalPages: 1};
    }
  }

  convertOnlineMods(mod: IBreezeMod): IContent {
    return Object.assign(<IContent> {
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
      version: mod.latestStableVersion,
    }, {
            publishers: mod.publishers,
    });
  }

  static async designTimeData(request: GetMods) {
    let testData = <any> [{
      id: "x",
      name: "Test mod",
      slug: "test-mod",
      type: "mod",
      isFavorite: false,
      gameId: request.id,
      gameSlug: "arma-3",
      author: "Some author",
      image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
    }, {
        id: "x",
        name: "Test mod 2",
        slug: "test-mod-2",
        type: "mod",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
						}, {
        id: "x",
        name: "Test mod 3",
        slug: "test-mod-3",
        type: "mod",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
						}, {
        id: "x",
        name: "Test mod 4",
        slug: "test-mod-4",
        type: "mod",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
						}];
    return { mods: testData.concat(testData, testData) };
  }
}
