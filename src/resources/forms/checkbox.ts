import { bindable, bindingMode } from 'aurelia-framework';

export class Checkbox {
    @bindable label: string;
    @bindable name: string;
    @bindable({defaultBindingMode: bindingMode.twoWay}) value: boolean;
}