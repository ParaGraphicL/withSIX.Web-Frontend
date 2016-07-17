import breeze from 'breeze-client';

import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult} from '../services/w6context';
import {Tk} from '../services/legacy/tk'

import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';

import {IRootScope, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, DbCommandBase, DbQueryBase, BaseController, BaseQueryController } from './app-base'
import {ITagKey, ICreateComment, ICQWM, IModel, IMenuItem} from '../services/legacy/base'
import {registerCommands, registerCQ, registerController, getFactory} from './app-base';
import {CollectionDataService, ModDataService, MissionDataService} from '../services/legacy/data-services';
import {ToastLogger} from '../services/legacy/logger';

import {Components} from './components';
import {Play} from './play';
import {Main} from './main';
import {Connect} from './connect';
import {Admin} from './admin';
import {Auth} from './auth';
import {Kb} from './kb';

export {Play, Main, Connect, Admin, Auth, Kb}

//require('breeze-client/build/adapters/breeze.bridge.angular');

export module MyApp {
  export var authSet = false;
  var initialCompleted = false;

  var appLoaded = false;
export function isAppLoaded() {
  return appLoaded;
}

export function loadApp(mod) {
  if (appLoaded)
    return;
  appLoaded = true;
  Tools.Debug.log("bootstrapping angular module", mod);
  angular.bootstrap(document, [mod]);
}

export async function bootAngular(w6Urls: W6Urls) {
  await loadScript(w6Urls.getAssetUrl('legacy/app.min.js'));
  await loadAngular("MyApp" || $('html').attr('six-ng-app'));
}

export function loadAngular(moduleName: string) {
  return new Promise((r) => {
    let myApplication = angular.module(moduleName);
    angular.element(document).ready(() => {
      loadApp(moduleName);
      r();
    });
  })
}

export function loadScript(script: string) {
  return new Promise<void>((resolve, reject) => {
    let scriptElement = document.createElement('script');
    scriptElement.src = script;
    scriptElement.onload = () => resolve();
    document.querySelector('body').appendChild(scriptElement);
  });
}

  export function setup(setupInfo) {
    var rootModule = new RootModule(setupInfo);
  }

  export class MyAppModule extends Tk.Module {
    static $name = "AppModule";
    constructor() {
      super('MyApp', ['MyAppMain', 'MyAppConnect', 'MyAppPlay']);
    }
  }

  new MyAppModule();

  /*    export enum Roles {
          Admin,
          Manager,
          User,
          Premium,
          AuthorBeta
      }*/

  class RootModule extends Tk.Module {
    static $name = "RootModule";

    constructor(setupInfo) {
      super('constants', []);
      Tools.Debug.log("setupInfo", setupInfo);
      this.app
        .constant('dfp', setupInfo.dfp)
        .constant('adsense', setupInfo.adsense)
        .constant('angularMomentConfig', {
          preprocess: 'utc', // optional
          //timezone: 'Europe/London' // optional
        })
        .constant('w6', setupInfo.w6)
    }
  }

  export class MainAppController extends BaseController {
    static $name = "MainAppController";
    static $inject = ['$scope', 'usSpinnerService', 'logger', 'w6', '$location', '$q', '$timeout', '$rootScope', '$anchorScroll', 'aur.eventBus', 'DoubleClick'];

    constructor($scope, private $spinner, logger, private w6: W6, private $location: ng.ILocationService, $q: ng.IQService, private $timeout: ng.ITimeoutService, private $rootScope: IRootScope, $anchorScroll, private eventBus: EventAggregator, private dfpForLoading) {
      super($scope, logger, $q);

      $rootScope.logout = () => w6.logout();
      $rootScope.openLoginDialog = (evt?) => w6.openLoginDialog(evt);
      w6.openRegisterDialog = (event?) => this.openRegisterDialog(event);

      $rootScope.ready = () => {
        Tools.Debug.log('ready');
        this.applyIfNeededOnScope(() => {
          if (this.first) {
            if (this.w6.renderAds)
              this.w6.ads.refreshAds();
            $anchorScroll();
          } else {
            this.first = true;
            if (this.w6.renderAds)
              this.w6.ads.check();
          }
          $rootScope.status = 'ready';
        }, $rootScope);
        window.prerenderReady = true;
      };
      $rootScope.startLoading = () => {
        $rootScope.status = 'loading';
        $scope.$evalAsync();
      };

      $rootScope.initialLoad = true;

      // TODO: Somehow fix loading indication of the initial page load...
      var destroyList = [];
      destroyList.push($rootScope.$on('$routeChangeStart', this.routeStart));
      destroyList.push($rootScope.$on('$routeChangeError', this.routeError));
      destroyList.push($rootScope.$on('$routeChangeSuccess', this.routeSuccess));
      destroyList.push($rootScope.$on('$locationChangeSuccess', () => {
        this.setupDefaultTitle();
        $rootScope.setMicrodata(null);
        $rootScope.url.currentPage = $location.absUrl().split('#')[0];
      }));

      destroyList.push($rootScope.$on('$viewContentLoaded', () => {
        Tools.Debug.log('ANGULAR: view content loaded success');
      }));

      $scope.$on('$destroy', () => destroyList.forEach(x => x()));

      this.backwardsCompatibility();
    }
    openRegisterDialog(evt?) {
      if (evt) evt.preventDefault();
      return this.$scope.request(Components.Dialogs.OpenRegisterDialogQuery);
    }

