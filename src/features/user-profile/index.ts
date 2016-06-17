import {UiContext, ViewModel, Mediator, Query, DbQuery, handlerFor} from '../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';

export class Index extends ViewModel {
  model;
  router: Router;
  menuItems: any[];
  configureRouter(config: RouterConfiguration, router: Router) {
    this.router = router;
    let modulePath = 'features/user-profile/';
    config.map([
      { route: ['', 'content'], name: 'content', moduleId: `${modulePath}content/index`, nav: false, title: 'Content' },
      { route: ['blogposts', 'friends', 'messages'], name: 'angular', moduleId: 'features/pages/angular', nav: false }
    ])
  }

  params;

  async activate(params) {
    this.params = params;

    this.handleAngularHeader();
  }

  deactivate() { super.deactivate(); this.reverseAngularHeader() }
}
