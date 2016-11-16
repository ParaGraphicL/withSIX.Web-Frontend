import { ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs } from '../../framework';
export class RsideBar extends ViewModel {
  static root = "features/rside-bar/";
  tabs: IAwesomeTab[] = [
    { header: "Setup", name: "setup", icon: "icon withSIX-icon-System", viewModel: `${RsideBar.root}setup/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Settings", name: "settings", icon: "icon withSIX-icon-Settings", viewModel: `${RsideBar.root}settings/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Mods", name: "mods", icon: "icon withSIX-icon-Nav-Mod", viewModel: `${RsideBar.root}mods/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Missions", name: "missions", icon: "icon withSIX-icon-Nav-Mission", viewModel: `${RsideBar.root}missions/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Players", name: "players", location: "end", icon: "icon withSIX-icon-User-Community", viewModel: `${RsideBar.root}players/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Stats", name: "stats", location: "end", icon: "icon withSIX-icon-Share-Lines", viewModel: `${RsideBar.root}stats/index`, next: (tab: IAwesomeTab) => this.next(tab) },
    { header: "Status", name: "status", location: "end", icon: "icon withSIX-icon-System-Remote", viewModel: `${RsideBar.root}status/index`, next: (tab: IAwesomeTab) => this.next(tab) },
  ];

  next(tab: IAwesomeTab) {
    const idx = this.tabs.indexOf(tab);
    this.selectedTab = this.tabs[idx + 1];
  }
  selectedTab: ITab;
}

interface IAwesomeTab extends ITab {
  next(tab: IAwesomeTab): void;
}

export interface ITabModel<T> extends IAwesomeTab {
  data?: T;
}

export class ToggleServer { }