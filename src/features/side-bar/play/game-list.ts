import {GetGames, IGamesData} from '../../profile/library/games';
import {ViewModel, IGame} from '../../../framework';

export class GameList extends ViewModel {
  games: Map<string, IGame>;
  async activate() {
    let r = await new GetGames().handle(this.mediator);
    this.games = r.games;
  }
}
