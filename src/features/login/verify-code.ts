import {UiContext, Mediator, ViewModel, Query, DbQuery, Command, handlerFor} from '../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

@inject(UiContext)
export class VerifyCode extends ViewModel {
  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    if (!(await new VerifyCodeCommand(params.activationCode).handle(this.mediator))) {
      if (await this.toastr.warning("Could not find the verification code. If your account is not yet activated, click here to request a new code", "Verification code not found")) {
        this.navigateInternal("/login/verify");
        return;
      }
    }
    this.navigateInternal("/");
    this.w6.openLoginDialog();
  }
}

class VerifyCodeCommand extends Command<boolean> {
  constructor(public activationCode: string) { super(); }
}

@handlerFor(VerifyCodeCommand)
class VerifyCodeHandler extends DbQuery<VerifyCodeCommand, boolean> {
  public async handle(request: VerifyCodeCommand): Promise<boolean> {
    try {
      await this.context.postCustom("login/verify/" + request.activationCode);
      return true;
    } catch (err) {
      if (err instanceof this.tools.NotFoundException) return false;
      else throw err;
    }
  }
}
