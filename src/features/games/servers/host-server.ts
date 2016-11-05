import {
  CollectionScope, DbClientQuery, DbQuery, Dialog, IReactiveCommand, ServerHelper, VoidCommand, handlerFor, uiCommand2,
} from "../../../framework";


interface IModel {
  scope: CollectionScope;
  name: string;
  password: string;
  description: string;
  commsUrl: string;
  homepageUrl: string;
  files: FileList;
  launchAsDedicated: boolean;
  launch: Function;
  //host: (details) => Promise<void>;
  launchDedicated: Function;
}

export class HostServer extends Dialog<IModel> {
  ServerScope = CollectionScope;
  scopes = ServerHelper.scopes;
  scopeHints = ServerHelper.scopeHints;
  get scopeIcon() { return ServerHelper.scopeIcons[this.model.scope]; }
  get scopeHint() { return ServerHelper.scopeHints[this.model.scope]; }
  cancel: IReactiveCommand<void>;
  launch: IReactiveCommand<void>;
  host: IReactiveCommand<void>;

  activate(model: IModel) {
    super.activate(Object.assign({
      adminPassword: null,
      commsUrl: null,
      description: null,
      files: null,
      homepageUrl: null,
      launchAsDedicated: true,
      name: `${this.w6.userInfo.displayName}'s server`,
      password: null,
      scope: CollectionScope.Public,
    }, model));

    this.subscriptions.subd(d => {
      const changedObs = this.listFactory.getObserveAll(this.model).map(x => true);
      d(this.toProperty(changedObs, x => x.changed));
      d(this.cancel = uiCommand2("Cancel", this.performCancel, { cls: "cancel" }));
      d(this.launch = uiCommand2("Launch Server",
        this.handleLaunch,
        { cls: "ok", isVisibleObservable: this.whenAnyValue(x => x.model.launch).map(x => x != null) }));
      d(this.host = uiCommand2("Host Server",
        this.handleHost, {
          cls: "ok", isVisibleObservable: //this.whenAnyValue(x => x.model.host).map(x => x != null).combineLatest(
          this.whenAnyValue(x => x.model.launchAsDedicated), //, (x, y) => x && y),
        }));
    });
  }
  async close() {
    this.changed = false;
    await this.controller.ok();
  }

  performCancel = async () => {
    this.changed = false;
    await this.controller.cancel(null);
  }
  performLaunch = async () => {
    await this.model.launch();
    await this.close();
  }
  performLaunchDedicated = async () => {
    await this.model.launchDedicated();
    await this.close();
  }
  handleLaunch = async () => {
    const t = this.model.launchAsDedicated ? this.performLaunchDedicated() : this.performLaunch();
    await new LaunchServer(this.w6.activeGame.id, this.model.scope).handle(this.mediator);
    await t;
  }
  handleHost = () => new HostW6Server(this.model).handle(this.mediator); //this.model.host(this.model);
}

class HostW6Server extends VoidCommand {
  constructor(public details) { super(); }
}

@handlerFor(HostW6Server)
class HostW6ServerHandler extends DbQuery<HostW6Server, string> {
  handle(request: HostW6Server) {
    return this.context.postCustom<string>('server-manager', request.details);
  }
}

class LaunchServer extends VoidCommand {
  constructor(public gameId: string, public scope: CollectionScope) { super(); }
}

@handlerFor(LaunchServer)
class LaunchServerHandler extends DbClientQuery<LaunchServer, void> {
  handle(request: LaunchServer) {
    return this.context.postCustom("servers", request);
  }
}
