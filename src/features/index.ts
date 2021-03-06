import { PagesModule } from './pages/index';
import { OrdersModule } from './orders/index';

import { FrameworkConfiguration, inject } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
}

@inject(PagesModule)
export class FeaturesModule {
  constructor(private pagesModule: PagesModule) { }
  configureRouter(config, router) {
    let mount = 'features/';
    this.pagesModule.configureRouter(config, router, mount, '');
    new OrdersModule().configureRouter(config, router, mount, 'orders/');
    config.map([
      { route: 'plugin', name: 'plugin', moduleId: mount + 'plugin/index', nav: false, title: 'Plugin' },
      { route: 'me', name: 'profile', moduleId: mount + 'profile/index', nav: false, title: 'Me' },
      { route: 'u/:slug', name: 'user', moduleId: mount + 'user-profile/index', nav: false, title: 'Profile' },
      { route: 'login/verify/:activationCode', moduleId: mount + 'login/verify-code', nav: false, title: 'Verify activation code' },
      { route: 'p', name: 'play', moduleId: mount + 'games/index', nav: false, title: 'Play' }
    ]);
  }
}

export * from './profile/lib'
