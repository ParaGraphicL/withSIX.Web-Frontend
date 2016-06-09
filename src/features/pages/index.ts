import {FrameworkConfiguration} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {ViewModel} from '../../framework';

export class PagesModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'pages/';
    config.map([
      { route: [`${routeMount}`, `${routeMount}home`], name: 'home', moduleId: `${mount}home`, nav: false, title: 'Home' },
      { route: `${routeMount}client-landing`, name: 'client-landing', moduleId: `${mount}client-landing`, nav: false, title: 'Landing' },
      { route: `${routeMount}legal`, name: 'legal', moduleId: `${mount}legal`, nav: false, title: 'Legal' },
      { route: `${routeMount}get-started`, name: 'get-started', redirect: "http://withsix.readthedocs.org/en/latest/general/get_started", nav: true, title: 'Get Started' },
      { route: `${routeMount}external-link/:url`, name: 'external-link', moduleId: `${mount}external-link`, nav: false, title: 'External Link' },
      { route: `${routeMount}download`, name: 'download', moduleId: `${mount}download`, nav: true, title: 'Download' },
      { route: `${routeMount}download/start`, name: 'download-start', moduleId: `features/pages/angular`, nav: false, title: 'Download Start' },
      //{ route: `${routeMount}blog`,  name: 'blog',      moduleId: `${mount}blog`,      nav: true, title:'Our Blog' },
      { route: `${routeMount}community`, name: 'community', redirect: "https://community.withsix.com", nav: true, title: 'Community' },
      { route: `${routeMount}update`, name: 'update', moduleId: `${mount}update`, nav: false, title: 'Update' }
      //{ route: `${routeMount}go-premium`,         name: 'premium',        moduleId: `${mount}premium`,        nav: true, title:'Go Premium' },
      //{ route: `${routeMount}child-router`,  name: 'child-router', moduleId: `${mount}child-router`, nav: true, title:'Child Router' }
    ]);
  }
}

export interface IMenuItem {
  header: string;
  segment: string;
  target?: string;
  mainSegment?: string;
  fullSegment?: string;
  url?: string;
  cls?: string;
  icon?: string;
  isRight?: boolean;
  isDefault?: boolean;
}

export class MainBase extends ViewModel {
  menuItems: any[];
  constructor(ui, currentItem?) {
    super(ui);
    var items: IMenuItem[] = [
      { header: "Get started", segment: "getting-started", mainSegment: "", target: "_blank" },
      { header: "Download", segment: "download" },
      { header: "Our Blog", segment: "blog" },
      { header: "Community", segment: "community", mainSegment: "" }
    ];

    if (!this.w6.userInfo.isPremium)
      items.push({ header: "Go Premium", segment: "gopremium", isRight: true, icon: "icon withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
    this.menuItems = this.getMenuItems(items, "");
  }

  getMenuItems(items: Array<IMenuItem>, mainSegment: string, parentIsDefault?: boolean): IMenuItem[] {
    var menuItems = [];
    items.forEach(item => {
      var main = item.mainSegment || item.mainSegment == "" ? item.mainSegment : mainSegment;
      var fullSegment = main && main != "" ? main + "." + item.segment : item.segment;
      var segment = item.isDefault ? main : fullSegment; // This will make menu links link to the parent where this page is default
      var menuItem = this.copyObject(item);
      menuItem.segment = segment;
      menuItem.fullSegment = fullSegment;
      menuItem.cls = item.cls;
      menuItem.target = item.target || "_self";
      if (item.isRight) menuItem.cls = item.cls ? item.cls + ' right' : 'right';
      menuItems.push(menuItem);
    });
    return menuItems;
  }

  copyObject<T>(object: T): T {
    var objectCopy = <T>{};

    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        objectCopy[key] = object[key];
      }
    }

    return objectCopy;
  }
}
