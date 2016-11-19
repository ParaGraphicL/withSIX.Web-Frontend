import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2 } from "../../../framework";

interface IPlayersTabModel extends ITabModel<any> { }

export class Index extends ServerTab<IPlayersTabModel> {
  lock = uiCommand2("Lock", async () => {});
  unlock = uiCommand2("Unlock", async () => {});
  players = [
    {name: "Player X"},
    {name: "Player Y"},
  ]
}