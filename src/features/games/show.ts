import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel, Query, DbClientQuery, handlerFor, IBreezeGame, GameChanged} from '../../framework';

export class Show extends ViewModel {
  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/';
    new ServersModule().configureRouter(config, router, mount, 'servers');
    config.map([
      { route: `collections/:id/:slug/content`, name: 'show-collection', moduleId: `${mount}collections/show`, nav: false, title: 'collection' },
      {
        route: [
          `mods/:id`,
          `mods/:id/:slug`,
          `mods/:id/:slug/:something`,
          `mods/:id/:slug/:something/:somethingelse`,

          `missions/:id`,
          `missions/:id/:slug`,
          `missions/:id/:slug/:something`,
          `missions/:id/:slug/:something/:somethingelse`,

          `collections/:id`,
          `collections/:id/:slug`,
          `collections/:id/:slug/related`,
          //`collections/:id/:slug/:something`,
          //`collections/:id/:slug/:something/:somethingelse`,
        ], name: 'angular', moduleId: 'features/pages/angular', nav: false
      },
      { route: ['', `stream`], name: 'stream', moduleId: `${mount}stream`, nav: false, title: 'Stream' },
      { route: `mods`, name: 'mods', moduleId: `${mount}mods/index`, nav: false, title: 'Mods' },
      { route: `collections`, name: 'collections', moduleId: `${mount}collections/index`, nav: false, title: 'Collections' },
      { route: `missions`, name: 'missions', moduleId: `${mount}missions/index`, nav: false, title: 'Missions' }
    ])
  }

  async activate(params) {
    let game = await new GetGame(params.gameSlug).handle(this.mediator);
    this.eventBus.publish(new GameChanged(game.id, game.slug));
    this.handleAngularHeader()
  }

  deactivate() { this.reverseAngularHeader(); super.deactivate(); }
}

class GetGame extends Query<IBreezeGame> { constructor(public slug: string) { super() } }

@handlerFor(GetGame)
class GetGameHandler extends DbClientQuery<GetGame, IBreezeGame> {
  async handle(request: GetGame) {
    let game = await this.findBySlug("Games", request.slug, "getGame");

    //return { game: game, gameInfo: await this.basketService.getGameInfo(game.id) };
    return game;
  }
}
