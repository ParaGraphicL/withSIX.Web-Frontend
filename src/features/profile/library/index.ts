import {ViewModel} from '../../../framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

export class Index {
		router: Router;
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: '', name: 'library', moduleId: 'features/profile/library/games', nav: false, title: 'Library' },
      { route: ':gameSlug', name: 'library_game', moduleId: 'features/profile/library/show', nav: false, title: 'Library' }
    ]);

    this.router = router;
  }
}

//export * from './base';
