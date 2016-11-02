import { bindable } from 'aurelia-framework';

export class Order {
  @bindable active: boolean;
  @bindable direction: number;
}