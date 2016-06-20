import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {IRootScope, ITagKey, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, ICreateComment, ICQWM, IModel, DbCommandBase, DbQueryBase, BaseController, BaseQueryController,
  IMenuItem} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';
import {HttpClient} from 'aurelia-fetch-client';

import {CollectionDataService, ModDataService, MissionDataService} from '../services/legacy/data-services';
import {Mediator} from 'aurelia-mediator';
import {Client, PromiseCache} from 'withsix-sync-api';

declare var commangular;

export var skyscraperSlotSizes = [
  [[1280, 400], [[300, 600], [160, 600], [120, 600]]],
  [[1024, 400], [[160, 600], [120, 600]]],
  [[0, 0], [[120, 600]]]
];

export var rectangleSlotSizes = [
  [[1280, 400], [[336, 280], [300, 250], [180, 150], [125, 125]]],
  [[1024, 400], [[300, 250], [180, 150], [125, 125]]],
  [[768, 400], [[180, 150], [125, 125]]],
  [[468, 200], [[336, 280], [300, 250], [180, 150], [125, 125]]],
  [[0, 0], [[300, 250], [180, 150], [125, 125]]]
];

export var leaderboardSlotSizes = [
  [[1024, 400], [[970, 90], [728, 90], [468, 60], [234, 60], [125, 125]]],
  [[800, 400], [[728, 90], [468, 60], [234, 60], [125, 125]]],
  [[0, 0], [[125, 125]]]
];


class AppModule extends Tk.Module {
  static $name = "AppModule";
  static $modules = [
    'constants', 'Components',
    'LocalStorageModule', 'angular-jwt', 'ui.bootstrap',
    'ngCookies', 'ngAnimate', 'ngRoute', 'ngSanitize', 'remoteValidation',
    /* 'breeze.angular',  */
    'angularMoment', 'angularSpinner', 'ngTagsInput', 'infinite-scroll', 'ngMap', 'ngDfp',
    'ui.bootstrap.tpls', 'ui.bootstrap.tabs', 'dialogs.main', 'ui', 'xeditable', 'commangular', //'ngClipboard',
    'ui-rangeSlider', 'ngFileUpload2', 'checklist-model', 'route-segment', 'view-segment', 'mgcrea.ngStrap.datepicker', 'angular-redactor',
    'Components.BytesFilter', 'Components.Debounce', 'Components.Pagedown', 'Components.Fields',
    'Components.ReallyClick', 'Components.BackImg', 'Components.Comments', 'Components.AccountCard', 'nvd3ChartDirectives',
    'Components.Filters', 'Components.Directives', 'mgcrea.ngStrap.typeahead', 'mgcrea.ngStrap.tooltip', 'angularFileUpload', 'mgcrea.ngStrap.dropdown', 'mgcrea.ngStrap.popover', 'ui.bootstrap.collapse', 'mgcrea.ngStrap.affix',
    'ngPasswordStrength', 'mgcrea.ngStrap.helpers.debounce', 'truncate'
  ];

  static getModules() {
    if (Tools.getEnvironment() != Tools.Environment.Production)
      return AppModule.$modules;

    return AppModule.$modules.concat(['angulartics', 'angulartics.google.analytics']);
  }

