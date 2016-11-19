import { ITabModel } from "../rside-bar";

interface IStatusTab extends ITabModel<any> { }

export class Index {
  model: IStatusTab;
  activate(model: IStatusTab) {
    this.model = model;
  }
}