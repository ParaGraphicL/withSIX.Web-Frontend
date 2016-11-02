import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';
export class Rangebox extends Field {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) value: number;
  @bindable label: string;
  @bindable useId = Field.generateId('range');
  @bindable cls = "form-control";
}