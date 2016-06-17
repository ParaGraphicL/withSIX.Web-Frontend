import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel} from '../../framework';

export class Index extends ViewModel {
  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/';
    let gameRouteMount = ':gameSlug';
    config.map([
      { route: `${gameRouteMount}`, name: 'game', moduleId: `${mount}show`, nav: false, title: 'Game' },
      {
        route: [
          ''
        ], name: 'angular', moduleId: 'features/pages/angular', nav: false
      }
    ])
  }

  activate() { this.handleAngularHeader(); }
  deactivate() { super.deactivate(); this.reverseAngularHeader(); }
}