  constructor() {
    super('app', AppModule.getModules());

    this.app
      .factory('dbContext', () => window.w6Cheat.container.get(W6Context))
      .factory('aur.mediator', () => window.w6Cheat.container.get(Mediator))
      .factory('aur.eventBus', () => window.w6Cheat.container.get(EventAggregator))
      .factory('aur.client', () => window.w6Cheat.container.get(Client))
      .factory('aur.fetchClient', () => window.w6Cheat.container.get(HttpClient))
      .factory('modInfoService', () => window.w6Cheat.container.get(Client))
      .factory('aur.uiContext', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.uiContext))
      .factory('aur.login', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.login))
      .factory('aur.toastr', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.toastr))
      .factory('aur.basketService', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.basketService))
      .config(['redactorOptions', redactorOptions => angular.copy(globalRedactorOptions, redactorOptions)])
      .config([
        '$httpProvider', $httpProvider => {
          $httpProvider.interceptors.push('loadingStatusInterceptor');
          $httpProvider.defaults.headers.patch = {
            'Content-Type': 'application/json;charset=utf-8'
          };
        }
      ])
      .config(['$compileProvider', $compileProvider => { $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|pws):/); }])
      .config([
        'localStorageServiceProvider', localStorageServiceProvider => {
          localStorageServiceProvider
            .setPrefix('withSIX'); // production vs staging etc?
        }
      ])
      .config([
        '$httpProvider', 'jwtInterceptorProvider', ($httpProvider, jwtInterceptorProvider) => {
          var refreshingToken = null;
          var subdomains = ['', 'connect.', 'play.', 'admin.', 'kb.', 'auth.', 'ws1.', 'api.', 'api2.'];
          var theDomain = window.w6Cheat.w6.url.domain;

          var isWhitelisted = (url: string) => {
            return url.includes(theDomain) && !url.includes('/cdn/') && subdomains.some(s => {
              var host = s + theDomain;
              var protLess = '//' + host;
              if (url.startsWith(protLess) && window.location.protocol === 'https:')
                return true;
              if (url.startsWith('https:' + protLess))
                return true;
              return false;
            });
          };
          let refreshToken = async function(config, login) {
            let token = null;
            try {
              let x = await login.handleRefreshToken();
              //if (!x) throw new Error("no valid refresh token");
              // TODO: Inform about lost session?
              if (x)
                token = window.localStorage[window.w6Cheat.containerObjects.login.token];
            } catch (err) {
              err.config = config;
              throw err;
            } finally {
              refreshingToken = null;
            }
            return token;
          }
          jwtInterceptorProvider.tokenGetter = [
            'config', 'localStorageService', 'aur.login',
            async (config, store, login) => {
              if (!isWhitelisted(config.url)) return null;
              let token = window.localStorage[window.w6Cheat.containerObjects.login.token];
              if (!token) return null;
              if (!Tools.isTokenExpired(token)) return token;
              else if (refreshingToken === null) refreshingToken = refreshToken(config, login).catch(x => Tools.Debug.error("catched refresh token error", x));
              return await refreshingToken;
            }];
          $httpProvider.interceptors.push('jwtInterceptor');
        }
      ])
      // .run([
      //   'breeze', breeze => {
      //     breeze.NamingConvention.camelCase.setAsDefault();
      //     /*                        if (userInfo.apiToken) {
      //                                 var ajaxImpl = breeze.config.getAdapterInstance("ajax");
      //                                 ajaxImpl.defaultSettings = {
      //                                     /*
      //                                     headers: {
      //                                         // any CORS or other headers that you want to specify.
      //                                     },
      //                                     #1#
      //
      //                                 };
      //                             }*/
      //   }
      // ])
      .run([
        'editableOptions', editableOptions => {
          editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        }
      ])
      .run([
        'environment', '$rootScope', 'w6', '$timeout', (environment: Tools.Environment, $rootScope: IRootScope, w6: W6, $timeout) => {


          // TODO: No Dom manipulation in controllers..
          $rootScope.handleDownloads = () => {
            if ($rootScope.w6.enableBasket) {
              if (!$rootScope.downloadsHandled) {
                $('a.clientdownload').each((i, el) => {
                  el.setAttribute("href", el.getAttribute("href") + "?basket=1");
                }); // TODO: No Dom manipulation in controllers..
                $rootScope.downloadsHandled = true;
              }
            }
          }
          $rootScope.w6 = w6;

          $rootScope.pageInfo = { title: document.title };
          $rootScope.setPageInfo = pageInfo => {
            $rootScope.pageInfo = pageInfo;
            document.title = pageInfo.title;
          };

          $rootScope.defaultImage = 'https:' + w6.url.getAssetUrl('img/withSIX/footer_icon.jpg');

          $rootScope.setMicrodata = (microdata: IMicrodata) => {
            $rootScope.microdata = microdata;
          };
          $rootScope.Modernizr = Modernizr;
          // todo elsewhere..
          $rootScope.url = w6.url;

          $rootScope.loadingStatus = {
            outstanding: 0,
            increment: () => {
              Tools.Debug.log('increment', $rootScope.loadingStatus.outstanding);
              $rootScope.loadingStatus.outstanding += 1;
              $rootScope.startLoading();
            },
            decrement: () => {
              Tools.Debug.log('decrement', $rootScope.loadingStatus.outstanding);
              $timeout(() => {
                $rootScope.loadingStatus.outstanding -= 1;
                if ($rootScope.loadingStatus.outstanding == 0 && $rootScope.status == 'loading')
                  $rootScope.ready();
              }, 2 * 1000);
            }
          };
          $rootScope.environment = environment;
          $rootScope.toShortId = (id) => Tools.toShortId(id);
          $rootScope.sluggify = (str) => Tools.sluggify(str);
          $rootScope.sluggifyEntityName = (str) => Tools.sluggifyEntityName(str);
          $rootScope.request = (cq, data?) => $rootScope.dispatch(cq.$name, data);
          $rootScope.requestWM = (cq, data?) => $rootScope.dispatch(cq.$name, data);
          $rootScope.isInvalid = (field, ctrl) => {
            if (!field.$invalid) return false;
            if (ctrl.sxValidateOnBlur && field.sxBlurred) return true;
            //if (!ctrl.sxHideIndicator && !field.$pristine) return true;
            return ctrl.sxFormSubmitted;
            //return field.$invalid && ((!ctrl.sxHideIndicator && !field.$pristine) || ctrl.sxFormSubmitted)
          };
          $rootScope.blurred = (fieldName, ctrl) => ctrl[fieldName].sxBlurred = true;

          $rootScope.$on('myNameChanged', (evt, data) => {
            w6.updateUserInfo(<any>{ firstName: data.firstName, lastName: data.lastName }, w6.userInfo)
          });
          $rootScope.$on('myAvatarChanged', (evt, avatarInfo) => {
            w6.updateUserInfo(avatarInfo, w6.userInfo)
          });
        }
      ])
      .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
      .config([
        '$routeProvider', '$locationProvider', '$sceDelegateProvider', '$routeSegmentProvider', 'w6',
        ($routeProvider, $locationProvider: ng.ILocationProvider, $sceDelegateProvider, $routeSegmentProvider, w6: W6) => {
          (<any>$locationProvider).html5Mode({ enabled: true });

          $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'http:' + w6.url.cdn + '/**',
            'https:' + w6.url.cdn + '/**',
            'http:' + w6.url.url + '/**',
            w6.url.urlSsl + '/**',
            //'http:' + w6.url.play + '/**',
            //'https:' + w6.url.play + '/**',
            //w6.url.connectSsl + '/**',
            w6.url.authSsl + '/**',
            //'http:' + w6.url.connect + '/**',
            //'https:' + w6.url.connect + '/**',
            //'http:' + w6.url.main + '/**',
            //'https:' + w6.url.main + '/**',
          ]);
        }
      ]);

    if (Tools.getEnvironment() == Tools.Environment.Production) {
      this.app.config([
        '$analyticsProvider', $analyticsProvider => {
          $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
          //$analyticsProvider.withAutoBase(true);  /* Records full path */
        }
      ]);
    }

    //if (debug) this.app.run(['$route', $route => Tools.Debug.log($route.routes)]);
  }
}


