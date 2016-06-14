import {IPaginated, SortDirection, IFilterInfo, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeCollection, ModsHelper, ICollection, CollectionHelper, TypeScope} from '../../../framework';
import {FilteredBase} from '../shared';

export class Index extends FilteredBase<ICollection> {
  sort = [{ title: "Subscribers", name: "subscribersCount", direction: SortDirection.Desc }, { name: "name" }]
  searchFields = ["name"];

  async activate() {
    await super.activate();
    this.handleAngularHeader();
  }

  getMore(page = 1) { return new GetCollections([this.w6.activeGame.id], page, this.filterInfo).handle(this.mediator); }

  deactivate() {
    super.deactivate();
    this.reverseAngularHeader();
  }
}

class GetCollections extends Query<IPaginated<ICollection>> {
  constructor(public gameIds: string[], public page = 1, public filterInfo: IFilterInfo<ICollection>) { super() }
}

@handlerFor(GetCollections)
class GetCollectionsHandler extends DbQuery<GetCollections, IPaginated<ICollection>> {
  async handle(request: GetCollections) {
    var jsonQuery = {
      from: 'Collections',
      where: {
        'gameId': { in: request.gameIds }
      }
    }
    var pageSize = 24;
    var page = 1;
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat", "latestVersion"]);
    query = FilteredBase.handleQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = query
      .skip(((page - 1) * pageSize))
      .take(pageSize)
      .inlineCount(true);
    //.select(this.desiredFields); // cant be used, virtual props
    let r = await this.context.executeQuery<IBreezeCollection>(query);
    return { items: r.results.map(x => CollectionHelper.convertOnlineCollection(x, null, this.w6)), page: request.page, inlineCount: r.inlineCount };
  }
  //private desiredFields = ["id", "name", "gameId", "game", "groupId", "group", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "size", "sizePacked", "subscribersCount", "modsCount"]
}
