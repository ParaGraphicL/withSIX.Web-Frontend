import {bindable, inject} from 'aurelia-framework';
import {ReactiveBase} from '../../services/base';
export class ListView<T> extends ReactiveBase {
  @bindable view: string;
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable isVirtual: boolean;
  @bindable listCls = 'menu main';
  @bindable ads = [this.tools.getRandomIntInclusive(0, 3), this.tools.getRandomIntInclusive(4, 7)]
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";
  @bindable replaced = false; // TODO: Drop once we refactor

  get itemsMapToArrayWorkaround() { return this.itemsMap == null ? null : Array.from(this.itemsMap, (x, i) => x[1]); }
}