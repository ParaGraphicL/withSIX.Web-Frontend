import {IPaginated, PaginatedViewModel, Query, SortDirection, IFilterInfo, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMission, ModsHelper, IMission} from '../../../framework';
import {FilteredBase} from '../shared';

export class Index extends FilteredBase<IMission> {
  // { name: "stat.install", title: "installs", direction: SortDirection.Desc },
  sort = [{ name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]

  searchFields = ["name", "packageName"];

  getMore(page = 1) { return new GetMissions(this.w6.activeGame.id, page, this.filterInfo).handle(this.mediator); }
}

class GetMissions extends Query<IPaginated<IMission>> {
  constructor(public gameId: string, public page = 1, public filterInfo: IFilterInfo<IMission>) { super() }
}

@handlerFor(GetMissions)
class GetMissionsHandler extends DbQuery<GetMissions, IPaginated<IMission>> {
  async handle(request: GetMissions) {
    var jsonQuery = {
      from: 'Missions',
      where: {
        'gameId': { in: ModsHelper.getGameIds(request.gameId) }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat"]);
    query = this.handleFilterQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = this.handlePaginationQuery(query, request.page);
    //.select(this.desiredFields); // cant be used, virtual props
    let r = await this.context.executeQuery<IBreezeMission>(query);
    return {
      items: r.results.map(x => {
        return {
          id: x.id,
          image: this.context.w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
          author: x.author.displayName,
          authorSlug: x.author ? x.author.slug : null,
          slug: x.slug,
          name: x.name,
          gameId: request.gameId,
          gameSlug: this.w6.activeGame.slug,
          originalGameId: x.game.id,
          originalGameSlug: x.game.slug,
          size: x.size,
          sizePacked: x.sizePacked,
          stat: x.stat,
          type: "mission",
          //version: x.version, // todo
        }
      }), page: request.page, inlineCount: r.inlineCount
    };
  }
  //private desiredFields = ["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "authorId", "author", "gameId", "game", "size", "sizePacked", "followersCount", "modsCount"]
}
