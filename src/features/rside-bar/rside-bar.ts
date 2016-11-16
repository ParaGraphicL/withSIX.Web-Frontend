import { ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs } from '../../framework';
export class RsideBar extends ViewModel {
  static root = "features/rside-bar/";
  tabs: ITab[] = [
    { header: "Setup", name: "setup", icon: "icon withSIX-icon-System", viewModel: `${RsideBar.root}setup/index` },
    { header: "Settings", name: "settings", icon: "icon withSIX-icon-Settings", viewModel: `${RsideBar.root}settings/index` },
    { header: "Mods", name: "mods", icon: "icon withSIX-icon-Nav-Mod", viewModel: `${RsideBar.root}mods/index` },
    { header: "Missions", name: "missions", icon: "icon withSIX-icon-Nav-Mission", viewModel: `${RsideBar.root}missions/index` },
    { header: "Players", name: "players", location: "end", icon: "icon withSIX-icon-User-Community", viewModel: `${RsideBar.root}players/index` },
    { header: "Stats", name: "stats", location: "end", icon: "icon withSIX-icon-Share-Lines", viewModel: `${RsideBar.root}stats/index` },
    { header: "Status", name: "status", location: "end", icon: "icon withSIX-icon-System-Remote", viewModel: `${RsideBar.root}status/index` },
  ]
  selectedTab: ITab;
}