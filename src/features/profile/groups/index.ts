import {UiContext,ViewModel, Mediator} from '../../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';

//export * from './content/index';
//export * from './library/index';

@inject(UiContext)
export class Index extends ViewModel {
  constructor(ui: UiContext) { 
    super(ui);
    this.features.groups = true;
  }
  router: Router;
  configureRouter(config: RouterConfiguration, router: Router) {
    this.router = router;
    config.map([
      { route: '', name: 'groups', moduleId: 'features/profile/groups/groups', nav: false, title: 'Groups' },
      { route: ':id/:slug', name: 'group', moduleId: 'features/profile/groups/show', nav: false, title: 'Group' }
    ])
  }
}
