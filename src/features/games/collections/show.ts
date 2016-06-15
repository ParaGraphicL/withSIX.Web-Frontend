import {Show} from '../../profile/library/collections/show';
import {Router, RouterConfiguration} from 'aurelia-router';

export class Content extends Show {
  async activate(params, routeConfig) {
    await super.activate(params, routeConfig);
  }

  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/collections';
    config.map([
      { route: 'edit', name: 'edit-content', moduleId: `${mount}/edit-content`, nav: false, title: 'Edit content' },
      { route: '', name: 'content', moduleId: `${mount}/content/index`, nav: false, title: 'Content' },
    ]);
  }
}
