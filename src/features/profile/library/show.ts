import {ViewModel, Mediator, DbQuery, Query, handlerFor, IMenuItem, IFilter, ISort, SortDirection, ViewType, GameChanged, IBreezeGame} from '../../../framework';
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {GetGames} from './games';

export class Show extends ViewModel {
  model: {
    games: Map<string, any>;
    game: any
  } = { games: new Map<string, any>(), game: null }
  router: Router;

  constructor(ui) { super(ui); }
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: '', name: 'library_game', moduleId: 'features/profile/library/home/index', nav: true, title: 'Home', settings: { icon: "icon withSIX-icon-Home" } },
      { route: 'collections', name: 'library_game_collections', moduleId: 'features/profile/library/collections/index', nav: true, title: 'Collections', settings: { icon: "icon withSIX-icon-Nav-Collection" } },
      { route: 'mods', name: 'library_game_mods', moduleId: 'features/profile/library/mods/index', nav: true, title: 'Mods', settings: { icon: "icon withSIX-icon-Nav-Mod" } },
      { route: 'missions', name: 'library_game_missions', moduleId: 'features/profile/library/missions/index', nav: true, title: 'Missions', settings: { icon: "icon withSIX-icon-Nav-Mission" } }
    ]);

    this.router = router;
  }

  async activate(params, routeConfig) {
    this.w6.libraryParent = this;
    const gameSlug = params['gameSlug'];
    const game = await new GetGame(gameSlug).handle(this.mediator);
    this.model.game = game;
    this.eventBus.publish(new GameChanged(game.id, game.slug, true));
    try {
      const gInfo = await new GetGames().handle(this.mediator);
      this.model.games = gInfo.games.toMap(x => x.id);
    } catch (err) {
      this.tools.Debug.warn("Error trying to fetch games", err);
      this.model.games = new Map<string, any>();
    }
    // always add the requested game..
    if (!this.model.games.has(this.model.game.id)) {
      this.model.games.set(this.model.game.id, this.model.game);
    }
  }

  deactivate() {
    super.deactivate();
    this.w6.libraryParent = null;
  }
  getGame(gameId: string) { return this.model.games.get(gameId); }
}

export class GetGame extends Query<IBreezeGame> {
  constructor(public gameSlug: string) { super(); }
}

@handlerFor(GetGame)
export class GetGameHandler extends DbQuery<GetGame, IBreezeGame> {
  handle(request: GetGame) {
    return this.findBySlug("Games", request.gameSlug, "getGame");
  }
}
