import {UiContext,ViewModel, Mediator} from '../../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {GetGroup, IGroup} from './home/index';

//export * from './content/index';
//export * from './library/index';

@inject(UiContext)
export class Show extends ViewModel {
  group: IGroup;
  groupName: string;
  isAdmin: boolean;
  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    let id = this.tools.fromShortId(params.id);
    this.group = await new GetGroup(id).handle(this.mediator);
    this.groupName = this.group.name;
    this.isAdmin = this.group.ownerId == this.w6.userInfo.id;
  }

  router: Router;
  configureRouter(config: RouterConfiguration, router: Router) {
    this.router = router;
    let canSee = this.w6.userInfo.isAdmin || this.w6.userInfo.isManager;
    let stagingEnv = this.w6.url.environment >= this.tools.Environment.Staging;
    config.map([
      { route: '', name: 'home', moduleId: 'features/profile/groups/home/index', nav: true, title: 'Home' },
      { route: 'join/:token', name: 'join', moduleId: 'features/profile/groups/join', nav: false, title: 'Join' },
      { route: 'members', name: 'members', moduleId: 'features/profile/groups/members/index', nav: true, title: 'Members' },
      { route: 'collections', name: 'collections', moduleId: 'features/profile/groups/collections/index', nav: true, title: 'Collections' },
      { route: 'mods', name: 'mods', moduleId: 'features/profile/groups/mods/index', nav: true, title: 'Mods' },
      { route: 'servers', name: 'servers', moduleId: 'features/profile/groups/servers/index', nav: canSee && stagingEnv, title: 'Servers' }
    ])
  }
}
