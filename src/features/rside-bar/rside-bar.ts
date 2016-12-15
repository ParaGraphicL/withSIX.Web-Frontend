import {
  ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs, Tools, W6, W6Context, DbQuery,
  ModAddedToServer, RemovedModFromServer, ServerStore, VoidCommand, handlerFor, RequestBase, ServerClient, CancelTokenSource, ICancellationToken,
  ServerSize, ServerLocation
} from '../../framework';
import { ValidationGroup } from "aurelia-validation";
import { inject } from "aurelia-framework";
import { ServerHandler, ToggleModInServer } from "./control/actions/base";

@inject(UiContext, ServerStore)
export class RsideBar extends ViewModel {
  static root = "features/rside-bar/";
  tabs: IAwesomeTab[] = [
    {
      header: "Setup", name: "setup", icon: "icon withSIX-icon-System",
      viewModel: `${RsideBar.root}setup/index`, next: (tab: IAwesomeTab) => this.next(tab),
      id: "1", notificationText: "1",
    },
    {
      header: "Settings", name: "settings", icon: "icon withSIX-icon-Settings",
      viewModel: `${RsideBar.root}settings/index`, next: (tab: IAwesomeTab) => this.next(tab),
      id: "2", notificationText: "2",
    },
    {
      header: "Mods", name: "mods", icon: "icon withSIX-icon-Nav-Mod",
      viewModel: `${RsideBar.root}mods/index`, next: (tab: IAwesomeTab) => this.next(tab),
      id: "3", notificationText: "3",
    },
    {
      header: "Missions", name: "missions", icon: "icon withSIX-icon-Nav-Mission",
      viewModel: `${RsideBar.root}missions/index`, next: (tab: IAwesomeTab) => this.next(tab),
      id: "4", notificationText: "4",
    },
    {
      header: "Control", name: "control", location: "end", icon: "icon withSIX-icon-System-Remote",
      viewModel: `${RsideBar.root}control/index`, next: (tab: IAwesomeTab) => this.next(tab),
      id: "0",
    },
  ];

  constructor(ui, protected serverStore: ServerStore) {
    super(ui);
  }

  get validSetup() { return this.tabs[0].isValid; }
  get visible() { return !!this.serverStore.activeServer; }

  cts: CancelTokenSource;

  async bind() {
    const setupTabs = [this.tabs[1], this.tabs[2], this.tabs[3]];
    const controlTabs = [this.tabs[4]];
    this.subd(d => {
      this.cts = new CancelTokenSource();
      // TODO: Game change etc
      new MonitorServerState(this.cts.token).handle(this.mediator);
      d(() => {
        this.cts.cancel();
        //this.cts.dispose();
      });
      d(this.observeEx(x => x.validSetup).subscribe(x => controlTabs.forEach(t => t.disabled = !x)));
      d(this.observableFromEvent<ToggleServer>(ToggleServer).subscribe(x => {
        const hasTab = x.tab > -1;
        const game = this.serverStore.activeGame;
        if (!this.serverStore.activeServer) { game.activeServer = game.create(); }
        if (this.visible && hasTab) { this.selectedTab = this.tabs[x.tab]; }
      }));
      d(this.observableFromEvent<ModAddedToServer>(ModAddedToServer).subscribe(x => {
        this.notifier.raiseTabNotification("mods", {
          title: 'added to server', text: x.mod.name, icon: 'withSIX-icon-Nav-Mod',
          href: this.getItemHref(x.mod),
          cls: 'end',
          command: uiCommand2("", () =>
            new ToggleModInServer(x.mod).handle(this.mediator), { tooltip: "Remove from server", icon: 'withSIX-icon-Checkmark' })
        });
      }));
      d(this.observableFromEvent<RemovedModFromServer>(RemovedModFromServer).subscribe(x => {
        this.notifier.raiseTabNotification("mods", {
          title: 'removed from server', text: x.mod.name, icon: 'withSIX-icon-Nav-Mod',
          href: this.getItemHref(x.mod),
          cls: 'start',
          command: uiCommand2("", async () =>
            new ToggleModInServer(x.mod).handle(this.mediator), { tooltip: "Add to server", icon: 'withSIX-icon-Add' })
        });
      }));
    });

    //     this.serverData = await new GetServerData().handle(this.mediator);

  }

