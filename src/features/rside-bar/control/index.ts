import { ITabModel, ServerTab, SharedValues } from "../rside-bar";
import { Command as ScaleServer } from "./actions/scale";
import { StartServer, RestartServer, PrepareServer, StopServer, CreateOrUpdateServer } from "./actions/other"; // todo decompose
import { ServerSize, ServerState, ServerStore, uiCommand2 } from "../../../framework"

interface IStatusTab extends ITabModel<any> { }

export class Index extends ServerTab<IStatusTab> {
  State = ServerState;
  isLocked = false;
  sizes = SharedValues.sizes;
  saving: boolean;
  additionalSlots: number;

  get selectionChanged() {
    return (this.selectedSize && this.selectedSize.value !== this.server.size)
      || this.additionalSlots !== this.server.additionalSlots;
  }

  start = uiCommand2("Start", () => this.handleStart(), {
    canExecuteObservable: this.observeEx(x => x.canStart),
    cls: "ignore-close default",
  });
  stop = uiCommand2("Stop", () => this.handleStop(), {
    canExecuteObservable: this.observeEx(x => x.canStop),
    cls: "ignore-close danger",
  });
  restart = uiCommand2("Restart", () => this.handleRestart(), {
    canExecuteObservable: this.observeEx(x => x.isRunning),
    cls: "ignore-close warn",
  });
  prepare = uiCommand2("Prepare content and configs",
    () => this.handlePrepare(), {
      canExecuteObservable: this.observeEx(x => x.canPrepare),
      cls: "ignore-close warn",
    });
  scale = uiCommand2("Scale", () => this.handleScale(), {
    canExecuteObservable: this.observeEx(x => x.isRunning)
      .combineLatest(this.observeEx(x => x.selectionChanged), (r, c) => r && c),
    cls: "ignore-close warn",
  });
  lock = uiCommand2("Lock", async () => alert("TODO"), {
    cls: "ignore-close warn",
    isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && !l),
  });
  unlock = uiCommand2("Unlock", async () => alert("TODO"), {
    cls: "ignore-close warn",
    isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && l),
  });

  players = [
    { name: "Player X" },
    { name: "Player Y" },
  ];

  private _selectedSize: { value: ServerSize };

  get jobState() { return this.server.status; }
  get selectedSize() { return this._selectedSize; }
  set selectedSize(value) { this._selectedSize = value; this.additionalSlots = 0; }

  get isRunning() { return this.state === ServerState.GameIsRunning; }
  get canStop() { return (this.state > ServerState.Initializing && this.state <= ServerState.GameIsRunning); }
  get canStart() {
    return (this.state === ServerState.Initializing || this.state === ServerState.ContentPrepared || this.state >= ServerState.Failed);
  }
  get canPrepare() {
    return (this.state === ServerState.Initializing
      || this.state === ServerState.GameIsRunning || this.state >= ServerState.Failed);
  }
  get state() { return this.jobState ? this.jobState.state : 0; }

  get serverUrl() {
    return `/p/${this.w6.activeGame.slug}/servers/${this.jobState.address.replace(/\./g, "-")}/${this.server.name.sluggify()}`
  }

  activate(model) {
    super.activate(model);
    this._selectedSize = SharedValues.sizeMap.get(this.server.size);
    this.additionalSlots = this.server.additionalSlots;
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
  handleStop = () => new StopServer(this.server.id).handle(this.mediator);

  handleScale = async () => {
    // TODO: Reverse this and don't do saveChanges?
    this.server.size = this.selectedSize.value;
    this.server.additionalSlots = this.additionalSlots;
    await this.saveChanges();
    await new ScaleServer(this.server.id, this.selectedSize.value, this.additionalSlots).handle(this.mediator);
  }

  async saveChanges() {
    try {
      this.saving = true;
      await new CreateOrUpdateServer(this.w6.activeGame.id, this.server.id, ServerStore.serverToStorage(this.server)).handle(this.mediator);
    } finally {
      this.saving = false;
    }
  }
}
