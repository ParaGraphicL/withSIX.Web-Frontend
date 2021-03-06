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
    let modulePath = 'features/profile/';
    let groupsSettings = { hidden: !this.features.groups};
    this.subscriptions.subd(d => d(this.whenAnyValue(x => x.features.groups).filter(x => x).take(1).subscribe(x => groupsSettings.hidden = false)));

    config.map([
      { route: ['', 'home'], name: 'home', moduleId: 'features/profile/home/index', nav: this.w6.enableBasket, title: 'Home', auth: !this.w6.enableBasket },
      { route: 'library', name: 'library', moduleId: 'features/profile/library/index', nav: this.w6.enableBasket, title: 'Library', auth: !this.w6.enableBasket },
      { route: 'content', name: 'content', moduleId: `${modulePath}content/index`, nav: this.isLoggedIn, title: 'Content', auth: true },
      { route: 'friends', name: 'friends', moduleId: 'features/pages/angular', nav: this.isLoggedIn, title: 'Friends', auth: true },
      { route: 'groups', name: 'groups', moduleId: 'features/profile/groups/index', nav: this.isLoggedIn, title: 'Groups', auth: true, settings: groupsSettings },
      { route: 'messages', name: 'messages', moduleId: 'features/pages/angular', nav: this.isLoggedIn, title: 'Messages', auth: true },
      { route: 'blog', name: 'blog', moduleId: 'features/pages/angular', nav: this.features.managerFeatures ? true : false, auth: true, title: 'Blog' },
      { route: 'settings', name: 'settings', moduleId: 'features/pages/angular', nav: this.isLoggedIn, title: 'Settings', auth: true, settings: { cls: 'pull-right' } }
    ]);

    this.router = router;
  }
  activate() {
    this.reverseAngularHeader(); // workaround for games/show.ts deactivate not getting called?!
    if (!this.w6.enableBasket) this.navigateInternal("/me/settings")
    this.handleFooterIf(false);
  }
  deactivate() {
    super.deactivate();
    this.handleFooterIf(true);
  }
}
