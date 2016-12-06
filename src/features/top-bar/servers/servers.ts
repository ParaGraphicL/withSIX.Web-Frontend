import { ViewModel, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab } from '../../../framework';
import { inject } from 'aurelia-framework';

export class Servers {
  model: ITab;
  activate(model: ITab) {
    this.model = model;
  }
}