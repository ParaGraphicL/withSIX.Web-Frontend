import { Dialog, SelectTab, uiCommand2 } from "../../../framework";
import { AddServer } from "../../top-bar/servers/servers";

export class AcceptedDialog extends Dialog<{}> {
  cancel = uiCommand2("Try Later", () => this.controller.cancel(), { cls: "cancel" });
  createServer = uiCommand2("Create server", async () => {
    await new AddServer(this.w6.activeGame.id).handle(this.mediator);
    this.eventBus.publish(new SelectTab("setup")); // todo: should rather Be "ServerAdded", and then respond to that..
    this.controller.ok();
  }, { cls: "ok" });
}