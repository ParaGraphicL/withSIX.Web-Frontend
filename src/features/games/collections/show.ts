import {Router, RouterConfiguration} from 'aurelia-router';

import {breeze, IBreezeMod, IBreezeCollectionVersion, IBreezeCollection, IBreezeModUpdate, ModsHelper, ProcessingState, IFindModel, FindModel, UiContext, Base, bindingEngine, uiCommand2, Subscriptions, ReactiveList, Debouncer, ObserveAll, ListFactory, ViewModel, ITypeahead, IFilter, ISort, Filters, ViewType, Mediator, Query, DbQuery, handlerFor, VoidCommand,
  CollectionScope, PreferredClient, ICollectionData, IShowDependency, IServer} from '../../../framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RemoveDependencyEvent} from '../../profile/lib';

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
  current: Subscriptions;
  shortId: string;
  get items() { return this.model.items; }
  get servers() { return this.model.servers; }

  _changed = false;

  get changed() { return this._changed || (this.w6.collection && this.w6.collection.hasChangesFromAurelia); }
  set changed(value: boolean) { this._changed = value; }

  get isGroupCollection() { return this.model.groupId != null }

  get editModeEnabled() { return this.w6.collection && this.w6.collection.$scope.editConfig.editMode }

  constructor(ui: UiContext) {
    super(ui);

    this.subscriptions.subd(d => {
      //d(this.changedObservable);
      d(this.save);
      d(this.cancel);
      d(this.refreshRepo);
    });
  }

  get canEdit() { return this.w6.userInfo.isManager || this.w6.userInfo.id == this.model.author.id }

  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/collections';
    config.map([
      { route: 'edit', name: 'edit-content', moduleId: `${mount}/edit-content`, nav: false, title: 'Edit content' },
      { route: '', name: 'content', moduleId: `${mount}/content/index`, nav: false, title: 'Content' },
    ]);
  }

  async activate(params, routeConfig) {
    this.shortId = params.id;
    await this.setupModel();

    this.subscriptions.subd(d => {
      d(() => this.current.dispose());
    });
  }

  //deactivate() { this.w6.collection2 = null; super.deactivate() }

  async canDeactivate() {
    if (!this._changed) return true;
    this.openChanges();
    return false;
  }

  save = uiCommand2("Save", async () => {
    //await Base.delay(5000);
    await new Save(this.model).handle(this.mediator);
    this.changed = false;
    //try {
    await this.w6.collection.saveFromAurelia();
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
    this.w6.collection.cancelFromAurelia();
  }, {
      canExecuteObservable: this.observeEx(x => x.changed).combineLatest(this.save.isExecutingObservable, (x, y) => x && !y),
      cls: "cancel"
    })
  // TODO: have to dispose the Multi?

  disableEditMode = uiCommand2("Close Editor", async () => {
    if (this.changed)
      this.openChanges();
    else {
      this.w6.collection.disableEditModeFromAurelia();
    }
  }, {
      isVisibleObservable: this.observeEx(x => x.editModeEnabled)
    })

  enableEditMode = uiCommand2("Open Editor", async () => {
    this.w6.collection.enableEditModeFromAurelia();
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
    this.w6.collection2 = this.model;
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
    var items = ver.dependencies.asEnumerable()
      .select(x => {
        var availableVersions = (<any>x).availableVersions;
        var dep = <IShowDependency>{ dependency: x.dependency, type: "dependency", id: x.id, gameId: col.gameId, constraint: x.constraint, isRequired: x.isRequired, availableVersions: availableVersions, name: (<any>x).name };
        var dx = (<any>x);
        if (dx.avatar)
          dep.image = this.w6.url.getContentAvatarUrl(dx.avatar, dx.avatarUpdatedAt);
        return dep;
      }).toArray();
    var server = ver.servers ? ver.servers.asEnumerable().firstOrDefault() : null;
    var s = server ? { address: server.address, password: server.password } : { address: "", password: "" };

    return { id: col.id, name: col.name, author: col.author, gameId: col.gameId, items: items, servers: [s], repositories: ver.repositories || "", scope: CollectionScope[col.scope], updatedAt: col.updatedAt, preferredClient: PreferredClient[col.preferredClient], groupId: col.groupId };
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

class RefreshRepo extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(RefreshRepo)
class RefreshRepoHandler extends DbQuery<RefreshRepo, void> {
  async handle(request: RefreshRepo) {
    await this.context.postCustom("collections/" + request.id + "/refresh-repo");
  }
}
