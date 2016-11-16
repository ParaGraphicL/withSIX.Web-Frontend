import { ITabModel } from "../rside-bar";

interface IPlayersTabModel extends ITabModel<any> { }

export class Index {
  model: IPlayersTabModel;
  activate(model: IPlayersTabModel) {
    this.model = model;
  }
}