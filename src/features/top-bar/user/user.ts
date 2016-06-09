import {ViewModel, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab} from '../../../framework';
import {Login} from '../../../services/auth';
import {inject} from 'aurelia-framework';

@inject(UiContext, Login)
export class User extends ViewModel {
  model: ITab;
  constructor(uiContext: UiContext, public login: Login) { super(uiContext) }

  userMenuItems: IMenuItem[] = [];
  activate(model: ITab) {
    this.model = model;
    this.userMenuItems.push(new MenuItem(this.settings));
    this.userMenuItems.push(new MenuItem(this.friends));
    this.userMenuItems.push(new MenuItem(this.myContent));
    this.userMenuItems.push({ isVisible: true, isSeparator: true })
    if (this.w6.userInfo.isPremium)
      this.userMenuItems.push(new MenuItem(this.premiumSettings));
    else
      this.userMenuItems.push(new MenuItem(this.goPremium));
    this.userMenuItems.push({ isVisible: true, isSeparator: true })
    this.userMenuItems.push(new MenuItem(this.logout));
  }

  settings = uiCommand2("Settings", async () => this.navigateInternal("/me/settings"), { icon: "icon withSIX-icon-Settings" });
  friends = uiCommand2("Friends", async () => this.navigateInternal("/me/friends"), { icon: "icon withSIX-icon-Users-Friends" });
  premiumSettings = uiCommand2("Premium Settings", async () => this.navigateInternal("/me/settings/premium"), { icon: "icon withSIX-icon-Badge-Sponsor" });
  goPremium = uiCommand2("Go Premium", async () => this.navigateInternal("/gopremium"), { cls: "go-premium", icon: "icon withSIX-icon-Badge-Sponsor" });
  myContent = uiCommand2("My Content", async () => this.navigateInternal("/me/content/mods"), { icon: "icon withSIX-icon-Folder" });
  logout = uiCommand2("Logout", async () => this.login.logout(), { icon: "icon withSIX-icon-Arrow-Right-Big" });
}
