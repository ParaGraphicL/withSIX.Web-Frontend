import { breeze, IPaginated, MissionHelper, PaginatedViewModel, Query, SortDirection, IFilterInfo, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMission, ModsHelper, IMission } from '../../../../framework';
import { FilteredBase } from '../../../filtered-base';

export class Index extends FilteredBase<IMission> {
  // { name: "stat.totalInstall", title: "installs", direction: SortDirection.Desc },
  sort = [{ name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]

  searchFields = ["name", "packageName"];

  getMore(page = 1) { return new GetMissions(this.params.slug, page, this.filterInfo).handle(this.mediator); }
}

class GetMissions extends Query<IPaginated<IMission>> {
  constructor(public authorSlug: string, public page = 1, public filterInfo: IFilterInfo<IMission>) { super() }
}

@handlerFor(GetMissions)
class GetMissionsHandler extends DbQuery<GetMissions, IPaginated<IMission>> {
  async handle(request: GetMissions) {
    var jsonQuery = {
      from: 'Missions',
      where: {
        'author.slug': request.authorSlug // TODO: get the ID instead!
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page);
    //.select(this.desiredFields); // cant be used, virtual props
    let r = await this.context.executeQuery<IBreezeMission>(query);
    return {
      items: r.results.map(x => MissionHelper.convertOnlineMission(x, null, this.w6)),
      page: request.page, inlineCount: r.inlineCount, total: r.inlineCount
    };
  }
  //private desiredFields = ["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "authorId", "author", "gameId", "game", "size", "sizePacked", "followersCount", "modsCount"]
}
