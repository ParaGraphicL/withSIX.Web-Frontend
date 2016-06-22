import {inject} from 'aurelia-framework';
import {ViewModel, VoidCommand, DbQuery, handlerFor} from '../../framework';

export class ConfirmPayment extends ViewModel {
  payerId: string
  orderId: string;
  paymentId: string;
  activate(params, routeConfig) {
    this.orderId = params.orderId;
    this.payerId = params.PayerID;
    this.paymentId = params.paymentId;
    new ConfirmPaymentCommand(this.orderId, this.payerId).handle(this.mediator)
      .then(x => this.navigateInternal(`/orders/${this.orderId}/success`));
  }
}

class ConfirmPaymentCommand extends VoidCommand {
  constructor(public orderId: string, public payerId: string) { super(); }
}

@handlerFor(ConfirmPaymentCommand)
class ConfirmPaymentCommandHandler extends DbQuery<ConfirmPaymentCommand, void> {
  async handle(request: ConfirmPaymentCommand) {
    await this.context.postCustom("orders/" + request.orderId + "/confirmpayment?payerId=" + request.payerId);
  }
}
