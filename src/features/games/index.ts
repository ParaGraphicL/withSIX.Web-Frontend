import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel} from '../../framework';

export class Index extends ViewModel {
  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/';
    let gameRouteMount = ':gameSlug';
    new ServersModule().configureRouter(config, router, mount, gameRouteMount + '/servers');
    config.map([
      { route: `${gameRouteMount}/collections/:id/:slug/content`, name: 'show-collection', moduleId: `${mount}collections/show`, nav: false, title: 'collection' },
      {
        route: [
          `${gameRouteMount}/mods/:id`,
          `${gameRouteMount}/mods/:id/:slug`,
          `${gameRouteMount}/mods/:id/:slug/:something`,
          `${gameRouteMount}/mods/:id/:slug/:something/:somethingelse`,

          `${gameRouteMount}/missions/:id`,
          `${gameRouteMount}/missions/:id/:slug`,
          `${gameRouteMount}/missions/:id/:slug/:something`,
          `${gameRouteMount}/missions/:id/:slug/:something/:somethingelse`,

          `${gameRouteMount}/collections/:id`,
          `${gameRouteMount}/collections/:id/:slug`,
          `${gameRouteMount}/collections/:id/:slug/related`,
          //`${gameRouteMount}/collections/:id/:slug/:something`,
          //`${gameRouteMount}/collections/:id/:slug/:something/:somethingelse`,

          ''
        ], name: 'angular', moduleId: 'features/pages/angular', nav: false
      },
      { route: [gameRouteMount, `${gameRouteMount}/stream`], name: 'stream', moduleId: `${mount}stream`, nav: false, title: 'Stream' },
      { route: `${gameRouteMount}/mods`, name: 'mods', moduleId: `${mount}mods/index`, nav: false, title: 'Mods' },
      { route: `${gameRouteMount}/collections`, name: 'collections', moduleId: `${mount}collections/index`, nav: false, title: 'Collections' },
      { route: `${gameRouteMount}/missions`, name: 'missions', moduleId: `${mount}missions/index`, nav: false, title: 'Missions' }
    ])
  }

  activate() { this.handleAngularHeader(); }
  deactivate() { super.deactivate(); this.reverseAngularHeader(); }
}
