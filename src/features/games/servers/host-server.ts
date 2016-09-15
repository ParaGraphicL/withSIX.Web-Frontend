import { Dialog, uiCommand2, Rx, IReactiveCommand, IDisposable, BusySignalCombiner, CollectionScope, ServerHelper } from '../../../framework';
const { Subject } = Rx;

interface IModel {
    scope: string;
    name: string;
    password: string;
    description: string;
    commsUrl: string;
    homepageUrl: string;
    files: FileList;
    launchAsDedicated: boolean;
   
    launch: Function;
    launchDedicated: Function;
}

export class HostServer extends Dialog<IModel> {
  ServerScope = CollectionScope;
  scopes = ServerHelper.scopes;
  scopeHints = ServerHelper.scopeHints;
  get scopeIcon() { return ServerHelper.scopeIcons[this.model.scope] }
   get scopeHint() { return ServerHelper.scopeHints[this.model.scope] }

    activate(model: IModel) {
        super.activate(Object.assign({
            scope: "Public",
            name: `${this.w6.userInfo.displayName}'s server`,
            password: null,
            description: null,
            commsUrl: null,
            homepageUrl: null,
            files: null
        }, model))

        this.subscriptions.subd(d => {
            const changedObs = this.listFactory.getObserveAll(this.model).map(x => true)
            d(this.toProperty(changedObs, x => x.changed))
            d(this.cancel)
            //var busyHandler: BusySignalCombiner
            //d(busyHandler = new BusySignalCombiner())
            d(this.launch = uiCommand2('Launch Server', 
                () => this.model.launchAsDedicated ? this.performLaunchDedicated() : this.performLaunch(),
                { cls: "ok", isVisibleObservable: this.whenAny(x => x.model.launch).map(x => x != null) }))
        })
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
    async close() {
        this.changed = false;
        await this.controller.ok();
    }
    cancel = uiCommand2('Cancel', this.performCancel, { cls: "cancel" });
    launch: IReactiveCommand<void>;
}