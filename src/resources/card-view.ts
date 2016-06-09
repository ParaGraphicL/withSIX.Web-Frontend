import {bindable,inject} from 'aurelia-framework';
import {ViewModel} from '../services/viewmodel';

export class CardView<T> extends ViewModel {
  @bindable cardContainerCls: string = "col-sm-6 col-md-4 col-xl-3";
  @bindable cardCls: string = "";
  @bindable viewPath: string;
  @bindable itemType: string;
  @bindable items: T[];
  @bindable itemsMap: Map<string, T>;
  @bindable showAds = false;
  @bindable ads = [Tools.getRandomIntInclusive(0, 3), Tools.getRandomIntInclusive(4, 7)]
  @bindable adUnitId1 = "angular-ad1";
  @bindable adUnitId2 = "angular-ad2";

  $parent;

  bind(context){
   this.$parent = context;
  }
}
