import {ContentHelper, ItemState, IMod, IModInContent} from '../../../framework';

import {Mod} from './mod';

export class ModInContent extends Mod {
  model: IModInContent;
  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.itemState); }
  get itemBusyClass() { return this.basketService.getItemBusyClassInternal(this.itemState) }
  get itemState() { return this.state ? this.calculateState(this.state.state, this.state.version, this.model.constraint) : null; }
  calculateState(state: ItemState, version: string, constraint: string) { return ContentHelper.getContentState(state, version, constraint); }

  async activate(model: IModInContent) {
    await super.activate(model);
    this.type = 'Mod';
  }
}
