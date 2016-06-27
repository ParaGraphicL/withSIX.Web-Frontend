import {ContentHelper, ItemState, IMod, IInContent} from '../../../framework';

import {Mod} from './mod';

interface IModInContent extends IMod, IInContent { }

export class ModInContent extends Mod {
  model: IModInContent;
  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.itemState); }
  get itemBusyClass() { return this.basketService.getItemBusyClassInternal(this.itemState) }
  get itemState() { return this.state ? this.calculateState(this.state.state, this.state.version, this.model.constraint) : null; }
  calculateState(state: ItemState, version: string, constraint: string) { return ContentHelper.getContentState(state, version, constraint); }
}
