import {inject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {DialogController} from 'aurelia-dialog';
import {Debouncer, UiContext, Base, uiCommand2, Dialog, Query, Command, DbQuery, handlerFor, Mediator,
  CollectionHelper, CollectionScope, PreferredClient} from '../../../framework';
import {ensure, ValidationGroupBuilder, ValidationGroup, Validation} from 'aurelia-validation';

interface ICollectionModel {
  name: string;
  repositoryUrl: string;
  serverAddress: string;
  serverPassword: string;
  groupId: string;
  version?: string,
  scope?: CollectionScope;
  dependencies?: { dependency: string, constraint?: string }[]
  forkedCollectionId?: string;
}

interface IGame {
  name: string;
  id: string;
  slug: string;
}

export class CreateCollectionDialog extends Dialog<ICollectionModel> {
  //@ensure((it: ValidationGroupBuilder) => it.isNotEmpty())
  public game: IGame;
  validation: ValidationGroup;
  CollectionScope = CollectionScope;
  scopes = CollectionHelper.scopes;
  scopeHints = CollectionHelper.scopeHints;

  get gameName() { return this.game.name || this.w6.activeGame.slug.toUpperCaseFirst().replace(/-/g, " "); }
  get originalName() { return this.model.name.replace(" (COPY)", "") }

  activate(model) {
    super.activate(model);

    this.subscriptions.subd(d => {
      d(this.save);
      d(this.cancel);
    });

    // TODO: Read the repositoryurl and serverAddress from initialVersion ?
    this.model = model.model || { name: "", repositoryUrl: null, serverAddress: null, scope: CollectionScope.Private };
    if (this.model.scope == null) this.model.scope = CollectionScope.Private;
    this.game = model.game;
    let debouncer = Debouncer.debouncePromise(async (newValue) => { let exists = await new CollectionExists(newValue, this.game.id, this.model.groupId).handle(this.mediator); return !exists }, 250);
    this.validation = (<any>this.validator).on(this)
      .ensure('model.name')
      .isNotEmpty()
      .passes(debouncer, 250)
      .withMessage("you already own a collection with this name");
  }

  deactivate() { this.dispose(); }

  get collectionScopeIcon() { return CollectionHelper.scopeIcons[this.model.scope] }
  get collectionScopeHint() { return CollectionHelper.scopeHints[this.model.scope] }

  save = uiCommand2('Save', async () => {
    await this.validation.validate(); // TODO: how to wrap this into the UI, catch ValidationResult and then display the error info?
    var id = await new CreateCollection(this.game.id, this.model).handle(this.mediator);
    var landing = this.model.forkedCollectionId ? '' : '?landing=1';
    this.navigateInternal(this.w6.url.play + "/" + this.w6.activeGame.slug + "/collections/" + id.toShortId() + '/' + this.model.name.sluggifyEntityName() + landing);
    this.controller.ok(id);
  }, {
      cls: "ok"
    });

  cancel = uiCommand2('Cancel', async () => this.controller.cancel(null), {
    cls: "ok",
    canExecuteObservable: this.save.isExecutingObservable.select(x => !x)
  });
}

interface ICreateCollectionModel {
  name: string;
  gameId: string;
  initialVersion: IInitialVersion,
  groupId?: string;
  scope?: CollectionScope;
}

interface IInitialVersion {
  version: string;
  servers: string[];
  repositories: string[];
  dependencies?: { dependency: string, constraint?: string }[]
}

class CollectionExists extends Query<boolean> {
  constructor(public name: string, public gameId: string, public groupId: string) { super(); }
}

@handlerFor(CollectionExists)
class CollectionExistsHandler extends DbQuery<CollectionExists, boolean> {
  handle(request: CollectionExists) {
    return this.context.getCustom<{ result: boolean }>("collections/exists?name=" + request.name + "&gameId=" + request.gameId + "&groupId=" + request.groupId).then(x => x.result);
  }
}

class CreateCollection extends Command<string> {
  constructor(public gameId: string, public model: ICollectionModel) { super(); }
}

@handlerFor(CreateCollection)
class CreateCollectionHandler extends DbQuery<CreateCollection, string> {
  // TODO: Handle the repository and serveraddress on the initialversion object?!
  async handle(request: CreateCollection) {
    // repository: request.model.repositoryUrl, serverAddress: request.model.serverAddress
    let servers = [];
    let repositories = [];
    if (request.model.repositoryUrl) repositories = repositories.concat(request.model.repositoryUrl.split(";"));
    if (request.model.serverAddress) {
      let server = { address: request.model.serverAddress, password: request.model.serverPassword ? request.model.serverPassword : null }
      servers.push(server);
    }
    let initialVersion = <IInitialVersion>{
      version: request.model.version || "0.0.1",
      servers: servers,
      repositories: repositories,
      dependencies: []
    }
    if (request.model.dependencies) initialVersion.dependencies = request.model.dependencies;
    let result = await this.context.postCustom<string>("collections", {
      gameId: request.gameId,
      name: request.model.name,
      groupId: request.model.groupId,
      initialVersion: initialVersion,
      forkedCollectionId: request.model.forkedCollectionId,
      scope: request.model.scope
    });
    return result;
  }
}
