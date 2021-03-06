import {
  breeze, IPaginated, ModHelper, PaginatedViewModel, IFilterInfo, SortDirection, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMod, ModsHelper, IModInContent, uiCommand2,
  IShowDependency
} from '../../../../framework';
import { FilteredBase } from '../../../filtered-base';

export class Index extends FilteredBase<IModInContent> {
  sort = [{ name: "stat.totalInstall", title: "Installs", direction: SortDirection.Desc }, { name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];


  async activate(params) {
    if (!this.w6.collection2) throw new this.tools.NotFoundException("Collection not found", { statusText: "NotFound", status: 404, data: "" });
    await super.activate(params);
  }

  getMore(page = 1) { return new GetMods(this.tools.fromShortId(this.params.id), page, this.filterInfo, this.w6.collection2.items.toMap(x => x.dependency.toLowerCase())).handle(this.mediator); }
}

class GetMods extends Query<IPaginated<IModInContent>> {
  constructor(public collectionId: string, public page = 1, public filterInfo: IFilterInfo<IModInContent>, public versions: Map<string, IShowDependency>) { super() }
}

@handlerFor(GetMods)
class GetModsHandler extends DbQuery<GetMods, IPaginated<IModInContent>> {
  async handle(request: GetMods) {
    var query = breeze.EntityQuery.from("ModsInCollection")
      .withParameters({ collectionId: request.collectionId })
      .expand(["stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page)
      .select(this.desiredFields);
    let r = await this.context.executeQuery<IBreezeMod>(query);
    let mods = r.results.map(x => <IModInContent>ModHelper.convertOnlineMod(x, this.w6.activeGame, this.w6));
    mods.forEach(x => {
      let pn = x.packageName.toLowerCase();
      if (!request.versions.has(pn)) return;
      let vInfo = request.versions.get(pn);
      x.constraint = vInfo.constraint;
      x.type = 'mod-in-content';
    })
    return {
      items: mods,
      inlineCount: r.inlineCount, page: request.page, total: r.inlineCount
    };
  }

  private desiredFields = ModHelper.interestingFields
}
