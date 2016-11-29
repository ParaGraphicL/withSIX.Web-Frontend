import {
  ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs, Tools, W6, W6Context,
  ModAddedToServer, RemovedModFromServer, ServerStore,
} from '../../framework';
import { ValidationGroup } from "aurelia-validation";
import { inject } from "aurelia-framework";

export class RsideBar extends ViewModel {
  static root = "features/rside-bar/";
  tabs: IAwesomeTab[] = [
    { header: "Setup", name: "setup", icon: "icon withSIX-icon-System", viewModel: `${RsideBar.root}setup/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Settings", name: "settings", icon: "icon withSIX-icon-Settings", viewModel: `${RsideBar.root}settings/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Mods", name: "mods", icon: "icon withSIX-icon-Nav-Mod", viewModel: `${RsideBar.root}mods/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Missions", name: "missions", icon: "icon withSIX-icon-Nav-Mission", viewModel: `${RsideBar.root}missions/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Control", name: "control", location: "end", icon: "icon withSIX-icon-System-Remote", viewModel: `${RsideBar.root}control/index`, next: (tab: IAwesomeTab) => this.next(tab) },
  ];

  get validSetup() { return this.tabs[0].isValid; }
  visible = true;

  bind() {
    const setupTabs = [this.tabs[1], this.tabs[2], this.tabs[3]];
    const controlTabs = [this.tabs[4]];
    this.subd(d => {
      d(this.observeEx(x => x.validSetup)
        .subscribe(x => setupTabs.concat(controlTabs).forEach(t => t.disabled = !x)));
      d(this.observableFromEvent<ToggleServer>(ToggleServer).subscribe(x => {
        const hasTab = x.tab > -1;
        this.visible = hasTab || !this.visible;
        if (this.visible && hasTab) { this.selectedTab = this.tabs[x.tab]; }
      }));
      d(this.observableFromEvent<ModAddedToServer>(ModAddedToServer).subscribe(x => {
        this.notifier.raiseTabNotification("mods", {
          title: 'added to server', text: x.mod.name, icon: 'withSIX-icon-Nav-Mod',
          href: this.getItemHref(x.mod),
          cls: 'end',
          command: uiCommand2("", async () => x.server.toggleMod(x.mod), { tooltip: "Remove from server", icon: 'withSIX-icon-Checkmark' })
        });
      }));
      d(this.observableFromEvent<RemovedModFromServer>(RemovedModFromServer).subscribe(x => {
        this.notifier.raiseTabNotification("mods", {
          title: 'removed from server', text: x.mod.name, icon: 'withSIX-icon-Nav-Mod',
          href: this.getItemHref(x.mod),
          cls: 'start',
          command: uiCommand2("", async () => x.server.toggleMod(x.mod), { tooltip: "Add to server", icon: 'withSIX-icon-Add' })
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
}

export interface ITabModel<T> extends IAwesomeTab {
  data?: T;
}

export class ToggleServer {
  constructor(public tab = -1) { }
}


@inject(UiContext, ServerStore)
export class ServerTab<TModel extends ITabModel<any>> extends ViewModel {
  model: TModel;
  validation: ValidationGroup;
  next;
  done;
  get isValid() {
    return (<any>this.validation).result.isValid;
  }
  //isValid: boolean;

  constructor(ui, private serverStore: ServerStore) {
    super(ui);
  }

  get server() { return this.serverStore.activeGame.activeServer; }

  activate(model: TModel) {
    this.model = model;

    this.validation = this.validator.on(this);
    //this.validation.onValidate(() => this.isValid = true, () => this.isValid = false);

    this.subd(d => {
      d(this.observeEx(x => x.isValid).subscribe(x => this.model.isValid = x));
    });

    this.next = uiCommand2("Next", async () => {
      if (! await this.tryValidate()) { return; }
      this.model.next(this.model);
    }, { canExecuteObservable: this.observeEx(x => x.isValid) });

    this.done = uiCommand2("Done", async () => {
      if (! await this.tryValidate()) { return; }
      this.model.next();
    }, { canExecuteObservable: this.observeEx(x => x.isValid) });
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
}



@inject(W6Context)
export class ServerFileUploader {
  constructor(private context: W6Context) { }
  uploadFile(directory: string, fileName: string, fileContent: string) {
    return this.context.postCustom<void>(`/server-manager/files/${directory}/${fileName}`, { fileContent });
  }
  deleteFile(directory: string, fileName: string) {
    return this.context.deleteCustom<void>(`/server-manager/files/${directory}/${fileName}`);
  }
  getFiles(directory: string, fileType: string) {
    return this.context.getCustom<string[]>(`/server-manager/files/${directory}/${fileType}`);
  }
}


// class GetServerData { }

// class GetServerDataHandler extends DbQuery<GetServerData, Server> {

// }