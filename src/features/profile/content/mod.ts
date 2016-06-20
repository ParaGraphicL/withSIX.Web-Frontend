import {ContentViewModel} from './base';
import {IMod, uiCommand2, MenuItem} from '../../../framework';

export class Mod extends ContentViewModel<IMod> {
  icon = "withSIX-icon-Nav-Mod";
  changelog() {
    alert("TODO");
  }

  setupMenuItems() {
    super.setupMenuItems();
    this.setupAddToBasket();
  }
}
