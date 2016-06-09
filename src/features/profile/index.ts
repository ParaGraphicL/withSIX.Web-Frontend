import {UiContext, ViewModel, Mediator} from '../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';

//export * from './content/index';
//export * from './library/index';

@inject(UiContext)
export class Index extends ViewModel {
  constructor(ui: UiContext) { super(ui); }
  router: Router;
  configureRouter(config: RouterConfiguration, router: Router) {
    let canSee = this.w6.userInfo.isAdmin || this.w6.userInfo.isManager;
    config.map([
      { route: ['', 'home'], name: 'home', moduleId: 'features/profile/home/index', nav: this.w6.enableBasket, title: 'Home' },
      { route: 'library', name: 'library', moduleId: 'features/profile/library/index', nav: this.w6.enableBasket, title: 'Library' },
      { route: 'friends', name: 'friends', moduleId: 'features/pages/angular', nav: this.w6.userInfo.id ? true : false, title: 'Friends', auth: true },
      { route: 'groups', name: 'groups', moduleId: 'features/profile/groups/index', nav: canSee || this.w6.userInfo.isManager, title: 'Groups', auth: true },
      { route: 'messages', name: 'messages', moduleId: 'features/pages/angular', nav: this.w6.userInfo.id ? true : false, title: 'Messages', auth: true },
      { route: 'content', name: 'content', moduleId: 'features/pages/angular', nav: false, title: 'Content', auth: true },
      { route: 'content/mods', name: 'mod-contents', moduleId: 'features/pages/angular', nav: false, title: 'Mods', auth: true },
      { route: 'content/collections', name: 'collection-contents', moduleId: 'features/pages/angular', nav: false, title: 'Collections', auth: true },
      { route: 'content/missions', name: 'mission-contents', moduleId: 'features/pages/angular', nav: false, title: 'Missions', auth: true },
      { route: 'blog', name: 'blog', moduleId: 'features/pages/angular', nav: this.w6.userInfo.id && canSee ? true : false, auth: true, title: 'Blog' },
      { route: 'settings', name: 'settings', moduleId: 'features/pages/angular', nav: this.w6.userInfo.id ? true : false, title: 'Settings', auth: true, settings: { cls: 'pull-right' } }
    ]);

    this.router = router;
  }
  activate() {
    if (!this.w6.enableBasket) this.navigateInternal("/me/settings")
  }
}
