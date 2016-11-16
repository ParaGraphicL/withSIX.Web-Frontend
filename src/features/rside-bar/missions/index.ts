import { ITabModel } from "../rside-bar";

interface IMissionsTabModel extends ITabModel<any> { }

export class Index {
  model: IMissionsTabModel;
  activate(model: IMissionsTabModel) {
    this.model = model;
  }

  next() { this.model.next(this.model); }
}