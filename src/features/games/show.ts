import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel} from '../../framework';

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

  activate() { this.handleAngularHeader(); }
  deactivate() { super.deactivate(); this.reverseAngularHeader(); }
}
