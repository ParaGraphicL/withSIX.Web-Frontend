import {ViewModelWithModel, Query, DbClientQuery, handlerFor, IGame} from '../../../framework';
import {GetMyCollections} from '../playlist/playlist';
import {IHomeD} from './library';

export class Collections extends ViewModelWithModel<IHomeD> {
  async activate(model) {
    if (this.model === model) return;
    super.activate(model);
    let collections = await this.getMyCollections();
    this.model.collections.length = 0;
    collections.forEach(x => this.model.collections.push(x));
    this.model.collectionsLoaded = true;
  }

  async getMyCollections() {
    let result = await new GetMyCollections(this.w6.activeGame.id).handle(this.mediator);
    result.collections.forEach(x => (<any>x).type = 'collection');
    return result.collections;
  }
}
