import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Checkbox extends Field {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) value: boolean;
    @bindable valueB;
    @bindable label: string;
    @bindable model;
    @bindable type = "checkbox";
    @bindable useId = Field.generateId('check');
    @bindable cls = "form-control";
}