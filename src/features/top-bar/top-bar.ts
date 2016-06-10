import {Base, ViewModel, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab, ClientMissingHandler, CloseTabs} from '../../framework';
import {SideBar} from '../side-bar/side-bar';
import {Login} from '../../services/auth';
import {inject, bindable} from 'aurelia-framework'
import {Search} from './search/search';

@inject(UiContext, Login, ClientMissingHandler)
export class TopBar extends ViewModel {
  @bindable sideBar: SideBar;
  @bindable showSidebar: boolean;
  @bindable search: Search;
  static root = 'features/top-bar/';

  constructor(uiContext: UiContext, public login: Login, private clientMissingHandler: ClientMissingHandler) { super(uiContext) }

  bind() {
    let notLoggedInObs = this.observeEx(x => x.isLoggedin).select(x => !x);
    if (this.features.groups) {
      let groupTab: ITab = {
        header: "Your groups",
        name: "groups",
        icon: "icon withSIX-icon-Users-Group",
        viewModel: `${TopBar.root}groups/groups`,
        type: 'dropdown',
        location: "middle"
      };
      this.tabs.push(groupTab)
      this.subscriptions.subd(d => {
        d(Base.toProperty(notLoggedInObs, x => x.disabled, groupTab));
      });
    }

    let uploadContent: ITab = {
      header: "Upload content",
      name: "upload",
      icon: "icon withSIX-icon-Hexagon-Add",
      viewModel: `${TopBar.root}upload/upload`,
      type: 'dropdown', instant: true, disabledAction: () => this.disabledAction()
    };
    this.tabs.push(uploadContent);
    this.subscriptions.subd(d => d(Base.toProperty(this.observeEx(x => x.hasActiveGame).select(x => !x)
      // .combineLatest(notLoggedInObs, (x, y) => x || y)
      , x => x.disabled, uploadContent)));

    if (this.features.notifications) {
      let notificationTab: ITab = {
        header: "Notifications",
        icon: "icon withSIX-icon-Notification",
        viewModel: `${TopBar.root}notifications/notifications`,
        notificationCount: 2,
        type: 'dropdown',
        location: "middle"
      };
      this.tabs.push(notificationTab);
      this.subscriptions.subd(d => d(Base.toProperty(notLoggedInObs, x => x.disabled, notificationTab)));
    }

    if (this.features.loggedIn) {
      let userTab: ITab = {
        header: "Settings",
        headerViewModel: `${TopBar.root}user/user-header`,
        viewModel: `${TopBar.root}user/user`,
        type: 'dropdown',
        location: "middle", instant: true
      };
      this.tabs.push(userTab)
    }
  }

  get hasActiveGame() { return this.w6.activeGame.id != null }
  get isLoggedin() { return this.w6.userInfo.id != null }

  disabledAction = () => {
    return this.clientMissingHandler.handleClientOrGameMissing();
    // if (!this.isLoggedIn) {
    //   return this.clientMissingHandler.requireAccount();
    // } else { return this.clientMissingHandler.handleClientOrGameMissing() }
  }

  selectedTab = null;
  tabs: ITab[] = []
}
