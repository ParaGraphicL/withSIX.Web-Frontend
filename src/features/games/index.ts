import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';

export class GamesModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'games/';
    let gameRouteMount = routeMount + ':gameSlug/';
    new ServersModule().configureRouter(config, router, mount, gameRouteMount + 'servers/');
    config.map([
      { route: `${gameRouteMount}collections/:id/:slug?/content/edit`,  name: 'edit-collection',      moduleId: `${mount}collections/edit-content`,      nav: false, title:'Edit collection', auth: true }
    ]);
  }
}
