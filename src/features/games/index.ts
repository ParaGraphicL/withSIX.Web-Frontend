import {ServersModule} from './servers/index';
import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel} from '../../framework';

export class Index extends ViewModel {
  configureRouter(config: RouterConfiguration, router: Router) {
    var mount = 'features/games/';
    config.map([
      { route: ':gameSlug', name: 'game', moduleId: `${mount}show`, nav: false, title: 'Game' },
      { route: '', name: 'games', moduleId: 'features/games/games', nav: false }
    ])
  }
}
