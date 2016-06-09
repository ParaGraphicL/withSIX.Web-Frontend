import {customAttribute, bindable} from 'aurelia-framework';
import {inject, autoinject} from 'aurelia-framework';
import {UiContext} from '../services/uicontext';

@inject(UiContext)
export class AdLinks {
  @bindable height: string;
  @bindable width: string;
  @bindable slot: string;
  @bindable adsenseId: string;
  @bindable orientation: string;

  constructor(ui: UiContext) {
    this.adsenseId = ui.w6.ads.adsenseId;
    this.orientation = "hz";
  }
}
