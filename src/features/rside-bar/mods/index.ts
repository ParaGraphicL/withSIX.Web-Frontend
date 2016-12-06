import { ITabModel, ServerTab } from "../rside-bar";

interface IModsTabModel extends ITabModel<any> { }
export class Index extends ServerTab<IModsTabModel> {
  get signaturesEnabled() { return this.server.settings.verifySignatures; }
}
