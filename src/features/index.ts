import {GamesModule} from './games/index';
import {PagesModule} from './pages/index';
import {OrdersModule} from './orders/index';

import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
}

export class FeaturesModule {
  configureRouter(config, router) {
    let mount = 'features/';
    new PagesModule().configureRouter(config, router, mount, '');
    new OrdersModule().configureRouter(config, router, mount, 'orders/');
    new GamesModule().configureRouter(config, router, mount, 'p/');
    config.map([
      { route: 'me', name: 'profile', moduleId: mount + 'profile/index', nav: false, title: 'Profile' },
      { route: 'login/verify/:activationCode', moduleId: mount + 'login/verify-code', nav: false, title: 'Verify activation code' }
    ]);
  }
}

export * from './profile/lib'
