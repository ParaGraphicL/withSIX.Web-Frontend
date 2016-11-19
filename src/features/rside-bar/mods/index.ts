import { ITabModel } from "../rside-bar";

interface IModsTabModel extends ITabModel<any> { }
export class Index {
  model: IModsTabModel;
  activate(model: IModsTabModel) {
    this.model = model;
  }

  next() { this.model.next(this.model); }
}