import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2 } from "../../../framework";

interface IStatusTab extends ITabModel<any> { }


export class Index extends ServerTab<IStatusTab> {
  start = uiCommand2("Start", async () => { });
  stop = uiCommand2("Stop", async () => { });
  restart = uiCommand2("Restart", async () => { });
  prepare = uiCommand2("Prepare content and configs", async () => { });
  status = "Stopped";
  lock = uiCommand2("Lock", async () => { });
  unlock = uiCommand2("Unlock", async () => { });
  players = [
    { name: "Player X" },
    { name: "Player Y" },
  ]
}