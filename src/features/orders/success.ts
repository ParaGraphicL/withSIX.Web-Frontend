import {inject} from 'aurelia-framework';
import {W6} from '../../framework';

@inject(W6)
export class Success {
  orderId: string;
  constructor(public w6: W6) { }
  activate(params, routeConfig) {
    this.orderId = params.orderId;
  }
}
