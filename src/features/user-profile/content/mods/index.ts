import {breeze, IPaginated, ModHelper, PaginatedViewModel, IFilterInfo, SortDirection, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMod, ModsHelper, IMod, uiCommand2} from '../../../../framework';
import {FilteredBase} from '../../../filtered-base';

export class Index extends FilteredBase<IMod> {
  sort = [{ name: "stat.totalInstall", title: "Installs", direction: SortDirection.Desc }, { name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];

  getMore(page = 1) { return new GetMods(this.w6.userInfo.id, page, this.filterInfo).handle(this.mediator); }
}

class GetMods extends Query<IPaginated<IMod>> {
  constructor(public authorId: string, public page = 1, public filterInfo: IFilterInfo<IMod>) { super() }
}

@handlerFor(GetMods)
class GetModsHandler extends DbQuery<GetMods, IPaginated<IMod>> {
  async handle(request: GetMods) {
    var jsonQuery = {
      from: 'Mods',
      where: {
        'authorId': { in: [request.authorId] }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page)
      .select(this.desiredFields);
    let r = await this.context.executeQuery<IBreezeMod>(query);
    return {
      items: r.results.map(x => ModHelper.convertOnlineMod(x, null, this.w6)),
      inlineCount: r.inlineCount, page: request.page
    };
  }

  private desiredFields = ModHelper.interestingFields
}
