import { Dialog, uiCommand2 } from '../../../framework';
export class BetaDialog extends Dialog<{ dontShowAgain?: boolean }> {
  model = { dontShowAgain: false };
  ok = uiCommand2("Let's start", () => this.controller.close(this.model.dontShowAgain), { cls: "default" });
}
