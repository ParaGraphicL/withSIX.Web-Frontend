import { ITabModel, ServerTab } from "../rside-bar";

interface IModsTabModel extends ITabModel<any> { }
export class Index extends ServerTab<IModsTabModel> {
  mods = [
    { name: "Mod X" },
    { name: "Mod Y" },
  ]
}