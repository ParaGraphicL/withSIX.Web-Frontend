import { bindable, bindingMode } from 'aurelia-framework';
import { Fileupload } from './fileupload';

export class Imageupload extends Fileupload {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: boolean;
    @bindable accept: string;
    @bindable label: string;
    @bindable useId: string;

}