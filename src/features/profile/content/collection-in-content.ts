import {ContentHelper, ItemState, ICollection, ICollectionInContent} from '../../../framework';

import {Collection} from './collection';

export class CollectionInContent extends Collection {
  model: ICollectionInContent;
  get type() { return 'collection' }
  get desiredVersion() { return this.model.constraint || this.model.version }
  get itemState() { return this.state.state ? this.calculateState(this.state.state, this.state.version, this.model.constraint) : this.state.state; }
  calculateState(state: ItemState, version: string, constraint: string) { return ContentHelper.getContentState(state, version, constraint); }
  get hasNewerVersionAvailable() { return this.model.constraint && this.model.constraint != this.state.version; }
}
