import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Passwordbox extends Field {
    @bindable placeholder: string;
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: string;
    @bindable label: string;
    @bindable useId = Field.generateId('select');
}