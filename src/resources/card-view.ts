import {bindable, inject} from 'aurelia-framework';
import {ViewModel} from '../services/viewmodel';

export class CardView<T> extends ViewModel {
  @bindable cardContainerCls: string = "col-sm-6 col-md-4 col-xl-3";
  @bindable cardCls: string = "";
  @bindable view: string;
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable isVirtual: boolean;
  @bindable showAds = false;
  @bindable ads = [this.tools.getRandomIntInclusive(0, 3), this.tools.getRandomIntInclusive(4, 7)]
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";

  $parent;

  bind(context) {
    this.$parent = context;
  }

  get itemsMapToArrayWorkaround() { return this.itemsMap == null ? null : Array.from(this.itemsMap, (x, i) => x[1]); }
}
