import {breeze, IPaginated, ModHelper, PaginatedViewModel, IFilterInfo, SortDirection, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem, IBreezeMod, ModsHelper, IMod, uiCommand2} from '../../../framework';
import {FilteredBase} from '../../filtered-base';

export class Index extends FilteredBase<IMod> {
  sort = [{ name: "stat.install", title: "Installs", direction: SortDirection.Desc }, { name: "updatedAt", title: "Updated", direction: SortDirection.Desc }, { name: "createdAt", title: "Created", direction: SortDirection.Desc }, { name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];
  tags: IGameTag[];

  async activate(params) {
    await super.activate(params);
    this.tags = await new GetGameTags(params.gameSlug || this.w6.activeGame.slug).handle(this.mediator);
    if (params.tag) {
      this.selectedTag = this.tags.filter(x => x.tagId === params.tag)[0];
    }
  }

  selectedTag: IGameTag;

  selectTag(t: IGameTag) {
    this.selectedTag = t;
    this.filteredComponent.initiateUpdate();
  }

  getMore(page = 1) { return new GetMods(this.w6.activeGame.id, page, this.selectedTag ? Object.assign({}, this.filterInfo, { tags: [this.selectedTag.tagId] }) : this.filterInfo).handle(this.mediator); }
}

interface IGameTag { tagId: string, contentCount: number }
class GetGameTags extends Query<IGameTag[]> {
  constructor(public gameSlug: string) { super() }
}

@handlerFor(GetGameTags)
class GetGameTagsHandler extends DbQuery<GetGameTags, IGameTag[]> {
  handle(request: GetGameTags) {
    return this.context.getCustom<IGameTag[]>(`games/${request.gameSlug}/tags`)
  }
}

class GetMods extends Query<IPaginated<IMod>> {
  constructor(public gameId: string, public page = 1, public filterInfo: IFilterInfo<IMod>) { super() }
}

@handlerFor(GetMods)
class GetModsHandler extends DbQuery<GetMods, IPaginated<IMod>> {
  async handle(request: GetMods) {
    var jsonQuery = {
      from: 'Mods',
      where: {
        'gameId': { in: ModsHelper.getGameIds(request.gameId) }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["categories", "stat"]);
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

  private desiredFields = ModHelper.interestingFields
}
