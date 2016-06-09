import {ViewModelWithModel, Query, DbClientQuery, handlerFor, IGame, ITab} from '../../../framework';
import {GetGames, IGamesData} from '../../profile/library/games';

export class Play extends ViewModelWithModel<ITab> {
  games: Map<string, IGame>;

  async activate(model) {
    super.activate(model);
  }

  openGames() { this.navigateInternal("/p") }
}
