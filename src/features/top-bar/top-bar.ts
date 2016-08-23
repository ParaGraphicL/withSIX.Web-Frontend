import {Base, ViewModel, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab, ClientMissingHandler, CloseTabs, Rx} from '../../framework';
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

  setupGroups = () => {
    let groupTab: ITab = {
        header: "Your groups",
        name: "groups",
        icon: "icon withSIX-icon-Users-Group",
        viewModel: `${TopBar.root}groups/groups`,
        type: 'dropdown',
        location: "middle"
      };
      this.tabs.unshift(groupTab);
      this.subscriptions.subd(d => {
        d(TopBar.bindObservableTo(this.notLoggedInObs, groupTab, x => x.disabled));
      });
  }

  notLoggedInObs: Rx.Observable<boolean>;

  bind() {
    this.notLoggedInObs = this.whenAnyValue(x => x.isLoggedin).map(x => !x);
    this.subscriptions.subd(d => d(this.whenAnyValue(x => x.features.groups).filter(x => x).take(1).subscribe(this.setupGroups)));

    let uploadContent: ITab = {
      header: "Upload content",
      name: "upload",
      icon: "icon withSIX-icon-Hexagon-Add",
      viewModel: `${TopBar.root}upload/upload`,
      type: 'dropdown', instant: true, disabledAction: () => this.disabledAction()
    };
    this.tabs.push(uploadContent);
    this.subscriptions.subd(d => d(TopBar.bindObservableTo(this.whenAnyValue(x => x.hasActiveGame).map(x => !x)
      // .combineLatest(notLoggedInObs, (x, y) => x || y)
      , uploadContent, x => x.disabled)));

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
      this.subscriptions.subd(d => d(TopBar.bindObservableTo(this.notLoggedInObs, notificationTab, x => x.disabled)));
    }

    if (this.isLoggedin) {
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
