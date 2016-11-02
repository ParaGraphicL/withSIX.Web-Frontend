import {bindable, inject} from 'aurelia-framework';

export class CardViewItemCustomElement {
    @bindable item;
    @bindable itemType;
    @bindable viewPath;
    @bindable view;
    @bindable cardCls;
    @bindable cardContainerCls;
}