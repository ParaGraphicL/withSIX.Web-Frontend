import {UiContext, ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor} from '../../../framework'

export class Join extends ViewModel {
  async activate(params, routeConfig) {
    try {
      await new JoinGroupByToken(this.tools.fromShortId(params.id), params.token).handle(this.mediator);
    } catch (err) {
      this.tools.Debug.warn("Err while processing join token: ", err);
    }
    this.navigateInternal("/me/groups/" + params.id + "/" + params.slug);
  }
}

class JoinGroupByToken extends VoidCommand {
  constructor(public id: string, public token: string) { super() }
}

@handlerFor(JoinGroupByToken)
class JoinGroupByTokenHandler extends DbQuery<VoidCommand, void> {
  async handle(request: JoinGroupByToken) {
    await this.context.postCustom("groups/" + request.id + "/join", { token: request.token });
  }
}
