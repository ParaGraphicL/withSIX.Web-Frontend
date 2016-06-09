//import {customAttribute, bindable} from 'aurelia-framework';
import {inject, autoinject} from 'aurelia-framework';
import {UiContext} from '../services/uicontext';

@inject(UiContext)
export class UsertitleValueConverter {
  constructor(private ui: UiContext) {
  }

  toView(title: string) {
    return title ? `${this.ui.w6.userTitling()} ${title}` : this.ui.w6.userTitling();
  }
}
