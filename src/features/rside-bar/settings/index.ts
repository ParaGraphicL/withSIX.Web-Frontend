import { ITabModel, ServerTab } from "../rside-bar";

interface ISettingsTabModel extends ITabModel<any> { }
export class Index extends ServerTab<ISettingsTabModel> {
  activate(model: ISettingsTabModel) {
    super.activate(model);
    this.model.data || (this.model.data = { battlEye: true, verifySignatures: true, vonCodecQuality: 12 })
  }

  get m() { return this.model.data; }
}