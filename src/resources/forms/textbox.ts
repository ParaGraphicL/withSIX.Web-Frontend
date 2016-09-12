import { bindable, bindingMode } from 'aurelia-framework';

export class Textbox {
    @bindable label: string;
    @bindable name: string;
    @bindable placeholder: string;
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: string;
    @bindable multiLine: boolean;
}