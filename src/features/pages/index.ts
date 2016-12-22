import { FrameworkConfiguration } from 'aurelia-framework';
import { Router, RouterConfiguration, RouteConfig } from 'aurelia-router';
import { ViewModel, ILegacyMenuItem } from '../../framework';

export class PagesModule extends ViewModel {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'pages/';

    // using 'blank' atm instead of a child-router, because we don't want to capture all the routes that are under '/' ..
    config.map([
      { route: [`${routeMount}`, `${routeMount}home`], name: 'home', moduleId: `${mount}home`, nav: false, title: 'Home' },
      { route: `${routeMount}client-landing`, name: 'client-landing', moduleId: `${mount}client-landing`, nav: false, title: 'Landing' },
      { route: `${routeMount}legal`, name: 'legal', moduleId: `${mount}legal`, nav: false, title: 'Legal' },
      { route: `${routeMount}get-started`, name: 'get-started', redirect: "http://withsix.readthedocs.org/en/latest/general/get_started", nav: true, title: 'Get Started' },
      { route: `${routeMount}external-link/:url`, name: 'external-link', moduleId: `${mount}external-link`, nav: false, title: 'External Link' },
      { route: `${routeMount}download`, name: 'download', moduleId: `${mount}download`, nav: true, title: 'Download' },
      { route: `${routeMount}download/start`, name: 'download-start', moduleId: `${mount}blank`, nav: false, title: 'Download Start' },
      { route: `${routeMount}changelog`, name: 'changelog', moduleId: `${mount}blank`, nav: false, title: 'Changelog' },
      { route: `${routeMount}gopremium`, name: 'gopremium', moduleId: `${mount}blank`, nav: false, title: 'Go Premium' },
      { route: `${routeMount}blog`, name: 'blog', moduleId: `${mount}blank`, nav: true, title: 'Our Blog' },
      { route: `${routeMount}community`, name: 'community', redirect: "https://community.withsix.com", nav: true, title: 'Community' },
      { route: `${routeMount}update`, name: 'update', moduleId: `${mount}update`, nav: false, title: 'Update' },
      { route: `${routeMount}thanks`, name: 'thanks', moduleId: `${mount}thankyou`, nav: false, title: 'Thanks for registering!' },
      { route: 'errors/404', name: '404', moduleId: 'errors/404', title: '404 not found' },
      { route: 'errors/403', name: '403', moduleId: 'errors/403', title: 'Forbidden' },
      { route: 'errors/500', name: '500', moduleId: 'errors/500', title: 'Internal server error' }
      //{ route: `${routeMount}go-premium`,         name: 'premium',        moduleId: `${mount}premium`,        nav: true, title:'Go Premium' },
      //{ route: `${routeMount}child-router`,  name: 'child-router', moduleId: `${mount}child-router`, nav: true, title:'Child Router' }
    ]);

    if (this.features.serverHosting) {
      config.map([
        { route: `${routeMount}server-hosting`, name: 'server-hosting', moduleId: `${mount}server-hosting`, nav: false, title: 'Server Hosting', auth: true },
      ]);
    }
  }
}

export class MainBase extends ViewModel {
  menuItems: any[];
  constructor(ui, currentItem?) {
    super(ui);
    var items: ILegacyMenuItem[] = [
      { header: "Get started", segment: "getting-started", mainSegment: "", target: "_blank" },
      { header: "Download", segment: "download" },
      { header: "Our Blog", segment: "blog" },
      { header: "Community", segment: "community", mainSegment: "" }
    ];

    if (!this.w6.userInfo.isPremium) {
      items.push({ header: "Go Premium", segment: "gopremium", isRight: true, icon: "icon withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
    }
    if (this.features.serverHosting) {
      items.push({ header: "Server Hosting", segment: "server-hosting", isRight: true, icon: "icon withSIX-icon-Nav-Server", cls: 'server-hosting' });
    }
    this.menuItems = this.getMenuItems(items, "");
  }
}
