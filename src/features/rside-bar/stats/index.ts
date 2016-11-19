import { ITabModel } from "../rside-bar";

interface IStatsTab extends ITabModel<any> { }
export class Index {
  model: IStatsTab;
  activate(model: IStatsTab) {
    this.model = model;
  }
}