import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Radiobox extends Field {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) value: boolean;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) valueB: boolean;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) model;
  @bindable label: string;
  @bindable useId = Field.generateId('radio');
  @bindable name;
  @bindable cls = "form-control";
}
