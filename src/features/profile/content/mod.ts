import { ContentViewModel } from './base';
import { IMod, uiCommand2, MenuItem, ModHelper } from '../../../framework';

export class Mod extends ContentViewModel<IMod> {
  icon = "withSIX-icon-Nav-Mod";

  findServers = uiCommand2("Find servers with this",
    async () => this.w6.navigate(`${ModHelper.getSlug(this.model, this.w6.activeGame)}/servers`),
    { icon: "withSIX-icon-Nav-Server" });

  changelog() {
    alert("TODO");
  }

  setupMenuItems() {
    super.setupMenuItems();
    this.setupAddToBasket();
    this.topMenuActions.push(new MenuItem(this.findServers));
  }
}
