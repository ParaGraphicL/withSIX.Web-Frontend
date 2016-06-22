import {inject} from 'aurelia-framework';
import {ViewModel, Mediator, Query, DbQuery, handlerFor} from '../../framework';

export class Checkout extends ViewModel {
  orderId: string;

  activate(params, routeConfig) {
    this.orderId = params.orderId;
    new CheckoutQuery(this.orderId).handle(this.mediator)
      .then(x => this.navigateInternal(x.redirectTo));
    // todo handle failure
  }
}

interface ICheckoutInfo {
  redirectTo: string;
}

class CheckoutQuery extends Query<ICheckoutInfo> {
  constructor(public orderId: string) { super(); }
}

@handlerFor(CheckoutQuery)
class CheckoutQueryHandler extends DbQuery<CheckoutQuery, ICheckoutInfo> {
  async handle(request: CheckoutQuery) {
    return await this.context.postCustom<ICheckoutInfo>("orders/" + request.orderId + "/checkout")
  }
}
