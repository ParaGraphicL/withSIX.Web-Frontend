import {IPaginated, Query, SortDirection, IFilterInfo, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMission, ModsHelper, IMission} from '../../../framework';
import {FilteredBase} from '../shared';

export class Index extends FilteredBase<IMission> {
  // { name: "stat.install", title: "installs", direction: SortDirection.Desc },
  sort = [{ name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];

  async activate() {
    await super.activate();
    this.handleAngularHeader();
  }

  getMore(page = 1) { return new GetMissions(ModsHelper.getGameIds(this.w6.activeGame.id), page, this.filterInfo).handle(this.mediator); }

  deactivate() {
    super.deactivate();
    this.reverseAngularHeader();
  }
}

class GetMissions extends Query<IPaginated<IMission>> {
  constructor(public gameIds: string[], public page = 1, public filterInfo: IFilterInfo<IMission>) { super() }
}

@handlerFor(GetMissions)
class GetMissionsHandler extends DbQuery<GetMissions, IPaginated<IMission>> {
  async handle(request: GetMissions) {
    var jsonQuery = {
      from: 'Missions',
      where: {
        'gameId': { in: request.gameIds }
      }
    }
    var pageSize = 24;
    var page = 1;
    var query = new breeze.EntityQuery(jsonQuery).expand(["stat"]);
    query = FilteredBase.handleQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = query
      .skip(((page - 1) * pageSize))
      .take(pageSize)
      .inlineCount(true);
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
          gameId: x.game.id,
          gameSlug: x.game.slug,
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
