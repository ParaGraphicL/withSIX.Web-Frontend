import { ITabModel } from "../rside-bar";

interface ISettingsTabModel extends ITabModel<any> { }
export class Index {
  model: ISettingsTabModel;
  activate(model: ISettingsTabModel) {
    this.model = model;
    this.model.data || (this.model.data = { battlEye: true, verifySignatures: true })
  }

  next() { this.model.next(this.model); }
}