    private routeStart = (scope, next, current) => {
      Tools.Debug.log('ANGULAR: route start');
      if (!next) return;
      var nextRoute = next.$$route;
      if (!nextRoute) return;
      var permission = nextRoute.permission;
      if (permission && !this.$scope.w6.userInfo.hasPermission(permission[0], permission[1]))
        this.$location.url('/errors/403');
      var role = nextRoute.role;
      if (role && !this.$scope.w6.userInfo.isInRoles(role)) {
        this.$scope.openLoginDialog(null);
      }
      this.$rootScope.startLoading();
    }

    private routeSuccess = () => {
      Tools.Debug.log('ANGULAR: route change success');
      if (!initialCompleted) {
        this.$timeout(() => {
          Tools.Debug.log('ANGULAR: initialRouteSuccess');
          initialCompleted = true;
        });
      }
    };
    private routeError = (evt, current, previous, rejection) => {
      Tools.Debug.log("Error loading page", evt, current, previous, rejection);
      if (rejection.message)
        this.logger.error(rejection.message, "Failed loading page");
      else
        this.logger.error(rejection.data.message + "\n(" + rejection.status + ": " + rejection.statusText + ")");

    };
    backwardsCompatibility() {
      jQuery(document).ready(() => {
        this.legacy();
      });
    }

    legacy() {
      var self = this;

      // Toggle UserMenu - TODO Convert to Bootstrap
      $('body').on('click', '#btn-usermenu', function(e) {
        // prevent normal behvavior
        e.preventDefault();
        // usermenu Int
        self.w6.usermenu.init();

        // blur button
        $(this).blur();
      });

      this.$rootScope.handleDownloads();

      var w = $(window);
      var wasWidth = w.width();
      var resizeTO = null;
      w.resize(() => {
        if (resizeTO) clearTimeout(resizeTO);
        resizeTO = setTimeout(() => {
          var width = w.width();
          if (!wasWidth || wasWidth != width) {
            w.trigger('resizeEnd', [wasWidth, width]);
            wasWidth = width;
          }
        }, 500);
      });

      // Init Forms
      self.w6.forms.init();

      $('body').on('click', '.share-bbcode', function(e) {
        // prevent default behavior
        e.preventDefault();
        window.prompt("Copy to clipboard: Ctrl+C, Enter", $(this).attr("data-bbcode"));
      });

      // Scroll to top button
      $('body').on('click', '#btn-scroll-to-top', e => {
        // prevent default behavior
        e.preventDefault();

        // Scroll to top
        self.w6.scrollTo(0, 600);
      });

      // Make fancy scroll Annimation to all Anchor internal links
      $('body').on('click', 'a[href^="#"]', function(e) {
        e.preventDefault();
        // Removeing '#' form href
        var anchorname = $(this).attr('href').substr(1);
        if (anchorname != '')
          self.w6.scrollToAnchor(anchorname);
      });


      // Textarea max length
      if ($('.wmd-input[maxlength]').length > 0) {
        var elements = $('.wmd-input[maxlength]');


        // Key up events
        elements.on('keyup', function(e) {
          var maxChars = parseInt($(this).attr('maxlength'));
          var curChars = $(this).val().length;
          var charsLeft = maxChars - curChars;

          if (charsLeft >= 0) {
            $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());
          } else {
            e.preventDefault();
          }
        });


        // Handleing pahge refresh, reset the textarea to max chars
        elements.each(function(i, element) {
          var maxChars = parseInt($(this).attr('maxlength'));
          var curChars = $(this).val().length;
          var charsLeft = maxChars - curChars;

          $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());

        });

      }

      // Pop Out by colorbox
      //if ($(".popgroup").length > 0) $(".popgroup").colorbox({ rel: 'group2', transition: "fade" });

      $('a[rel=external]').attr('target', '_blank');

      if (self.w6.enableAds)
        w.on('resizeEnd', (e, previous, current) => self.w6.ads.processAdSlots(previous, current));

    }

    private first;
  }

  export class LoadingController extends BaseController {
    static $name = 'LoadingController';
    static $inject = ['$scope', 'logger', '$q', '$timeout', '$rootScope'];

    constructor($scope, logger, $q, $timeout, $rootScope) {
      super($scope, logger, $q);
      $rootScope.loadingStatus.increment();
      $scope.$on('$destroy', () => $timeout(() => $rootScope.loadingStatus.decrement(), 500));
    }
  }

  registerController(LoadingController);

  export class AureliaPageController extends BaseController {
    static $name = 'AureliaPageController';
    static $inject = ['$scope', 'logger', '$q'];

    constructor(public $scope: IBaseScope, public logger, public $q) {
      super($scope, logger, $q);
      Tools.Debug.log('aurelia page controller init', initialCompleted);
    }
  }

  registerController(AureliaPageController);

  export class LoadingFailedController extends Tk.Controller {
    static $name = 'LoadingFailedController';
    static $inject = ['$scope', 'logger', 'ForwardService', 'error'];

    constructor($scope: IBaseScope, logger, private forwardService: Components.ForwardService, error) {
      super($scope);
      var errorMsg = $scope.w6.api.errorMsg(error);

      (<any>$scope).reason = (errorMsg[1] != null ? (errorMsg[1] + ": ") : "") + errorMsg[0];
      $scope.title = errorMsg.length >= 3 ? errorMsg[2] : "Oops! Loading failed :(";

      if (error instanceof Tools.RequireSslException) {
        forwardService.switchToSsl();
      } else if (error instanceof Tools.RequireNonSslException) {
        forwardService.switchToNonSsl();
      }
    }
  }

  registerController(MainAppController);
  registerController(LoadingFailedController);
}
