import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Textbox extends Field {
    @bindable placeholder: string;
    @bindable multiLine: boolean;
    @bindable disabled: boolean;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) value: string;
    @bindable label: string;
    @bindable useId = Field.generateId('text');
    @bindable cls = "form-control";
}