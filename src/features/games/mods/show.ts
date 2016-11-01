import { Router, RouterConfiguration } from 'aurelia-router';

export class Show {
  configureRouter(config: RouterConfiguration, router: Router) {
    const mount = 'features/games/mods';
    config.map([
      //{ route: 'servers', name: 'servers', moduleId: `${mount}/servers`, nav: false, title: 'Servers' },
      { route: '', name: 'servers', moduleId: `${mount}/servers`, nav: false, title: 'Servers' },
    ]);
  }
}