  getItemHref = (item: { id: string; name: string }) => item.id ? `/p/${this.w6.activeGame.slug}/mods/${item.id.toShortId()}/${item.name.sluggify()}` : null;

  next(tab: IAwesomeTab | string) {
    if (tab == null) {
      this.selectedTab = this.tabs[this.tabs.length - 1];
      return;
    }
    if (typeof (tab) === "string") {
      this.selectedTab = this.tabs.filter(x => x.name === tab)[0];
    } else {
      const idx = this.tabs.indexOf(tab);
      this.selectedTab = this.tabs[idx + 1];
    }
  }
  selectedTab: ITab;
}

interface IAwesomeTab extends ITab {
  next(tab?: IAwesomeTab | string): void;
  isValid?: boolean;
  id: string;
}

export interface ITabModel<T> extends IAwesomeTab {
  data?: T;
}

export class ToggleServer {
  constructor(public tab = -1) { }
}

export class SharedValues {
  static sizes = [
    { value: ServerSize.Small, title: ServerSize[ServerSize.Small] + " (Single core, 3.5GB)", cost: 5, baseSlots: 12, maxSlots: 12 },
    { value: ServerSize.Normal, title: ServerSize[ServerSize.Normal] + " (Dual core, 7GB)", cost: 10, baseSlots: 32, maxSlots: 64 },
    { value: ServerSize.Large, title: ServerSize[ServerSize.Large] + " (Quad core, 14GB)", cost: 20, baseSlots: 64, maxSlots: 256 },
    //{ value: ServerSize.VeryLarge, title: ServerSize[ServerSize.VeryLarge] + " (Octo core, 28GB) 4SU/hr", cost: 4 },
  ];
  static locations = [
    { value: ServerLocation.WestEU, title: "West Europe" },
    { value: ServerLocation.WestUS, title: "West US" },
  ];
  static sizeMap = SharedValues.sizes.toMap(x => x.value);
}

@inject(UiContext, ServerStore)
export class ServerTab<TModel extends ITabModel<any>> extends ViewModel {
  model: TModel;
  validation: ValidationGroup;
  next;
  get isValid() { return (<any>this.validation).result.isValid; }
  //isValid: boolean;
  get setup() { return this.server.setup; }
  get settings() { return this.setup.settings; }
  get server() { return this.game.activeServer; }
  get game() { return this.serverStore.activeGame; }

  constructor(ui, protected serverStore: ServerStore) {
    super(ui);
  }

  activate(model: TModel) {
    this.model = model;

    this.validation = this.validator.on(this);
    //this.validation.onValidate(() => this.isValid = true, () => this.isValid = false);

    this.subd(d => {
      d(this
        .observeEx(x => x.isValid)
        .subscribe(x => {
          this.model.isValid = x;
          if (this.model.id !== "0") {
            if (x == null) { this.model.notificationText = this.model.id; this.model.notificationCls = "orangebg"; }
            else if (x) { this.model.notificationText = "v"; this.model.notificationCls = "greenbg"; }
            else { this.model.notificationText = "!"; this.model.notificationCls = "redbg"; }
          }
        }));
    });

    this.next = uiCommand2("Next", async () => {
      if (! await this.tryValidate()) { return; }
      this.model.next(this.model);
    }, { cls: "default ignore-close" });
  }

  async tryValidate() {
    try {
      const r = await this.validation.validate();
      return true;
    } catch (err) {
      this.toastr.warning("Please correct the inputs", "Invalid input");
      return false;
    }
  }

  switch(tabName: string) { this.model.next(tabName); }

  shown = false;

  attached() {
    setTimeout(() => { this.shown = true; }, 0.4 * 1000); // animation delay. // TODO: have actual animation end trigger..
  }
}


export class MonitorServerState extends VoidCommand {
  constructor(public ct: ICancellationToken) { super(); }
}

@handlerFor(MonitorServerState)
export class MonitorServerStateHandler extends ServerHandler<MonitorServerState, void> {

  async handle(request: MonitorServerState) {
    await this.store.getServers(this.client, this.gcl);
    await this.store.monitor(this.client, this.gcl, request.ct);
  }
}
