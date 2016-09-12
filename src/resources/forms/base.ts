import { bindable, bindingMode } from 'aurelia-framework';

export abstract class Field {
    @bindable label: string;
    @bindable name: string;
}