export function getFactory(inject, f) {
  f['$inject'] = inject;
  return f;
}

export function registerService(service) { app.app.service(service.$name, service); }

export function registerController(controller) { app.app.controller(controller.$name, controller); }

export function registerCQ(command) { app.registerCommand(command); }

export function registerCommands(commands, provider) {
  //Debug.log('registerCommands', commands);
  var add = (req) => {
    var reqHandler = req + 'Handler';
    //Debug.log("Registering " + req + ": " + reqHandler);
    provider.mapTo(req).asSequence().add(reqHandler);
  };
  var register = cls => {
    if (cls == null || cls == '')
      throw new Error("cls undefined");
    if (cls.$name == null || cls.$name == '') {
      Tools.Debug.log("cls.$name undefined for", cls);
      throw new Error("cls.$name undefined for" + cls);
    }
    commangular.create(cls.$name + "Handler", cls);
    add(cls.$name);
  };
  commands.forEach(x => register(x));
};

if (Tools.debug) {
  commangular.aspect('@Before(/.*/)', Tk.BeforeInterceptor);
  commangular.aspect('@After(/.*/)', Tk.AfterInterceptor);
  commangular.aspect('@AfterThrowing(/.*/)', Tk.AfterThrowingInterceptor);
}

var app = new AppModule();
