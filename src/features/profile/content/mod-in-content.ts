import {ContentHelper, ItemState, IMod, IModInContent} from '../../../framework';

import {Mod} from './mod';

export class ModInContent extends Mod {
  model: IModInContent;
  get desiredVersion() { return this.model.constraint || this.model.version }
  get itemState() { return super.itemState ? this.calculateState(super.itemState, this.state.version, this.model.constraint) : this.itemState; }
  calculateState(state: ItemState, version: string, constraint: string) { return ContentHelper.getContentState(state, version, constraint); }

  async activate(model: IModInContent) {
    await super.activate(model);
  }
  get type() { return 'mod' }
}
