import {breeze, IPaginated, ModHelper, PaginatedViewModel, IFilterInfo, SortDirection, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMod, ModsHelper, IMod, uiCommand2} from '../../../../framework';
import {FilteredBase} from '../../../filtered-base';

export class Index extends FilteredBase<IMod> {
  sort = [{ name: "stat.install", title: "Installs", direction: SortDirection.Desc }, { name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];

  getMore(page = 1) { return new GetMods(this.tools.fromShortId(this.params.id), page, this.filterInfo).handle(this.mediator); }
}

class GetMods extends Query<IPaginated<IMod>> {
  constructor(public collectionId: string, public page = 1, public filterInfo: IFilterInfo<IMod>) { super() }
}

@handlerFor(GetMods)
class GetModsHandler extends DbQuery<GetMods, IPaginated<IMod>> {
  async handle(request: GetMods) {
    var query = breeze.EntityQuery.from("ModsInCollection")
      .withParameters({ collectionId: request.collectionId })
      .expand(["categories", "stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page)
      .select(this.desiredFields);
    let r = await this.context.executeQuery<IBreezeMod>(query);
    return {
      items: r.results.map(x => ModHelper.convertOnlineMod(x, this.w6.activeGame, this.w6)),
      inlineCount: r.inlineCount, page: request.page
    };
  }

  private desiredFields = ["id", "name", "packageName", "group", "groupId", "gameId", "game", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "authorText", "size", "sizePacked", "followersCount", "modVersion", "stat", "latestStableVersion"]
}
