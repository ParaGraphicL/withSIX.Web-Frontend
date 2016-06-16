import {IBreezeMod, IBreezeCollectionVersion, IBreezeCollection, IBreezeModUpdate, ModsHelper, ProcessingState, IFindModel, FindModel, UiContext, Base, bindingEngine, uiCommand2, Subscriptions, ReactiveList, Debouncer, ObserveAll, ListFactory, ViewModel, ITypeahead, IFilter, ISort, Filters, ViewType, Mediator, Query, DbQuery, handlerFor, VoidCommand,
  CollectionScope, PreferredClient} from '../../../../framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IShowDependency, RemoveDependencyEvent} from '../../lib';

interface IFindDependency {
  id?: string, name: string, packageName?: string, avatar?: string, avatarUpdatedAt?: Date
  updates: IBreezeModUpdate[];
}

@inject(UiContext)
export class Show extends ViewModel {
  CollectionScope = CollectionScope;
  PreferredClient = PreferredClient;
  scopes = [CollectionScope.Public, CollectionScope.Unlisted, CollectionScope.Private];
  clients = [PreferredClient.Default, PreferredClient.Sync, PreferredClient.PlayWithSix];
  menuItems = [];
  rxList: ReactiveList<IShowDependency>;
  rxList2: ReactiveList<IServer>;
  model: ICollectionData;
  addContentModel: IFindModel<IFindDependency>;
  sort: ISort<IShowDependency>[] = [{ name: "name" }]
  customSort = (item: IShowDependency, item2: IShowDependency) => {
    if (item.newlyAdded && item2.newlyAdded) return 0;
    if (item.newlyAdded) return -1;
    return 0;
  }
  searchFields = ["name"];
  viewType = ViewType.Card;
  filters: IFilter<IShowDependency>[] = [];
  typeahead: ITypeahead<IShowDependency>;
  filteredComponent: Filters<IShowDependency>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[] = [];
  current: Subscriptions;
  shortId: string;
  get items() { return this.model.items; }
  get servers() { return this.model.servers; }

  _changed = false;

  get changed() { return this._changed || (window.w6Cheat.collection && window.w6Cheat.collection.hasChangesFromAurelia()); }
  set changed(value: boolean) { this._changed = value; }

  get editModeEnabled() { return window.w6Cheat.collection && window.w6Cheat.collection.$scope.editConfig.editMode }

  constructor(ui: UiContext) {
    super(ui);
    this.availableViewTypes = [ViewType.Card];
    if (ui.w6.url.environment != this.tools.Environment.Production)
      this.availableViewTypes.push(ViewType.List);

    this.subscriptions.subd(d => {
      //d(this.changedObservable);
      d(this.save);
      d(this.cancel);
      d(this.refreshRepo);
    });
  }

  async activate(params, routeConfig) {
    this.shortId = params.id;
    await this.setupModel();

    let debouncer = Debouncer.debouncePromise<IFindDependency[]>(async (q) => {
      var data = await new SearchQuery(q, ModsHelper.getGameIds(this.model.gameId)).handle(this.mediator)
      data.forEach(d => {
        Object.defineProperty(d, 'selected', { get: () => !this.shouldShowItemButton(d) });
      });
      return data;
    }, 250);
    this.subscriptions.subd(d => {
      d(this.current);
      d(this.eventBus.subscribe(RemoveDependencyEvent, x => this.removeDependency(x.model)));
      d(this.addContentModel = new FindModel(q => debouncer(q), this.add, i => i.packageName));
    });
  }

  async canDeactivate() {
    if (!this._changed) return true;
    this.openChanges();
    return false;
  }

  shouldShowItemButton = (item: IFindDependency) => !this.containsDependency(item.packageName);

  save = uiCommand2("Save", async () => {
    //await Base.delay(5000);
    await new Save(this.model).handle(this.mediator);
    this.changed = false;
    //try {
    await window.w6Cheat.collection.saveFromAurelia();
    //} catch (err) {
    // for crying out loud!
    //this.navigateInternal(window.location.pathname.replace("/content/edit", ""));
    //throw err;
    //}
  }, {
      canExecuteObservable: this.observeEx(x => x.changed),
      cls: "ok"
    }) // , this.changedObservable

  cancel = uiCommand2("Cancel", async () => {
    await this.resetup();
    this.changed = false;
    window.w6Cheat.collection.cancelFromAurelia();
  }, {
      canExecuteObservable: this.observeEx(x => x.changed).combineLatest(this.save.isExecutingObservable, (x, y) => x && !y),
      cls: "cancel"
    })
  // TODO: have to dispose the Multi?

  disableEditMode = uiCommand2("Close Editor", async () => {
    if (this.changed)
      this.openChanges();
    else {
      window.w6Cheat.collection.disableEditModeFromAurelia();
    }
  }, {
      isVisibleObservable: this.observeEx(x => x.editModeEnabled)
    })

  enableEditMode = uiCommand2("Open Editor", async () => {
    window.w6Cheat.collection.enableEditModeFromAurelia();
  }, {
      isVisibleObservable: this.observeEx(x => x.editModeEnabled).select(x => !x)
    });

