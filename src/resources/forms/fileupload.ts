import { bindable, bindingMode } from 'aurelia-framework';
import { Field } from './base';

export class Fileupload extends Field {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: boolean;
    @bindable accept: string;
    @bindable label: string;
    @bindable useId: string;
}