import { ITabModel, ServerTab } from "../rside-bar";

interface IMissionsTabModel extends ITabModel<any> { }

export class Index extends ServerTab<IMissionsTabModel> {
  get missions() { return this.server.missions; }

  remove(m) { this.missions.delete(m.id); }
}
