import { ITabModel, ServerTab } from "../rside-bar";

interface IModsTabModel extends ITabModel<any> { }
export class Index extends ServerTab<IModsTabModel> {
  get mods() { return this.server.mods; }

  remove(m) { this.mods.delete(m.id); }
}