import { ViewModel, ILegacyMenuItem } from '../../framework';

export class MainMenu extends ViewModel {
  menuItems: any[];
  constructor(ui, currentItem?) {
    super(ui);
    var items: ILegacyMenuItem[] = [
      { header: "Get started", segment: "getting-started", mainSegment: "", target: "_blank" },
      { header: "Download", segment: "download" },
      { header: "Our Blog", segment: "blog" },
      { header: "Community", segment: "community", mainSegment: "" }
    ];

    if (!this.w6.userInfo.isPremium) {
      items.push({ header: "Go Premium", segment: "gopremium", isRight: true, icon: "icon withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
    }
    items.push({ header: "Server Hosting", segment: "server-hosting", isRight: true, icon: "icon withSIX-icon-Nav-Server", cls: 'server-hosting' });
    this.menuItems = this.getMenuItems(items, "");
  }
}