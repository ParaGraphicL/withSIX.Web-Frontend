import {ViewModel, Base, uiCommand2, ITab, UiContext, ClientMissingHandler, SwitchSideBarTab, CloseTabs} from '../../framework';
import {inject} from 'aurelia-framework';
import {Index as SettingsIndex} from '../settings/index';

@inject(UiContext, ClientMissingHandler)
export class SideBar extends ViewModel {
  static root = 'features/side-bar/';
  tabs: ITab[] = [
    { header: "Switch game", name: "play", icon: "icon withSIX-icon-Joystick", viewModel: `${SideBar.root}play/play`, type: 'dropdown', location: 'custom' }, /* , headerViewModel: PlayHeader */
    { header: "Library", name: "library", icon: "icon withSIX-icon-System", viewModel: `${SideBar.root}library/library`, disabledAction: () => this.disabledAction() },
    { header: "Playlist", icon: "icon withSIX-icon-Content-Play-Media", viewModel: `${SideBar.root}playlist/playlist`, disabledAction: () => this.disabledAction() },
    { header: "Activity", name: "downloads", icon: "icon withSIX-icon-Download", disabled: true, viewModel: `${SideBar.root}downloads/downloads`, headerViewModel: `${SideBar.root}downloads/download-header`, location: 'end' },
  ]
  selectedTab = null;
  get isPlayActive() { return this.selectedTab == this.tabs[0] };
  get hasActiveGame() { return this.w6.activeGame.id != null };
  get isClientConnected() { return this.w6.miniClient.isConnected; }
  get quickActionsEnabled() { return this.isLoggedIn && this.features.quickActions; }

  constructor(ui, private clientMissingHandler: ClientMissingHandler) {
    super(ui);
  }

  bind() {
    this.subscriptions.subd(d => {
      d(Base.toProperty(this.observeEx(x => x.hasActiveGame)
        //.combineLatest(this.observeEx(x => x.isClientConnected), (x, y) => x && y)
        .map(x => !x), x => x.disabled, this.tabs[1], this.tabs[2]));
      d(this.eventBus.subscribe(SwitchSideBarTab, this.switchTab))
    });
  }

  switchTab = (evt: SwitchSideBarTab) => this.selectedTab = evt.name == null ? null : this.tabs.asEnumerable().firstOrDefault(x => (x.name || x.header).toLowerCase() == evt.name.toLowerCase());
  disabledAction = () => this.clientMissingHandler.handleClientOrGameMissing();

  togglePlay() {
    let play = this.tabs[0];
    this.selectedTab = this.selectedTab == play ? null : play;
  }

  openClientSettings = uiCommand2("Open client settings", async () => {
    if (this.isClientConnected) {
      let model = { module: "games", games: { id: this.w6.activeGame.id } };
      this.dialog.open({ viewModel: SettingsIndex, model: model })
    } else {
      this.navigateInternal("/download");
    }
  });

  refreshPlaylist() {
    let playList = this.tabs[2];
    if (this.selectedTab == playList) {
      this.selectedTab = null;
      setTimeout(() => this.selectedTab = playList, 10);
    }
  }
}
