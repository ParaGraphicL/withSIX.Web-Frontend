import {ViewModel, Mediator, DbQuery, Query, handlerFor, IMenuItem, IFilter, ISort, SortDirection, ViewType, GameChanged, IBreezeGame} from '../../../framework';
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {GetGames} from './games';

export class Show extends ViewModel {
  model: {
    games: Map<string, any>;
    game: any
  } = { games: null, game: null }
  router: Router;

  constructor(ui) { super(ui); }
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: '', name: 'library_game', moduleId: 'features/profile/library/home/index', nav: true, title: 'Home', settings: { icon: "icon withSIX-icon-Home" } },
      { route: 'collections', name: 'library_game_collections', moduleId: 'features/profile/library/collections/index', nav: true, title: 'Collections', settings: { icon: "icon withSIX-icon-Nav-Collection" } },
      { route: 'collections/:id/:slug', name: 'library_game_collections_show', moduleId: 'features/profile/library/collections/show', nav: false, title: 'Collection', settings: { icon: "icon withSIX-icon-Nav-Collection" } },
      { route: 'mods', name: 'library_game_mods', moduleId: 'features/profile/library/mods/index', nav: true, title: 'Mods', settings: { icon: "icon withSIX-icon-Nav-Mod" } },
      { route: 'missions', name: 'library_game_missions', moduleId: 'features/profile/library/missions/index', nav: true, title: 'Missions', settings: { icon: "icon withSIX-icon-Nav-Mission" } }
    ]);

    this.router = router;
  }

  async activate(params, routeConfig) {
    window.w6Cheat.libraryParent = this;
    let x = await new GetGame(params['gameSlug']).handle(this.mediator)
    this.model.game = x;
    this.eventBus.publish(new GameChanged(x.id, x.slug));
    try {
      let x = await new GetGames().handle(this.mediator);
      this.model.games = x.games;
    } catch (err) {
      Tools.Debug.warn("Error trying to fetch games", err);
      this.model.games = new Map<string, any>();
    }
    // always add the requested game..
    if (!this.model.games.has(this.model.game.id)) this.model.games[this.model.game.id] = this.model.game;
  }

  deactivate() {
    super.deactivate();
    window.w6Cheat.libraryParent = null;
    //this.eventBus.publish(new GameChanged());
  }
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
