import { BaseGame } from "../../lib";
import {
  W6Context, IBreezeMod, IUserInfo, Client, ModDataService, IModsData, ISort, Query, DbClientQuery, handlerFor, requireUser, IRequireUser, IContent, TypeScope, BasketService,
  ContentDeleted, breeze, IGamePagingRequest
} from "../../../../framework";
import { inject } from "aurelia-framework";

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
    let authorMods = request.user.id ? this.getAuthoredMods(request) : Promise.resolve<IContent[]>([]);

    // TODO: only if client connected get client info.. w6.miniClient.isConnected // but we dont wait for it so bad idea for now..
    // we also need to refresh then when the client is connected later?
    const r = await this.getAllClientMods(request.id);
    r.items = r.items.concat(await authorMods);
    return <any>r;
  }

  async getAuthoredMods(request: GetMods) {
    const optionsTodo = {};
    return this.modDataService.getAllModsByAuthorAndGame(request.user.id, request.id, optionsTodo)
      .then(x => x.results.map(x => this.convertOnlineMods(x)))
  }

  async getAllClientMods(id: string) {
    const request = { id, page: 0 };
    let pageInfo = { items: [], pageNumber: 0, pageSize: 24, total: 0 };
    let totalPages = 1;
    let items = [];
    while (pageInfo.pageNumber < totalPages) {
      request.page++;
      pageInfo = await this.getClientMods(request);
      totalPages = pageInfo.total / pageInfo.pageSize;
      items = items.concat(pageInfo.items);
    }

    return Object.assign({}, pageInfo, { items });
  }

  async getClientMods(request: IGamePagingRequest) {
    try {
      let x = await this.client.getGameMods(request);
      await this.handleModAugments(x.items);
      return <any>x;
    } catch (err) {
      this.tools.Debug.warn("Error while trying to get mods from client", err);
      return { items: [], pageNumber: 1, pageSize: 24, total: 0 };
    }
  }

  convertOnlineMods(mod: IBreezeMod): IContent {
    return Object.assign(<IContent>{
      author: mod.author ? mod.author.displayName : mod.authorText,
      authorSlug: mod.author ? mod.author.slug : null,
      gameId: mod.game.id,
      gameSlug: mod.game.slug,
      id: mod.id,
      image: this.w6.url.getContentAvatarUrl(mod.avatar, mod.avatarUpdatedAt),
      name: mod.name,
      packageName: mod.packageName,
      slug: mod.slug,
      type: "mod",
      version: mod.latestStableVersion,
    }, {
        publishers: mod.publishers,
      });
  }
}
