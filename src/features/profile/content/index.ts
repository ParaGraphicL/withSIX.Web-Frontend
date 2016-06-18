import {UiContext, ViewModel, Mediator, Query, DbQuery, handlerFor} from '../../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';

export class Index extends ViewModel {
  model;
  router: Router;
  menuItems: any[];
  configureRouter(config: RouterConfiguration, router: Router) {
    this.router = router;
    let modulePath = 'features/profile/content/';
    config.map([
      { route: ['', 'collections'], name: 'collection-contents', moduleId: `${modulePath}collections/index`, nav: false, title: 'Collections', auth: true },
      { route: 'mods', name: 'mod-contents', moduleId: `${modulePath}mods/index`, nav: false, title: 'Mods', auth: true },
      { route: 'missions', name: 'mission-contents', moduleId: `${modulePath}missions/index`, nav: false, title: 'Missions', auth: true },
    ])
  }

  async activate() {
    var menuItems = [
      { header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection", isDefault: true },
      { header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" },
      { header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" }
    ];

    this.menuItems = this.getMenuItems(menuItems, "me.content");

    this.model = await new GetContentInfo().handle(this.mediator);
  }
}

class GetContentInfo extends Query<{}> { }

@handlerFor(GetContentInfo)
class GetContentnInfoHandler extends DbQuery<GetContentInfo, {}> {
  handle(request: GetContentInfo) {
    return this.getMeData("content");
  }
  getMeData(resource?) { return this.context.getCustom(this.getMeUrl(resource)); }
  getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }
}