  async resetup() {
    var current = this.current;
    // TODO: wouldn't it be easier to just revisit the URL and refresh somehow?
    await this.setupModel();
    current.dispose();
  }

  async setupModel() {
    this.model = await new GetCollection(this.shortId).handle(this.mediator);
    this.current = new Subscriptions();
    this.current.subd(d => {
      d(this.rxList = this.listFactory.getList(this.items));
      d(this.rxList2 = this.listFactory.getList(this.servers));
      let obs = Rx.Observable.merge(
        this.rxList.modified.select(x => true),
        this.rxList2.modified.select(x => true),
        this.listFactory.getObserveAll(this.model).select(x => true));
      d(this.toProperty(obs, x => x.changed))
    });
  }

  refreshRepo = uiCommand2("Refresh Repo", async () => {
    await new RefreshRepo(this.model.id).handle(this.mediator);
    await this.resetup();
  }, { canExecuteObservable: this.observeEx(x => x.changed).select(x => !x) }); // TODO: Monitor also this.model.repositories, but we have to swap when we refresh the model :S

  containsDependency = (dependency: string) => this.items.asEnumerable().any(x => x.dependency.equalsIgnoreCase(dependency));

  add = (i: IFindDependency) => {
    let dependency = (i && i.packageName) || this.addContentModel.searchItem;
    // TODO; allow specify version and branching directly
    if (!dependency || this.containsDependency(dependency)) return;

    let item = <IShowDependency>{ dependency: dependency, gameId: this.model.gameId, id: null, type: "dependency", isRequired: true, constraint: null };
    let s = this.addContentModel.selectedItem;
    // TODO: unclusterfuck :)
    let selectedContent = i || (s && this.addContentModel.searchItem == s.packageName && s);
    if (selectedContent) {
      item.image = this.w6.url.getContentAvatarUrl(selectedContent.avatar, selectedContent.avatarUpdatedAt);
      item.name = selectedContent.name;
      item.newlyAdded = true;
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
}

interface IServer {
  address: string;
  password: string;
}

interface ICollectionData {
  id: string;
  name: string;
  gameId: string;
  items: IShowDependency[];
  servers: IServer[];
  repositories: string;
  scope: CollectionScope;
  updatedAt: Date;
  preferredClient: PreferredClient;
}

class GetCollection extends Query<ICollectionData> {
  constructor(public collectionId: string) { super(); }
}

@handlerFor(GetCollection)
class GetCollectionHandler extends DbQuery<GetCollection, ICollectionData> {
  async handle(request: GetCollection): Promise<ICollectionData> {

    var col = await this.executeKeyQuery<IBreezeCollection>(
      () => this.getEntityQueryFromShortId("Collection", request.collectionId)
        .withParameters({ id: this.tools.fromShortId(request.collectionId) }));
    var ver = await this.context.getCustom<IBreezeCollectionVersion>("collectionversions/" + col.latestVersionId);
    var items = ver.data.dependencies.asEnumerable()
      .select(x => {
        var availableVersions = (<any>x).availableVersions;
        var dep = <IShowDependency>{ dependency: x.dependency, type: "dependency", id: x.id, gameId: col.gameId, constraint: x.constraint, isRequired: x.isRequired, availableVersions: availableVersions, name: (<any>x).name };
        var dx = (<any>x);
        if (dx.avatar)
          dep.image = this.w6.url.getContentAvatarUrl(dx.avatar, dx.avatarUpdatedAt);
        return dep;
      }).toArray();
    var server = ver.data.servers ? ver.data.servers.asEnumerable().firstOrDefault() : null;
    var s = server ? { address: server.address, password: server.password } : { address: "", password: "" };

    return { id: col.id, name: col.name, gameId: col.gameId, items: items, servers: [s], repositories: ver.data.repositories || "", scope: CollectionScope[col.scope], updatedAt: col.updatedAt, preferredClient: PreferredClient[col.preferredClient] };
  }
}

class Save extends VoidCommand {
  constructor(public model: ICollectionData) { super() }
}

@handlerFor(Save)
class SaveHandler extends DbQuery<Save, void> {
  async handle(request: Save) {
    var servers = [];
    var repositories = [];
    if (request.model.repositories)
      repositories = repositories.concat(request.model.repositories.split(";"));
    if (request.model.servers[0].address)
      servers.push(request.model.servers[0]);
    await this.context.postCustom("collections/" + request.model.id, {
      scope: request.model.scope,
      dependencies: request.model.items,
      servers: servers,
      repositories: repositories,
      preferredClient: request.model.preferredClient
    })
  }
}

class SearchQuery extends Query<IFindDependency[]> {
  constructor(public query: string, public gameIds: string[]) { super(); }
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
      .select(["packageName", "name", "id", "avatar", "avatarUpdatedAt", "updates"])
      .take(this.context.defaultTakeTag);

    var r = await this.context.executeQuery<IBreezeMod>(query)
    return r.results.asEnumerable().toArray();
  }
}


class RefreshRepo extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(RefreshRepo)
class RefreshRepoHandler extends DbQuery<RefreshRepo, void> {
  async handle(request: RefreshRepo) {
    await this.context.postCustom("collections/" + request.id + "/refresh-repo");
  }
}
