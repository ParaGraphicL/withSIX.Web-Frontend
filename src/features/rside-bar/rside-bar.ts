import { ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs, Tools, W6, W6Context } from '../../framework';
import { ValidationGroup } from "aurelia-validation";

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
  visible: boolean;

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
    });

    //     this.serverData = await new GetServerData().handle(this.mediator);

  }

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


export class ServerTab<TModel extends ITabModel<any>> extends ViewModel {
  model: TModel;
  validation: ValidationGroup;
  next;
  done;
  get isValid() {
    return (<any>this.validation).result.isValid;
  }
  //isValid: boolean;

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



// class GetServerData { }

// class GetServerDataHandler extends DbQuery<GetServerData, Server> {

// }