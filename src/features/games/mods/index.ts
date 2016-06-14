import {IPaginated, PaginatedViewModel, IFilterInfo, SortDirection, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMod, ModsHelper, IMod, uiCommand2} from '../../../framework';
import {FilteredBase} from '../shared';

export class Index extends FilteredBase<IMod> {
  sort = [{ name: "stat.install", title: "installs", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];
  async activate() {
    await super.activate();
    this.handleAngularHeader();
  }

  getMore(page = 1) { return new GetMods(ModsHelper.getGameIds(this.w6.activeGame.id), page, this.filterInfo).handle(this.mediator); }

  deactivate() {
    super.deactivate();
    this.reverseAngularHeader();
  }
}

class GetMods extends Query<IPaginated<IMod>> {
  constructor(public gameIds: string[], public page = 1, public filterInfo: IFilterInfo<IMod>) { super() }
}

@handlerFor(GetMods)
class GetModsHandler extends DbQuery<GetMods, IPaginated<IMod>> {
  async handle(request: GetMods) {
    var jsonQuery = {
      from: 'Mods',
      where: {
        'gameId': { in: request.gameIds }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["categories", "stat"]);
    query = FilteredBase.handleQuery(query, request.filterInfo);
    if (!request.filterInfo.sortOrder || request.filterInfo.sortOrder.name != 'name') query = query.orderBy("name")
    query = PaginatedViewModel.handleQuery(query, request.page)
      .select(this.desiredFields);
    let r = await this.context.executeQuery<IBreezeMod>(query);
    return {
      items: r.results.map(x => {
        return {
          id: x.id,
          image: this.context.w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
          author: x.authorText || x.author.displayName,
          authorSlug: x.author ? x.author.slug : null,
          slug: x.slug,
          name: x.name,
          gameId: x.game.id,
          gameSlug: x.game.slug,
          size: x.size,
          sizePacked: x.sizePacked,
          stat: x.stat,
          type: "mod",
          version: x.latestStableVersion,
        }
      }), inlineCount: r.inlineCount, page: request.page
    };
  }

  private desiredFields = ["id", "name", "packageName", "group", "groupId", "gameId", "game", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "authorText", "size", "sizePacked", "followersCount", "modVersion", "stat", "latestStableVersion"]
}
