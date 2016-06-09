import {ViewModelOf, Command, DbQuery, handlerFor, uiCommand2} from '../../../../framework'

interface IGame {
  name: string;
  slug: string;
}

export interface ICollection {
  id: string;
  name: string;
  gameId: string;
  game: IGame;
}

export class Collection extends ViewModelOf<ICollection> {
  url: string;
  activate(model: ICollection) {
    super.activate(model);
    this.url = `/p/${model.game.slug}/collections/${model.id.toShortId()}/${model.name.sluggifyEntityName()}`;
  }
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
}
