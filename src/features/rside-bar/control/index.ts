import { ITabModel, ServerTab, SharedValues } from "../rside-bar";
import { Command as ScaleServer } from "./actions/scale";
import { GetAvailableServersInfo, StartServer, RestartServer, PrepareServer, StopServer, CreateOrUpdateServer, GetLog, GetLogs } from "./actions/other"; // todo decompose
import { IManagedServerStatus, IReactiveCommand, Rx, ServerLocation, ServerSize, ServerState, ServerStore, uiCommand2 } from "../../../framework"

interface IStatusTab extends ITabModel<any> { }

export class Index extends ServerTab<IStatusTab> {
  State = ServerState;
  isLocked = false;
  sizes = SharedValues.sizes;
  saving: boolean;
  additionalSlots: number;
  start: IReactiveCommand<void>;
  stop: IReactiveCommand<void>;
  restart: IReactiveCommand<void>;
  prepare: IReactiveCommand<void>;
  scale: IReactiveCommand<void>;
  lock: IReactiveCommand<void>;
  unlock: IReactiveCommand<void>;

  commands = [];

  availableServers = 0;

  players = [
    { name: "Player X" },
    { name: "Player Y" },
  ];

  private _selectedSize: { value: ServerSize };

  get selectionChanged() {
    return (this.selectedSize && this.selectedSize.value !== this.server.setup.size)
      || this.additionalSlots !== this.server.setup.additionalSlots;
  }
  get showStatus() { return this.status.state < ServerState.InstancesShutdown && this.status.state > ServerState.Initializing; }
  get isExecuting() { return this.commands.some(x => x.isExecuting); }

  get selectedSize() { return this._selectedSize; }
  set selectedSize(value) { this._selectedSize = value; this.additionalSlots = 0; }

  get isRunning() { return this.status.state === ServerState.GameIsRunning; }
  get canStop() { return (this.status.state > ServerState.Initializing && this.status.state <= ServerState.GameIsRunning); }
  get canStart() {
    return !this.isExecuting &&
      (this.status.state === ServerState.Initializing || this.status.state === ServerState.ContentPrepared || this.status.state >= ServerState.Failed);
  }
  get canRestart() { return !this.isExecuting && this.isRunning; }
  get canPrepare() {
    return !this.isExecuting && (this.status.state === ServerState.Initializing
      || this.status.state === ServerState.GameIsRunning || this.status.state >= ServerState.Failed);
  }
  get canScale() { return !this.isExecuting && this.selectionChanged; }
  get serverUrl() { return `/u/${this.w6.userInfo.slug}/servers/${this.server.slug}`; }
  get status() { return this.server.status; }

  activate(model) {
    super.activate(model);
    this._selectedSize = SharedValues.sizeMap.get(this.server.setup.size);
    this.additionalSlots = this.server.setup.additionalSlots;
    this.subd((d) => {
      d(this.lock = uiCommand2("Lock", async () => alert("TODO"), {
        cls: "ignore-close warn",
        isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && !l),
      }));
      d(this.unlock = uiCommand2("Unlock", async () => alert("TODO"), {
        cls: "ignore-close warn",
        isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && l),
      }));

      d(this.start = uiCommand2("Start", () => this.handleStart(), {
        canExecuteObservable: this.observeEx(x => x.canStart),
        cls: "ignore-close default",
      }));
      d(this.stop = uiCommand2("Stop", () => this.handleStop(), {
        canExecuteObservable: this.observeEx(x => x.canStop),
        cls: "ignore-close danger",
      }));
      d(Rx.Observable.interval(15 * 1024).merge(Rx.Observable.of(1)).concatMap(() => this.refreshAvailableServers()).subscribe());
      d(this.restart = uiCommand2("Restart", () => this.handleRestart(), {
        canExecuteObservable: this.observeEx(x => x.canRestart),
        cls: "ignore-close warn",
      }));
      d(this.prepare = uiCommand2("Prepare content and configs",
        () => this.handlePrepare(), {
          canExecuteObservable: this.observeEx(x => x.canPrepare),
          cls: "ignore-close warn",
        }));
      d(this.scale = uiCommand2("Scale", () => this.handleScale(), {
        canExecuteObservable: this.observeEx(x => x.canScale),
        cls: "ignore-close warn",
      }));
    });
    this.commands = [this.start, this.stop, this.restart, this.prepare, this.scale];
  }

  handleStart = async () => {
    await this.saveChanges();
    await new StartServer(this.server.id).handle(this.mediator);
  }
  handleRestart = async () => {
    await this.saveChanges();
    await new RestartServer(this.server.id).handle(this.mediator);
  }
  handlePrepare = async () => {
    await this.saveChanges();
    await new PrepareServer(this.server.id).handle(this.mediator)
  }
  handleStop = async () => {
    await this.saveChanges();
    await new StopServer(this.server.id).handle(this.mediator);
  }

  handleScale = async () => {
    // TODO: Reverse this and don't do saveChanges?
    this.server.setup.size = this.selectedSize.value;
    this.server.setup.additionalSlots = this.additionalSlots;
    await this.saveChanges();
    await new ScaleServer(this.server.id, this.selectedSize.value, this.additionalSlots).handle(this.mediator);
  }

  async refreshAvailableServers() {
    this.availableServers = await this.request(new GetAvailableServersInfo(this.server.setup.location || ServerLocation.WestEU));
  }

  async saveChanges() {
    try {
      this.saving = true;
      await new CreateOrUpdateServer(this.w6.activeGame.id, this.server.id, ServerStore.serverToStorage(this.server)).handle(this.mediator);
      this.navigateInternal(this.serverUrl);
    } finally {
      this.saving = false;
    }
  }
}
