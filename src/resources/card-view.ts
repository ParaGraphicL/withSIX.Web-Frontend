import {bindable, inject} from 'aurelia-framework';
import {ViewModel} from '../services/viewmodel';

export class CardView<T> extends ViewModel {
  @bindable cardColumns = [2, 3, 3, 4]   // sm, md, lg, xl
  cardContainerCls = "";
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

  handleClearFix: boolean;

  $parent;

  bind(context) {
    this.$parent = context;
    this.cardContainerCls = `col-sm-${12 / this.cardColumns[0]} col-md-${12 / this.cardColumns[1]} col-lg-${12 / this.cardColumns[2]} col-xl-${12 / this.cardColumns[3]}`;
    this.handleClearFix = this.cardColumns.filter(x => x > 1).length != this.cardColumns.length;
  }

  calculateIndex(i: number) {
    let originalIndex = i;
    i++;
    if (!this.ads || this.ads.length == 0) return i;
    this.ads.forEach(x => {
      if (originalIndex > x) i++;
    });
    return i;
  }

  get itemsMapToArrayWorkaround() { return this.itemsMap == null ? null : Array.from(this.itemsMap, (x, i) => x[1]); }
}
