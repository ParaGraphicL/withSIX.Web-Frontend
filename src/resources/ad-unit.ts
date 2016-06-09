import {bindable} from 'aurelia-framework';
import {ViewModel} from '../services/viewmodel';

export class AdUnit extends ViewModel {
  @bindable unitId: string;
  @bindable unitClass: string;
  attached() {
    let googletag = (<any>window).googletag;
    if (googletag && googletag.display) googletag.display(this.unitId);
  }
}
