import { Dialog, uiCommand2 } from '../../../framework';
export class BetaDialog extends Dialog<{ dontShowAgain?: boolean }> {
  ok = uiCommand2("Let's start", () => this.controller.close(true, this.model.dontShowAgain), { cls: "default" });
}
