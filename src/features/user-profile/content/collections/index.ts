import { breeze, IPaginated, PaginatedViewModel, SortDirection, IFilterInfo, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeCollection, ModsHelper, ICollection, CollectionHelper, TypeScope } from '../../../../framework';
import { FilteredBase } from '../../../filtered-base';

export class Index extends FilteredBase<ICollection> {
  sort = [{ title: "Subscribers", name: "subscribersCount", direction: SortDirection.Desc }, { name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]

  searchFields = ["name"];

  getMore(page = 1) { return new GetCollections(this.params.slug, page, this.filterInfo).handle(this.mediator); }
}

class GetCollections extends Query<IPaginated<ICollection>> {
  constructor(public authorSlug: string, public page = 1, public filterInfo: IFilterInfo<ICollection>) { super() }
}

@handlerFor(GetCollections)
class GetCollectionsHandler extends DbQuery<GetCollections, IPaginated<ICollection>> {
  async handle(request: GetCollections) {
    var jsonQuery = {
      from: 'Collections',
      where: {
        'author.slug': request.authorSlug // TODO: get the ID instead!
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page);
    //.select(this.desiredFields); // cant be used, virtual props
    let r = await this.context.executeQuery<IBreezeCollection>(query);
    return { items: r.results.map(x => CollectionHelper.convertOnlineCollection(x, null, this.w6)), page: request.page, inlineCount: r.inlineCount, total: r.inlineCount };
  }
  //private desiredFields = ["id", "name", "gameId", "game", "groupId", "group", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "size", "sizePacked", "subscribersCount", "modsCount"]
}
