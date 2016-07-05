import {breeze, IBreezeMod, IBreezeCollectionVersion, IBreezeCollection, IBreezeModUpdate, ModsHelper, ProcessingState, IFindModel, FindModel, UiContext, Base, bindingEngine, uiCommand2, Subscriptions, ReactiveList, Debouncer, ObserveAll, ListFactory, ViewModel, ITypeahead, IFilter, ISort, Filters, ViewType, Mediator, Query, DbQuery, handlerFor, VoidCommand,
  CollectionScope, PreferredClient, IShowDependency} from '../../../framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RemoveDependencyEvent} from '../../profile/lib';


export class EditContent extends ViewModel {

  get model() { return this.w6.collection2; }
  get items() { return this.model.items; }

  constructor(ui) {
    super(ui);
    this.availableViewTypes = [ViewType.Card];
    if (ui.w6.url.environment != this.tools.Environment.Production)
      this.availableViewTypes.push(ViewType.List);
  }

  getState(mod: IShowDependency) {
    return
  }

  addContentModel: IFindModel<IFindDependency>;
  sort: ISort<IShowDependency>[] = [
    { name: "name" },
    { title: "Folder name", name: "dependency" },
    {
      name: "hasUpdates",
      title: "Updates available", customSort: (a, b) => {
        let asort = a.constraint && a.constraint !== a.version ? 1 : 0;
        let bsort = b.constraint && b.constraint !== b.version ? 1 : 0;
        if (asort > bsort) return -1;
        if (bsort > asort) return 1;
        return 0;
      }
    }]
  customSort = (item: IShowDependency, item2: IShowDependency) => {
    let i1 = item.newlyAdded || 0;
    let i2 = item2.newlyAdded || 0;
    if (i1 > i2) return -1;
    if (i1 < i2) return 1;
    return 0;
  }
  searchFields = ["name", "dependency"];
  viewType = ViewType.Card;
  filters: IFilter<IShowDependency>[] = [];
  typeahead: ITypeahead<IShowDependency>;
  filteredComponent: Filters<IShowDependency>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[] = [];


  shouldShowItemButton = (item: IFindDependency) => !this.containsDependency(item.packageName);

  timeout;
  async activate(params, routeConfig) {
    // pff
    this.timeout = setInterval(() => {
      if (this.w6.collection) {
        this.w6.collection.enableEditModeFromAurelia();
        clearInterval(this.timeout);
        this.timeout = null;
      }
    }, 500);

    let debouncer = Debouncer.debouncePromise<IFindDependency[]>(async (q) => {
      if (!q) return [];
      var data = await new SearchQuery(q, ModsHelper.getGameIds(this.model.gameId)).handle(this.mediator)
      data.forEach(d => {
        Object.defineProperty(d, 'selected', { get: () => !this.shouldShowItemButton(d) });
      });
      return data;
    }, 250);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(RemoveDependencyEvent, x => this.removeDependency(x.model)));
      d(this.addContentModel = new FindModel(q => debouncer(q), this.add, i => i.packageName));
    });
  }

  deactivate() {
    super.deactivate();
    if (this.timeout) { clearInterval(this.timeout); this.timeout = null; }
  }

  containsDependency = (dependency: string) => this.items.asEnumerable().any(x => x.dependency.equalsIgnoreCase(dependency));

  add = (i: IFindDependency) => {
    let dependency = (i && i.packageName) || this.addContentModel.searchItem;
    // TODO; allow specify version and branching directly
    if (!dependency || this.containsDependency(dependency)) return;

    let item = <IShowDependency>{ dependency: dependency, gameId: this.model.gameId, id: null, type: "dependency", isRequired: true, constraint: null, version: i.latestStableVersion }
    let s = this.addContentModel.selectedItem;
    // TODO: unclusterfuck :)
    let selectedContent = i || (s && this.addContentModel.searchItem == s.packageName && s);
    if (selectedContent) {
      item.image = this.w6.url.getContentAvatarUrl(selectedContent.avatar, selectedContent.avatarUpdatedAt);
      item.name = selectedContent.name;
      item.newlyAdded = this.addedId++;
      // TODO: Optimize: Only fetch the versions upon adding..
      item.availableVersions = selectedContent.updates.asEnumerable()
        .where(x => x.currentState == ProcessingState[ProcessingState.Finished])
        .orderByDescending(x => x, ModsHelper.versionCompare)
        .select(x => ModsHelper.getFullVersion(x))
        .toArray();
    }
    this.items.unshift(item);
  }

  removeDependency(model: IShowDependency) { this.tools.removeEl(this.items, model); }

  addedId = 1;
}

class SearchQuery extends Query<IFindDependency[]> {
  constructor(public query: string, public gameIds: string[]) {
    super();
    if (!query) throw new Error("Query cannot be empty")
  }
}

@handlerFor(SearchQuery)
class SearchQueryHandler extends DbQuery<SearchQuery, IFindDependency[]> {
  async handle(request: SearchQuery): Promise<IFindDependency[]> {
    this.tools.Debug.log("getting mods by game: " + request.gameIds.join(", ") + ", " + request.query);

    var op = this.context.getOpByKeyLength(request.query);
    var key = request.query.toLowerCase();

    var jsonQuery = {
      from: 'Mods',
      where: {
        'gameId': { in: request.gameIds }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery);

    query = query.where(new breeze.Predicate("toLower(packageName)", op, key)
      .or(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("packageName")
      .select(["packageName", "name", "id", "avatar", "avatarUpdatedAt", "updates", "latestStableVersion"])
      .take(this.context.defaultTakeTag);

    var r = await this.context.executeQuery<IBreezeMod>(query)
    return r.results;
  }
}



interface IFindDependency {
  id?: string, name: string, packageName?: string, avatar?: string, avatarUpdatedAt?: Date
  latestStableVersion?: string; updates: IBreezeModUpdate[];
}
