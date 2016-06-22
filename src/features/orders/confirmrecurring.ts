import {inject} from 'aurelia-framework';
import {ViewModel, VoidCommand, DbQuery, handlerFor} from '../../framework';

export class ConfirmRecurring extends ViewModel {
  orderId: string;
  payerId: string;
  activate(params, routeConfig) {
    this.orderId = params.orderId;
    this.payerId = params.payerId;
    new ConfirmRecurringCommand(this.orderId, this.payerId).handle(this.mediator)
      .then(x => this.navigateInternal(`/orders/${this.orderId}/success`));
  }
}

class ConfirmRecurringCommand extends VoidCommand {
  constructor(public orderId: string, public payerId: string) { super(); }
}

@handlerFor(ConfirmRecurringCommand)
class ConfirmRecurringCommandHandler extends DbQuery<ConfirmRecurringCommand, void> {
  async handle(request: ConfirmRecurringCommand) {
    await this.context.postCustom("orders/" + request.orderId + "/confirmrecurring?payerId=" + request.payerId);
  }
}
