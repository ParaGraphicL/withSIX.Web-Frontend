import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Textbox extends Field {
    @bindable placeholder: string;
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: string;
    @bindable multiLine: boolean;
}