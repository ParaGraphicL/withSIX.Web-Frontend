import { ITab } from "../../../framework";
export class Index {
  model: ITab;
  activate(model: ITab) {
    this.model = model;
  }
}