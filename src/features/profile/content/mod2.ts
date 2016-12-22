import { Mod } from "./mod";

export class Mod2 extends Mod {
  async activate(model) {
    await super.activate(model);
    this.bottomActions.length = 0;
    this.bottomMenuActions.length = 0;
    this.topMenuActions.length = 0;
    this.topActions.removeEl(this.topActions[0]);
  }

  get itemStateClass() { return <any>"none"; }
}