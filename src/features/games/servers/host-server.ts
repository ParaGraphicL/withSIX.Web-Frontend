import { Dialog, uiCommand2, Rx, IReactiveCommand, IDisposable, BusySignalCombiner } from '../../../framework';
const { Subject } = Rx;

interface IModel {
    scope: string;
    name: string;
    password: string;
    description: string;
    commsUrl: string;
    homepageUrl: string;
    files: FileList;
   
    launch: Function;
    launchDedicated: Function;
}

export class HostServer extends Dialog<IModel> {
    scopes = ["Public", "Unlisted", "Private"]
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
            var busyHandler: BusySignalCombiner
            d(busyHandler = new BusySignalCombiner())
            d(this.launch = uiCommand2('Launch Server', this.performLaunch, { cls: "ok", isVisibleObservable: this.whenAny(x => x.model.launch).map(x => x != null), canExecuteObservable: busyHandler.signal.map(x => !x) }))
            d(this.launchDedicated = uiCommand2('Launch Dedicated Server', this.performLaunchDedicated, { cls: "ok", isVisibleObservable: this.whenAny(x => x.model.launchDedicated).map(x => x != null), canExecuteObservable: busyHandler.signal.map(x => !x) }))
            d(busyHandler.subscribe(this.launch, this.launchDedicated))
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
    launchDedicated: IReactiveCommand<void>;
}