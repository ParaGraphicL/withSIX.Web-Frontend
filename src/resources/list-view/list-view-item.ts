import {bindable, inject} from 'aurelia-framework';

export class ListViewItemCustomElement {
    @bindable item;
    @bindable itemType;
    @bindable viewPath;
    @bindable view;
}