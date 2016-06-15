import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';

export class GamesModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'games/';
    let gameRouteMount = routeMount + ':gameSlug';
    new ServersModule().configureRouter(config, router, mount, gameRouteMount + '/servers');
    config.map([
      { route: `${gameRouteMount}/collections/:id/:slug/content/edit`, name: 'edit-collection', moduleId: `${mount}collections/edit-content`, nav: false, title: 'Edit collection', auth: true },
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
          `${gameRouteMount}/collections/:id/:slug/:something`,
          `${gameRouteMount}/collections/:id/:slug/:something/:somethingelse`,
        ], name: 'angular', moduleId: 'features/pages/angular', nav: false
      },
      { route: [gameRouteMount, `${gameRouteMount}/stream`], name: 'stream', moduleId: `${mount}stream`, nav: false, title: 'Stream' },
      { route: `${gameRouteMount}/mods`, name: 'mods', moduleId: `${mount}mods/index`, nav: false, title: 'Mods' },
      { route: `${gameRouteMount}/collections`, name: 'collections', moduleId: `${mount}collections/index`, nav: false, title: 'Collections' },
      { route: `${gameRouteMount}/missions`, name: 'missions', moduleId: `${mount}missions/index`, nav: false, title: 'Missions' }
    ]);
  }
}
