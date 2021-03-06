import { ReactiveBase } from "../../services/base";
import { bindable } from "aurelia-framework";

export class ListView<T> extends ReactiveBase {
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable isVirtual: boolean;
  @bindable listCls = "menu main";
  @bindable ads = [this.tools.getRandomIntInclusive(0, 3), this.tools.getRandomIntInclusive(4, 7)];
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";
}
