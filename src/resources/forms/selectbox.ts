import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Selectbox<T> extends Field {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) value: T;
    @bindable options: T[];
    @bindable label: string;
    @bindable useId = Field.generateId('select');
    @bindable cls = "form-control";
    @bindable disabled: boolean;
}
