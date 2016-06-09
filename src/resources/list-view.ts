import {bindable,inject} from 'aurelia-framework';
export class ListView<T> {
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable ads = [Tools.getRandomIntInclusive(0, 3), Tools.getRandomIntInclusive(4, 7)]
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";
}
