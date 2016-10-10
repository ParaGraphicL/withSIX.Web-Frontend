import { ContentViewModel } from './base';
import { IMod, uiCommand2, MenuItem } from '../../../framework';

export class Mod extends ContentViewModel<IMod> {
  icon = "withSIX-icon-Nav-Mod";
  changelog() {
    alert("TODO");
  }

  setupMenuItems() {
    super.setupMenuItems();
    this.setupAddToBasket();
    if (this.features.serverBrowser) this.topMenuActions.push(new MenuItem(this.findServers));
  }

  findServers = uiCommand2("Find servers with this",
    async () => this.w6.navigate(`/p/${this.w6.activeGame.slug}/servers2/?modId=${this.model.id}`),
    {icon: "withSIX-icon-Nav-Server"})
}
