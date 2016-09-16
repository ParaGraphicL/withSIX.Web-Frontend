import { ReactiveBase } from "../../services/base";
import { bindable } from "aurelia-framework";

export class TableView<T> extends ReactiveBase {
  @bindable view: string;
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable isVirtual: boolean;
  @bindable listCls = "menu main";
  @bindable ads = [this.tools.getRandomIntInclusive(0, 3), this.tools.getRandomIntInclusive(4, 7)];
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";

  get itemsMapToArrayWorkaround() { return this.itemsMap == null ? null : Array.from(this.itemsMap, (x, i) => x[1]); }
}
