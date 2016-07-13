import {Dialog, IUserError, IRecoveryOption, DbClientQuery, VoidCommand, handlerFor, IUserErrorResolved} from '../framework';

export class UserErrorDialog extends Dialog<IUserError> {
  inputView: string;
  activate(model: IUserError) {
    super.activate(model);
    this.subscriptions.subd(d => {
      d(this.clientWrapper.userErrorResolved
        .filter(x => x.id == this.model.id)
        .subscribe(x => this.controller.close(false, null)));
    });

    if (model.type.endsWith("UsernamePasswordUserError")) this.inputView = "./username-password-input.html";
  }
  handle(c: IRecoveryOption) {
    new ResolveUserError(this.model.id, c.commandName, this.model.data).handle(this.mediator);
    this.controller.close(true, c);
  }
}

class ResolveUserError extends VoidCommand {
  constructor(public id: string, public result: string, public data: {}) { super(); }
}

@handlerFor(ResolveUserError)
class ResolveUserErrorHandler extends DbClientQuery<ResolveUserError, void> {
  handle(request: ResolveUserError) {
    return this.client.resolveUserError({ id: request.id, result: request.result, data: request.data });
  }
}
