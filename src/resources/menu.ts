import {customAttribute, bindable} from 'aurelia-framework';

export class Menu {
  @bindable items: any[];
  @bindable menuCls: string;
}
