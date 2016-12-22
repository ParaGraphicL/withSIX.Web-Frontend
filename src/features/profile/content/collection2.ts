import { Collection } from "./collection";


export class Collection2 extends Collection {
  async activate(model) {
    await super.activate(model);
    this.bottomActions.length = 0;
    this.bottomMenuActions.length = 0;
    this.topMenuActions.length = 0;
    this.topActions.removeEl(this.topActions[0]);
  }

  get itemStateClass() { return <any>"none"; }
}
