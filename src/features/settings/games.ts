import {Router} from 'aurelia-router';
import {inject} from 'aurelia-framework';
import {ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings} from '../../framework';

export class General extends ViewModel {
  games: IGameSettingsEntry[];

  model;

  async activate(model) {
    this.model = model;
    var r = await new GetGamesSettings().handle(this.mediator);
    this.games = r.games;
    if (!this.model) this.model = {}
    if (!this.model.id && !this.model.slug) this.model.slug = this.w6.activeGame.slug;
    if (this.model.slug)
      this.selectedGame = this.games.find(x => x.slug == this.model.slug);
    else if (this.model.id)
      this.selectedGame = this.games.find(x => x.id == this.model.id);
  }

  get gameViewModel() {
    let slug = this.selectedGame.slug.toLowerCase();
    return slug == 'arma-3' || slug == 'arma-2' ? slug : 'general';
  }

  router: Router;
  selectedGame: IGameSettingsEntry;

  // _selectedGame;
  // get selectedGame() {
  //   return this._selectedGame;
  // }
  // set selectedGame(value) {
  //   this._selectedGame = value;
  //   // TODO: observe instead.
  //   this.navigateInternal("/settings/games" + value ? ("/" + value.slug) : "");
  // }
  // configureRouter(config, router: Router) {
  //   this.router = router;
  //   config.title = 'Games';
  //   config.map([
  //     { route: [''],       name: 'index',       moduleId: 'settings/games/index' },
  //     //{ route: [':gameSlug'],       name: 'game',       moduleId: 'settings/games/game' },
  //     //{ route: ['arma-3'],       name: 'arma-3',       moduleId: 'settings/games/games/arma-3' }
  //   ]);
  // }
}

class GetGamesSettings extends Query<IGamesSettings> { }

@handlerFor(GetGamesSettings)
class GetGamesSettingsHandler extends DbClientQuery<GetGamesSettings, IGamesSettings> {
  handle(request: GetGamesSettings) {
    return this.client.getGamesSettings();
  }
}
