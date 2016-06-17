import breeze from 'breeze-client';

//require('breeze-client/build/adapters/breeze.bridge.angular');

import {IBreezeMod, IBreezeUser, IBreezeCollection, IBreezeMission, IBreezeCollectionVersionDependency, IBreezePost, IBreezeModUpdate, IBreezeCollectionVersion, IBreezeGame, IBreezeAWSUploadPolicy,
  IBreezeMissionComment, IBreezeMissionVersion, IBreezeCollectionImageFileTransferPolicy, IBreezeModInfo,
  IBreezeCollectionComment, IBreezePostComment, AbstractDefs, BreezeInitialzation, IBreezeModUserGroup, IBreezeModComment, IBreezeModImageFileTransferPolicy,
  IBreezeModMediaItem, IUserInfo, Resource, Permission, Role,
  EntityExtends, BreezeEntityGraph, _IntDefs} from './services/dtos';
import {W6, W6Urls, globalRedactorOptions} from './services/withSIX';
import {Tools} from './services/tools';
import {W6Context, W6ContextWrapper, IQueryResult} from './services/w6context';
import {Tk} from './services/legacy/tk'
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';


// This file is only intended to setup the environment and root Application configuration
// Add Directives / Filters / Controllers / etc elsewhere

declare var commangular;
declare var accounting;
declare var Modernizr: ModernizrStatic;
declare var Fingerprint;

export module MyApp {
  export var debug = Tools.debug;
  export var Debug = Tools.Debug;
  export var initialCompleted = false;
  export var Environment = Tools.Environment;

  export interface Toastr {
    info: IDisplayMethod;
    warning: IDisplayMethod;
    error: IDisplayMethod;
    success: IDisplayMethod;
  }

  interface ToastOpts {
    timeOut?: number;
  }

  interface IDisplayMethod {
    (message: string, title?: string, opts?: ToastOpts): Promise<boolean>
  }

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
  export interface _Indexer<TModel> {
    [name: string]: TModel;
  }

  export class MyAppModule extends Tk.Module {
    static $name = "AppModule";
    constructor() {
      super('MyApp', ['MyAppMain', 'MyAppConnect', 'MyAppPlay']);
    }
  }

  new MyAppModule();

  export class ContentDownloads {
    public static downloadInclClientCheck(url: string, forwardService, localStorageService, w6) {
      if (w6.client && w6.client.clientFound) {
        w6.client.openPwsUri(url);
        return;
      }

      // On purpose using ok to get the software, and cancel to get the actual download, so the user thinks what he does :)
      if (localStorageService.get('clientInstalled') == null
        && confirm("Before downloading this content, make sure you have \"Play\" our withSIX client installed. To download the client software now, click ok. To proceed with the download, click cancel.")) {
        forwardService.forward(w6.url.main + "/download");
        //localStorageService.set('clientInstalled', true);
      } else {
        localStorageService.set('clientInstalled', true);
        this.startDownload(url);
      }
    }

    static startDownload(url: string) {
      if (window.six_client == null || window.six_client.open_pws_uri == null) {
        window.location.href = url;
      } else {
        window.six_client.open_pws_uri(url);
      }
    }
  }



  /*    export enum Roles {
          Admin,
          Manager,
          User,
          Premium,
          AuthorBeta
      }*/

  export interface IRootScope extends ng.IRootScopeService {
    vm;
    canceler: ng.IDeferred<{}>;
    dispatch(evt: string, pars?: Object);
    request(evt, pars?: Object);
    request<T>(evt, pars?: IModel<T>);
    environment; //: Tools.Environment;
    loading: boolean;
    w6: W6;
    url: W6Urls;
    toShortId: (id) => string;
    sluggify: (str) => string;
    Modernizr;
    requestWM<T>(evt: ICQWM<T>, pars?: IModel<T>);
    cancelOutstandingRequests: () => void;
    sluggifyEntityName: (str) => string;
    isInvalid: (field, ctrl) => any;
    blurred: (fieldName, ctrl) => boolean;
    ready: () => void;
    startLoading: () => void;
    status: string;
    loadingStatus: {
      outstanding: number;
      increment(): void;
      decrement(): void;
    };
    microdata: Components.IMicrodata;
    setMicrodata: (microdata: Components.IMicrodata) => void;
    setPageInfo: (pageInfo: Components.IPageInfo) => void;
    defaultImage: string;
    breadcrumbs: Object[];
    pageInfo: { title: string };
    openLoginDialog: (evt?: any) => void;
    logout: () => any;
    downloadsHandled: boolean;
    handleDownloads: () => any;
    initialLoad: boolean;
  }

  export function getFactory(inject, f) {
    f['$inject'] = inject;
    return f;
  }

  interface Moment {
    subtract(amount: number, type: string);
  }

  export interface Result<T> {
    result: T;
  }

  export var ngToken = null;

  export interface BooleanResult extends Result<boolean> {
  }

  class RootModule extends Tk.Module {
    static $name = "RootModule";

    constructor(setupInfo) {
      super('constants', []);
      Debug.log("setupInfo", setupInfo);
      this.app
        .constant("userInfo", setupInfo.w6.userInfo)
        .constant('environment', setupInfo.environment)
        .constant('dfp', setupInfo.dfp)
        .constant('adsense', setupInfo.adsense)
        .constant('angularMomentConfig', {
          preprocess: 'utc', // optional
          //timezone: 'Europe/London' // optional
        })
        .constant('options', { serviceName: setupInfo.w6.url.api + "/breeze/withsix" })
        .constant('w6', setupInfo.w6);
    }
  }

  class AppModule extends Tk.Module {
    static $name = "AppModule";
    static $modules = [
      'constants', 'Components',
      'LocalStorageModule', 'angular-jwt', 'ui.bootstrap',
      'ngCookies', 'ngAnimate', 'ngRoute', 'ngSanitize', 'remoteValidation',
      /* 'breeze.angular',  */
      'angularMoment', 'angularSpinner', 'ngTagsInput', 'infinite-scroll', 'ngMap', 'ngDfp',
      'ui.bootstrap.tpls', 'ui.bootstrap.tabs', 'dialogs.main', 'ui', 'angular-promise-cache', 'xeditable', 'commangular', //'ngClipboard',
      'ui-rangeSlider', 'ngFileUpload2', 'checklist-model', 'AngularProgress', 'angular-loading-bar',
      'route-segment', 'view-segment', 'mgcrea.ngStrap.datepicker', 'angular-redactor',
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
        .factory('aur.mediator', () => window.w6Cheat.container.get(Mediator))
        .factory('aur.eventBus', () => window.w6Cheat.container.get(EventAggregator))
        .factory('aur.client', () => window.w6Cheat.container.get(Client))
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
              (config, store, login) => {
                if (!isWhitelisted(config.url)) return null;
                let token = window.localStorage[window.w6Cheat.containerObjects.login.token];
                if (!token) return null;
                if (!Tools.isTokenExpired(token))
                  return token;
                else {
                  if (refreshingToken === null) {
                    refreshingToken = refreshToken(config, login).catch(x => Tools.Debug.error("catched refresh token error", x));
                    return refreshingToken;
                  }
                }
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

            $rootScope.setMicrodata = (microdata: Components.IMicrodata) => {
              $rootScope.microdata = microdata;
            };
            $rootScope.Modernizr = Modernizr;
            // todo elsewhere..
            $rootScope.url = w6.url;

            $rootScope.loadingStatus = {
              outstanding: 0,
              increment: () => {
                Debug.log('increment', $rootScope.loadingStatus.outstanding);
                $rootScope.loadingStatus.outstanding += 1;
                $rootScope.startLoading();
              },
              decrement: () => {
                Debug.log('decrement', $rootScope.loadingStatus.outstanding);
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
            $rootScope.cancelOutstandingRequests = () => {
              var canceler = $rootScope.canceler;
              if (canceler != null) {
                Debug.log("cancelling outstanding request");
                canceler.resolve();
              }
            };
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

            // TODO: Does not do anything??
            /*$rootScope.$on('$routeChangeStart', (evt, data) => $rootScope.cancelOutstandingRequests());*/
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

      //if (debug) this.app.run(['$route', $route => Debug.log($route.routes)]);
    }
  }

  export function setup(setupInfo) {
    var rootModule = new RootModule(setupInfo);
  }

  var appLoaded = false;
  export function isAppLoaded() {
    return appLoaded;
  }

  export function loadApp(mod) {
    if (appLoaded)
      return;
    appLoaded = true;
    Debug.log("bootstrapping angular module", mod);
    angular.bootstrap(document, [mod]);
  }

  export function bootAngular() {
    var promise = new Promise<void>((resolve, reject) => {
      let scriptElement = document.createElement('script');
      scriptElement.src = window.w6Cheat.w6.url.getAssetUrl('dist_legacy/app.min.js');
      scriptElement.onload = () => {
        let moduleName = "MyApp" || $('html').attr('six-ng-app');
        let myApplication = angular.module(moduleName);
        angular.element(document).ready(() => {
          loadApp(moduleName);
          resolve();
        });
      };
      document.querySelector('head').appendChild(scriptElement);
    });
    return promise;
  }

  export var authSet = false;

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
        Debug.log("cls.$name undefined for", cls);
        throw new Error("cls.$name undefined for" + cls);
      }
      commangular.create(cls.$name + "Handler", cls);
      add(cls.$name);
    };
    commands.forEach(x => register(x));
  };

  if (debug) {
    commangular.aspect('@Before(/.*/)', Tk.BeforeInterceptor);
    commangular.aspect('@After(/.*/)', Tk.AfterInterceptor);
    commangular.aspect('@AfterThrowing(/.*/)', Tk.AfterThrowingInterceptor);
  }

  var app = new AppModule();

  registerService(W6Context);



  export interface ICQWM<T> {
    //execute: any;
    $ModelType: T;
  }

  export interface IModel<TModel> {
    model: TModel;
  }

  export interface ICreateComment<TComment> {
    contentId: string;
    message: string;
    replyTo?: TComment;
    replyToId?: number;
  }

  export class DbQueryBase extends Tk.QueryBase {
    static $inject = ['dbContext'];

    constructor(public context: W6Context) {
      super();
    }

    public findBySlug(type: string, slug: string, requestName: string) {
      return this.processSingleResult(this.context.executeQuery(breeze.EntityQuery.from(type)
        .where("slug", breeze.FilterQueryOp.Equals, slug)
        .top(1), requestName));
    }

    public executeKeyQuery<T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> {
      return this.processSingleResult(this.context.executeKeyQuery(query));
    }

    processSingleResult = promise => promise.
      then(result => {
        if (result.results.length == 0) {
          var d = this.context.$q.defer();
          d.reject(new Tools.NotFoundException("There were no results returned from the server"));
          return d.promise;
        }
        return result.results[0];
      }).catch(failure => {
        var d = this.context.$q.defer();
        if (failure.status == 404) {
          d.reject(new Tools.NotFoundException("The server responded with 404"));
        } else {
          d.reject(failure);
        }
        return d.promise;
      });

    public getEntityQueryFromShortId(type: string, id: string): breeze.EntityQuery {
      Debug.log("getting " + type + " by shortId: " + id);
      return breeze.EntityQuery
        .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
    }

    public getEntityQuery(type: string, id: string): breeze.EntityQuery {
      Debug.log("getting " + type + " by id: " + id);
      return breeze.EntityQuery
        .fromEntityKey(this.context.getEntityKey(type, id));
    }
  }

  export class DbCommandBase extends Tk.CommandBase {
    static $inject = ['dbContext'];

    constructor(public context: W6Context) {
      super();
    }

    public buildErrorResponse = reason => {
      if (!reason || !reason.data) {
        return {
          message: "Unknown error",
          errors: {},
          httpFailed: window.w6Cheat.api.errorMsg(reason)
        };
      }
      return {
        message: !reason.data ? "Unknown error" : reason.data.message,
        errors: reason.data.modelState,
        httpFailed: window.w6Cheat.api.errorMsg(reason)
      };
    };
    public respondSuccess = message => {
      return { success: true, message: message };
    };
    public respondError = reason => {
      var response = this.buildErrorResponse(reason);
      /*
      if (reason.data && reason.data.modelState) {
          if (reason.data.modelState["activation"]) {
              response.notActivated = true;
          }
      }
      */
      return this.context.$q.reject(response);
    };
  }

  // dialogs actually wraps $modal but adds some cool features on top like built-in error, warning, confirmation, wait etc dialogs
  export class DialogQueryBase extends DbQueryBase {
    static $inject = ['$modal', 'dialogs', 'dbContext'];

    constructor(private $modal, public dialogs, context: W6Context) { super(context); }

    // Use to have full control over the ui.bootstrap dialog implementation - has resolve support for one or multiple promises
    public openDialog(controller, config?) { return DialogQueryBase.openDialog(this.$modal, controller, config); }

    // Use to build on dialog-service built-in functionality
    // - lacks resolve support so requires manual labour if you want to use 1 or multiple ($q.all) promises before initiating the controller..in that case better use openDialog
    public createDialog(controller, data?, overrideOpts?) { return DialogQueryBase.createDialog(this.dialogs, controller, controller.$view, data, overrideOpts); }

    static createDialog(dialogs, controller, template?, data?, overrideOpts?) {
      var opts = Object.assign({ windowClass: 'dialogs-withSix', copy: false }, overrideOpts);

      Debug.log('createDialog', { controller: controller, template: template, data: data }, opts);

      var dialog = dialogs.create(template || controller.$view, controller, data, opts);

      Debug.log(dialog);

      return dialog;
    }

    static openDialog($modal, controller, config?) {
      var cfg = Object.assign(this.getConfig(controller), config);
      Debug.log('openDialog', cfg);

      return $modal.open(cfg);
    }

    static getConfig(controller) {
      return {
        templateUrl: controller.$view,
        controller: controller,
        windowClass: 'dialogs-withSix'
      };
    }
  }

  export interface ITagKey {
    text: string;
    key: string;
  }

  export interface IViewScope {
    totalPages: number;
    infiniteScroll: boolean;
    items: breeze.Entity[];
    filterTextPlaceholder: string;
    sort: { name: string; field: string }[];
    customSort: string;
    paging: { hasNext: boolean; hasPrevious: boolean; pages: number[]; startItem: number; endItem: number; totalServerItems: number };
    filterPrefixes: string[];
    filterFocused: boolean;
    tags: ITagKey[];
    grid: {
      overlays: Boolean[];
      itemTemplate: string;
      curPage: number;
    };
    list: {};
    otherOptions: { view: string };
    filterOptions: { text: string; size; timespan: number; useExternalFilter: boolean };
    pagingOptions: { pageSizes: number[]; pageSize: number; currentPage: number };
    sortOptions: { fields: string[]; directions: string[] };
    filter: { sizes: { name: string; eq: string; amount: number }[]; timespans: { name: string; hours: number }[]; subscriptions: { name: string; amount: number }[] };
    gridOptions: {};
    reverseSort: () => void;
    getPrefixes: (query) => any;
    toIsoDate: (date) => string;
    getImage: (img) => string;
    clearFilters: () => void;
    refreshImmediately: () => void;
    init: () => void;
  }

  export interface IBaseScope extends IRootScope {
    title: string;
    subtitle: string;
    first: boolean;
    destroyed: boolean;
    menuItems: IMenuItem[];
    response;
  }

  export interface IBaseGameScope extends IBaseScope {
    gameUrl: string;
    game: IBreezeGame;
    followedMods: {};
    followedMissions: {};
    subscribedCollections: {};
    openAddModDialog: (info?: { type?: string, folder?: string }) => void;
    clientInfo: Components.ModInfo.IClientInfo;
    directDownload: (item: { id: string; }) => Promise<void>;
    directDownloadCollection: (item: IBreezeCollection) => Promise<void>; // { id: string; }
    getItemClass: (item: MyApp.Components.Basket.IBasketItem) => string;
    canAddToBasket: () => boolean;
    showBusyState: () => boolean;
    openAddCollectionDialog: () => any;
    addToCollections: (mod: IBreezeMod) => void;
    isActive: (mod: IBreezeMod) => boolean;
    abort: (mod: IBreezeMod) => void;
  }

  export interface IHandleCommentsScope<TCommentType> {
    comments: TCommentType[];
    addComment: (newComment) => void;
    deleteComment: (comment) => void;
    saveComment: (comment) => void;
    reportComment: (comment) => void;
    commentLikeStates: {};
    likeComment: (comment) => void;
    unlikeComment: (comment) => void;
  }

  export interface IMenuItem {
    header: string;
    segment: string;
    mainSegment?: string;
    cls?: string;
    icon?: string;
    isRight?: boolean;
    isDefault?: boolean;
    url?: string;
  }

  export interface IContentModel<TContent> {
    header: IContentHeader;
    content: TContent;
  }

  export interface IContentHeader {
    title: string;
    avatar: string;
    getAvatar: (width, height) => string;
    contentType: string;
    contentUrl: string;
    contentPath: string;
    shortContentUrl: string;
    tags: Array<string>;
    menuItems: Array<IMenuItem>;
  }

  export interface IEditConfigurationExtends<TContent> {
    isEditing?: boolean;
    isManaging?: boolean;
    editMode?: boolean;
    canEdit: () => boolean;
    canManage?: () => boolean;
    enableEditing?: () => boolean;
    closeEditing?: () => boolean;
    saveChanges?: (entity?: breeze.Entity, ...entities: breeze.Entity[]) => Promise<breeze.SaveResult>;
    discardChanges: () => void;
    isEdited?: (key: string, model: TContent) => boolean;
    hasChanges?: () => boolean;
  }

  export interface IEditConfiguration<TContent> {
    isEditing: boolean;
    isManaging: boolean;
    editMode: boolean;
    canEdit: () => boolean;
    canManage: () => boolean;
    enableEditing: () => boolean;
    closeEditing: () => boolean;
    saveChanges: (entity?: breeze.Entity, ...entities: breeze.Entity[]) => Promise<breeze.SaveResult>;
    discardChanges: () => void;
    isEdited: (key: string, model: TContent) => boolean;
    hasChanges: () => boolean;
    hasChangesProperty: boolean; // Better to watch this from view instead of redo the function all the time over and over
  }

  export interface ICommentsScope<TComment> {
    comments: Array<TComment>;
    newComment: INewComment<TComment>;
    addComment: (newComment: INewComment<TComment>) => void;
    deleteComment: (comment: TComment) => any;
    saveComment: (comment: TComment) => void;
    reportComment: (comment: TComment) => void;
  }

  export interface INewComment<TComment> {
    message: string;
    replyTo: TComment;
  }

  export class BaseController extends Tk.Controller {
    static $inject = ['$scope', 'logger', '$q'];

    constructor(public $scope: IBaseScope, public logger: Components.Logger.ToastLogger, public $q: ng.IQService) {
      super($scope);
      $scope.$on('$destroy', () => $scope.destroyed = true);
    }

    applyIfNeeded(func?) { return this.applyIfNeededOnScope(func, this.$scope); }

    applyIfNeededOnScope(func, scope) {
      if (!scope.$$phase) {
        scope.$apply(() => func ? func() : null);
      } else if (func) {
        func();
      }
    }

    public setupDefaultTitle() {
      var titleParts = [];
      var first = false;
      window.location.pathname.trim().split('/').reverse().forEach(x => {
        x = x.replace(/-/g, ' ').trim();
        if (!x) return;

        if (!first) {
          x = x.toUpperCaseFirst();
          first = true;
        }

        titleParts.push(x);
      });
      titleParts.push(this.$scope.url.siteTitle);
      this.$scope.setPageInfo({ title: titleParts.join(" - ") });
    }

    public setupTitle = (scopeWatch: string, template?: string) => {
      if (!template) template = "{0}";

      var siteSuffix = this.$scope.url.siteTitle;
      this.$scope.$watch(scopeWatch, (newValue: string, oldValue: string, scope) => {
        this.$scope.setPageInfo({ title: template.replace("{0}", newValue) + " - " + siteSuffix });
      });
    };
    public getImage = (img: string, updatedAt: Date): string => {
      if (!img || img == "")
        return this.$scope.url.cdn + "/img/noimage.png";
      return Tools.uriHasProtocol(img) ? img : this.$scope.url.getUsercontentUrl(img, updatedAt);
    };
    subscriptionQuerySucceeded = (result, d) => {
      for (var v in result.data)
        d[result.data[v]] = true;
    };
    public requestAndProcessResponse = (command, data?) => {
      this.$scope.response = undefined;
      return this.$scope.request(command, data)
        .then(this.successResponse)
        .catch(this.errorResponse);
    };
    public successResponse = (commandResult) => {
      Debug.log("success response");
      var result = commandResult.lastResult;
      this.$scope.response = result;
      this.logger.success(result.message, "Action completed");

      return result;
    };
    public errorResponse = (result) => {
      this.$scope.response = result;
      var httpFailed = result.httpFailed;
      this.logger.error(httpFailed[1], httpFailed[0]);

      return this.$q.reject(result);
    }; // TODO: Make this available on the root $scope ??
    public requestAndProcessCommand = (command, pars?, message?) => {
      return this.processCommand(this.$scope.request(command, pars), message);
    };
    public processCommand = <TType>(q: TType, message?): TType => {
      return (<any>q).then((result) => {
        this.logger.success(message || "Saved", "Action completed");
        return result;
      }).catch(reason => {
        this.httpFailed(reason);
        return Promise.reject(reason);
      });
    };
    public breezeQueryFailed2 = (reason) => {
      this.logger.error(reason.message, "Query failed");
      this.$scope.first = true;
    };
    public breezeQueryFailed = (reason) => {
      this.breezeQueryFailed2(reason);
      return <any>null;
    }
    public httpFailed = (reason) => {
      this.$scope.first = true;
      Debug.log("Reason:", reason);
      var msg = window.w6Cheat.api.errorMsg(reason);
      this.logger.error(msg[0], msg[1]);
    };

    public forward(url, $window: ng.IWindowService, $location: ng.ILocationService) {
      this.forwardFull($location.protocol() + ":" + url, $window, $location);
    }

    public forwardFull(fullUrl, $window: ng.IWindowService, $location: ng.ILocationService) {
      Debug.log("changing URL: " + fullUrl);
      $window.location.href = fullUrl;
    }

    public processNames(results) {
      var obj = [];
      angular.forEach(results, item => obj.push({ text: item.name, key: item.name }));
      return obj;
    }

    public processNamesWithPrefix(results, prefix) {
      var obj = [];
      angular.forEach(results, item => obj.push({ text: prefix + item.name, key: prefix + item.name }));
      return obj;
    }

    public getMenuItems(items: Array<IMenuItem>, mainSegment: string, parentIsDefault?: boolean): IMenuItem[] {
      var menuItems = [];
      angular.forEach(items, item => {
        var main = item.mainSegment || item.mainSegment == "" ? item.mainSegment : mainSegment;
        var fullSegment = main && main != "" ? main + "." + item.segment : item.segment;
        var segment = item.isDefault ? main : fullSegment; // This will make menu links link to the parent where this page is default
        var menuItem = Object.assign({}, item);
        menuItem.segment = segment;
        menuItem.fullSegment = fullSegment;
        menuItem.cls = item.cls;
        if (item.isRight) menuItem.cls = item.cls ? item.cls + ' right' : 'right';
        menuItems.push(menuItem);
      });
      return menuItems;
    }
  }

  export interface IBaseScopeT<TModel> extends IBaseScope, IHaveModel<TModel> {
  }

  export class BaseQueryController<TModel> extends BaseController {
    static $inject = ['$scope', 'logger', '$q', 'model'];

    constructor(public $scope: IBaseScopeT<TModel>, public logger, $q, model: TModel) {
      super($scope, logger, $q);

      $scope.model = model;
    }
  }

  export interface IContentScope extends IBaseGameScope {
  }

  export interface IHaveModel<TModel> {
    model: TModel;
  }

  export interface IContentScopeT<TModel> extends IContentScope {
    model: TModel;
    header: IContentHeader;
    reportContent: () => void;
    editConfig?: IEditConfiguration<TModel>;
    trustedDescriptionFullHtml: string;
    callToAction: () => void;
  }


  export interface IContentIndexScope extends IBaseGameScope {
    views;
    getItemUrl: (item) => string;
    getDescription: (item) => string;
    getTagLink: (item, tag) => string;
    ads: number[];
    getImage: (img: string, updatedAt?: Date) => string;
    shareUrl: string;
  }

  export class ContentController extends BaseController {
    static $inject = ['$scope', 'logger', '$routeParams', '$q'];

    constructor(public $scope: IContentScope, public logger, public $routeParams, $q) {
      super($scope, logger, $q);
    }

    public getBaseUrl(type) { return "/" + this.$routeParams.gameSlug + "/" + type + "s/" + this.$routeParams[type + "Id"] + "/" + this.$routeParams[type + "Slug"]; }
  }

  export class ContentModelController<TModel extends breeze.Entity> extends ContentController {
    static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'model'];

    constructor(public $scope: IContentScopeT<TModel>, public logger, public $routeParams, $q: ng.IQService, $sce: ng.ISCEService, model: TModel) {
      super($scope, logger, $routeParams, $q);
      Debug.r.staging(() => {
        $(window).data("scope", this.$scope);
      });

      $scope.model = model;
      $scope.header = this.setupContentHeader(model);
      var anyModel = (<any>model);
      var keyWords = (anyModel.game ? anyModel.game.name + ", " : null)
        + $scope.header.contentType + ", " + $scope.header.title + ", "
        + (anyModel.tags ? anyModel.tags.join(', ') : null);

      $scope.setMicrodata({
        title: $scope.header.title,
        description: (<any>model).description || 'No description yet',
        image: 'https:' + $scope.header.getAvatar($scope.w6.imageSizes.bigRectangle.w, $scope.w6.imageSizes.bigRectangle.h),
        keywords: keyWords,
        currentPage: $scope.header.contentUrl
      });

      $scope.reportContent = () => {
        // TODO: Tell to login if not logged in...
        if (this.$scope.w6.userInfo.id) {
          this.$scope.request(Components.Dialogs.OpenReportDialogQuery);
        };
      };

      this.entityManager = model.entityAspect.entityManager;

      this.editConfigDefaults = this._setupEditConfig(<any>{
        canEdit: () => {
          throw new Error("Must Implement IEditConfigurationExtends.canEdit");
        },
        discardChanges: () => {
          throw new Error("Must Implement IEditConfigurationExtends.discardChanges");
        }
      }, null, null);

      // TODO: Move to Directive..
      $scope.$on('$destroy', () => $('body').removeClass('game-profile'));
      $('body').removeClass('game-profile');
      $('body').addClass('game-profile');
    }

    public getContentAvatarUrl(avatar: string, updatedAt?: Date): string {
      if (!avatar || avatar == "")
        return null;
      return Tools.uriHasProtocol(avatar) ? avatar : this.$scope.url.getUsercontentUrl(avatar, updatedAt);
    }

    public getImageOrPlaceholder(image: string, width: number, height: number): string {
      return image == null ? this.$scope.url.getAssetUrl('img/play.withSIX/placeholders/' + width + 'x' + height + '.gif') : image;
    }

    public setupEditConfig = (editConfig: IEditConfigurationExtends<TModel>, watchForChanges: string[], changeGraph: string[]) => {
      this.$scope.editConfig = this._setupEditConfig(editConfig, watchForChanges, changeGraph);
    }; // TODO: This smells a lot like class material..
    // Either through a base controller class, or a separate class into which a controller and / or scope is passed into
    _setupEditConfig = (editConfig: IEditConfigurationExtends<TModel>, watchForChanges: string[], changeGraph: string[]): IEditConfiguration<TModel> => {
      var isEdited = (key, model) => {
        var entity = this.$scope.model;
        if (!(this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
          return false;
        if (model != null) {
          return false;
        }

        return entity.entityAspect.originalValues.hasOwnProperty(key);
      };

      // TODO: These should be properties; generally this data does not change throughout a session
      // and if it does, it can be handled through events (scope.$broadcast, $emit, $on.  Or $watch etc).
      // See http://thenittygritty.co/angularjs-pitfalls-using-scopes on some reasons why functions should not be used, and properties/fields are preferred
      var canEdit = (() => {
        throw new Error("Must Implement IEditConfigurationExtends.canEdit");
      });
      var canManage = () => this.$scope.w6.userInfo.isAdmin || this.$scope.w6.userInfo.isManager;

      var closeEditing = () => {
        this.$scope.editConfig.editMode = false;
        this.$scope.editConfig.isManaging = false;
        return true;
      };
      var enableEditing = () => {
        if (!(this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage())) {
          return false;
        }
        this.$scope.editConfig.editMode = true;
        this.$scope.editConfig.isManaging = this.$scope.editConfig.canManage();
        return true;
      };

      var discardChanges = (() => {
        throw new Error("Must Implement IEditConfigurationExtends.discardChanges");
      });

      var graphExpands = "";
      if (changeGraph) {
        graphExpands = changeGraph.join(",");
      }

      var saveChanges = (entity?: breeze.Entity, ...entities: breeze.Entity[]): Promise<breeze.SaveResult> => {
        var promise: Promise<breeze.SaveResult> = null;
        if (entity != null) {
          var changedEntites: breeze.Entity[] = [];

          entities.push(entity);

          entities.forEach((v, i, arr) => {
            if (!v.entityAspect.entityState.isUnchanged())
              changedEntites.push(v);
          });

          promise = <any>this.entityManager.saveChanges(changedEntites);
          promise.catch(reason => {
            var reasons = (<string>(<any>breeze).saveErrorMessageService.getErrorMessage(reason)).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "").replace(/[ ]\(\)[ ][-][ ]/g, ": ");

            this.breezeQueryFailed({ message: 'Save failed, See Validation Errors Below:<br/><br/>' + reasons });
            return (<breeze.SaveResult>{});
          });
        } else {

          var changedEntites: breeze.Entity[] = [];
          var entities: breeze.Entity[] = (<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);

          entities.forEach((v, i, arr) => {
            if (!v.entityAspect.entityState.isUnchanged())
              changedEntites.push(v);
          });

          promise = <any>this.entityManager.saveChanges(changedEntites);
          promise.catch(reason => {
            var reasons = (<string>(<any>breeze).saveErrorMessageService.getErrorMessage(reason)).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "").replace(/[ ]\(\)[ ][-][ ]/g, ": ");

            this.breezeQueryFailed({ message: 'Save failed, See Validation Errors Below:<br/><br/>' + reasons });
            return (<breeze.SaveResult>{});
          });
        }
        return promise;
      };

      var hasChanges = () => {
        var graph = <breeze.Entity[]>(<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);

        var changed = false;
        graph.forEach((v, i, arr) => {
          changed = changed ? true : v.entityAspect.entityState.isAddedModifiedOrDeleted();
        });

        return changed;
      };

      var _editConfig = <IEditConfiguration<TModel>>{
        isEditing: editConfig.isEditing != null ? editConfig.isEditing : false,
        isManaging: editConfig.isManaging != null ? editConfig.isManaging : false,
        editMode: editConfig.editMode != null ? editConfig.editMode : false,
        canEdit: editConfig.canEdit != null ? editConfig.canEdit : canEdit(),
        canManage: editConfig.canManage != null ? editConfig.canManage : canManage,
        closeEditing: editConfig.closeEditing != null ? editConfig.closeEditing : closeEditing,
        enableEditing: editConfig.enableEditing != null ? editConfig.enableEditing : enableEditing,
        discardChanges: editConfig.discardChanges != null ? editConfig.discardChanges : discardChanges(),
        isEdited: editConfig.isEdited != null ? editConfig.isEdited : isEdited,
        saveChanges: editConfig.saveChanges != null ? editConfig.saveChanges : saveChanges,
        hasChanges: editConfig.hasChanges != null ? editConfig.hasChanges : hasChanges
      };

      var normalChangeWatch = ["model.author", "userInfo.id", "editConfig.isManaging", "editConfig.editMode"];

      if (watchForChanges != null)
        watchForChanges.forEach((value, index, array) => {
          normalChangeWatch.push(value);
        });


      this.$scope.$watchGroup(normalChangeWatch, (newValue, oldValue, scope) => {
        this.$scope.editConfig.isEditing = ((this.$scope.editConfig.isManaging || this.$scope.editConfig.hasChanges()) && this.$scope.editConfig.canManage()) || (this.$scope.editConfig.canEdit() && this.$scope.editConfig.editMode);
      });

      this.$scope.$watch("editConfig.hasChanges()", (newValue: boolean, oldValue, scope) => {
        if (newValue == oldValue) return;

        this.$scope.editConfig.hasChangesProperty = newValue;

        if (newValue && !(this.$scope.editConfig.isEditing || this.$scope.editConfig.isManaging)) {
          this.$scope.editConfig.enableEditing();
        }
      });

      return _editConfig;
    };
    public editConfigDefaults: IEditConfiguration<TModel> = null;

    public setupContentHeader(model: TModel): IContentHeader { throw new Error("setupContentHeader not implemented!"); }

    entityManager: breeze.EntityManager;
  }

  export class HelpItem<TScope> {
    constructor(public element: string, public data: IBsPopoverData, public conditional: ($scope: TScope) => boolean) { }

    public popover: any;
  }

  export interface IBsPopoverData {
    animation?: string;
    placement?: string;
    trigger?: string;
    title?: string;
    content?: string;
    html?: boolean;
    delay?: { show: number; hide: number; };
    container?: string;
    target?: string;
    template?: string;
    contentTemplate?: string;
    autoClose?: boolean;
    id?: string;
    viewport?: string;
  }

  export class DialogControllerBase extends BaseController {
    static $inject = ['$scope', 'logger', '$modalInstance', '$q'];

    constructor($scope, logger, public $modalInstance, $q) {
      super($scope, logger, $q);

      $scope.$close = () => {
        $modalInstance.close();
      };
    }
  }

  export class ModelDialogControllerBase<TModel> extends DialogControllerBase {
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model'];

    constructor($scope, logger, public $modalInstance, $q, model: TModel) {
      super($scope, logger, $modalInstance, $q);
      $scope.model = model;
    }
  }

  export class MainAppController extends BaseController {
    static $name = "MainAppController";
    static $inject = ['$scope', 'usSpinnerService', 'logger', 'w6', '$location', '$q', '$timeout', '$rootScope', '$anchorScroll', 'aur.eventBus'];

    constructor($scope, private $spinner, logger, private w6: W6, private $location: ng.ILocationService, $q: ng.IQService, private $timeout: ng.ITimeoutService, private $rootScope: IRootScope, $anchorScroll, private eventBus: EventAggregator) {
      super($scope, logger, $q);

      $rootScope.logout = () => w6.logout();
      $rootScope.openLoginDialog = evt => {
        if (evt) evt.preventDefault();
        w6.openLoginDialog(evt);
      };
      w6.openRegisterDialog = (event) => this.openRegisterDialog(event);

      $rootScope.ready = () => {
        Debug.log('ready');
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
        if (!$rootScope.$$phase) $scope.$apply();
      };

      $rootScope.initialLoad = true;

      // TODO: Somehow fix loading indication of the initial page load...
      var destroyList = [];
      destroyList.push($rootScope.$on('$routeChangeStart', this.routeStart));
      destroyList.push($rootScope.$on('loadingStatusActive', this.showSpinner));
      destroyList.push($rootScope.$on('loadingStatusInactive', this.hideSpinner));
      destroyList.push($rootScope.$on('$routeChangeError', this.routeError));
      destroyList.push($rootScope.$on('$routeChangeSuccess', this.routeSuccess));
      destroyList.push($rootScope.$on('$locationChangeSuccess', () => {
        this.setupDefaultTitle();
        $rootScope.setMicrodata(null);
        $rootScope.url.currentPage = $location.absUrl().split('#')[0];
      }));

      destroyList.push($rootScope.$on('$viewContentLoaded', () => {
        Debug.log('ANGULAR: view content loaded success');
      }));

      $scope.$on('$destroy', () => destroyList.forEach(x => x()));

      this.backwardsCompatibility();
    }
    openRegisterDialog(evt) {
      if (evt) evt.preventDefault();
      this.$scope.request(Components.Dialogs.OpenRegisterDialogQuery);
    }

    private routeStart = (scope, next, current) => {
      Debug.log('ANGULAR: route start');
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
      Debug.log('ANGULAR: route change success');
      if (!initialCompleted) {
        this.$timeout(() => {
          Debug.log('ANGULAR: initialRouteSuccess');
          initialCompleted = true;
        });
      }
    };
    private showSpinner = () => {
      this.$scope.loading = true;
      this.$spinner.spin('fetch-spinner');
    };
    private hideSpinner = () => {
      this.$scope.loading = false;
      this.$spinner.stop('fetch-spinner');
    };
    private routeError = (evt, current, previous, rejection) => {
      Debug.log("Error loading page", evt, current, previous, rejection);
      if (rejection.message)
        this.logger.error(rejection.message, "Failed loading page");
      else
        this.logger.error(rejection.data.message + "\n(" + rejection.status + ": " + rejection.statusText + ")");

    }; // These help us bring Angular awesomeness to outside the current scope of ng-app; something we'll improve on in the future...
    // Generally you should NOT manipulate DOM directly from within controllers. But directives / binding instead.
    backwardsCompatibility() {
      jQuery(document).ready(() => {
        this.w6.handleClient();
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
      if ($(".popgroup").length > 0) $(".popgroup").colorbox({ rel: 'group2', transition: "fade" });

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
      Debug.log('aurelia page controller init', initialCompleted);
    }
  }

  registerController(AureliaPageController);

  export class LoadingFailedController extends Tk.Controller {
    static $name = 'LoadingFailedController';
    static $inject = ['$scope', 'logger', 'ForwardService', 'error'];

    constructor($scope, logger, private forwardService: Components.ForwardService, error) {
      super($scope);
      var errorMsg = window.w6Cheat.api.errorMsg(error);

      $scope.reason = (errorMsg[1] != null ? (errorMsg[1] + ": ") : "") + errorMsg[0];
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

  export interface IBreezeErrorReason extends IBreezeHttpResponse<IHttpResponse<IHttpResponseException>> {
  }

  export interface IBreezeHttpResponse<TResponse> {
    httpResponse: TResponse;
    entityManager: breeze.EntityManager;
    query: breeze.EntityQuery;
    status: number;
    message: string;
  }

  export interface IHttpResponse<TData> {
    data: TData;
    status: number;
    statusText: string;
  }

  export interface IHttpResponseException {
    $id: string;
    $type: string;
    ExceptionMessage: string;
    ExceptionType: string;
    Message: string;
    StackTrace?: string;
  }
}

export module MyApp.Admin {
  angular.module('MyAppAdminTemplates', []);

  class AdminModule extends Tk.Module {
    static $name = "AdminModule";

    constructor() {
      super("MyAppAdmin", ['app', 'commangular', 'ngRoute', 'route-segment', 'view-segment', 'Components.Directives', 'Components', 'MyAppAdminTemplates']);
      this.app.config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            $routeProvider.when('/', 'root')
              .segment('root', {
                controller: 'RootController',
                templateUrl: '/src_legacy/app/admin/index.html',
                permission: [Resource.admin, Permission.Read]
              })
              .when('/stats', 'stats')
              .when('/stats/games', 'stats.games')
              .when('/stats/content', 'stats.content')
              .when('/stats/orders', 'stats.orders')
              .when('/stats/missions', 'stats.missions')
              .when('/stats/global', 'stats.global')
              .when('/stats/accounts', 'stats.accounts')
              .segment('stats', {
                controller: 'StatsController',
                templateUrl: '/src_legacy/app/admin/pages/stats.html'
              })
              .within()
              .segment('global', {
                controller: 'GlobalController',
                templateUrl: '/src_legacy/app/admin/global/index.html',
                resolve: setupQuery(GetGlobalIntegersOverviewQuery),
                default: true
              })
              .segment('accounts', {
                controller: 'AccountsController',
                templateUrl: '/src_legacy/app/admin/accounts/index.html',
                resolve: setupQuery(GetAccountOverviewQuery)
              })
              .segment('orders', {
                controller: 'OrdersController',
                templateUrl: '/src_legacy/app/admin/orders/index.html',
                resolve: setupQuery(GetOrderOverviewQuery)
              })
              .segment('games', {
                controller: 'GamesController',
                templateUrl: '/src_legacy/app/admin/games/index.html',
                resolve: setupQuery(GetGameOverviewQuery)
              })
              .segment('content', {
                controller: 'GamesContentController',
                templateUrl: '/src_legacy/app/admin/games/content.html',
                resolve: setupQuery(GetGameContentOverviewQuery)
              })
              .segment('missions', {
                controller: 'MissionsController',
                templateUrl: '/src_legacy/app/admin/missions/index.html',
                resolve: setupQuery(GetMissionOverviewQuery)
              });
          }
        ]);
    }
  }

  var app = new AdminModule();

  class RootController extends BaseController {
    static $name = "RootController";
  }

  registerController(RootController);

  class StatsController extends BaseController {
    static $name = "StatsController";

    constructor($scope, logger, $q) {
      super($scope, logger, $q);
      $scope.menuItems = this.getMenuItems([
        { header: "Global", segment: "global", isDefault: true },
        { header: "Accounts", segment: "accounts" },
        { header: "Orders", segment: "orders" },
        { header: "Games", segment: "games" },
        { header: "Content", segment: "content" },
        { header: "Missions", segment: "missions" }
      ], "stats");
    }
  }

  registerController(StatsController);


  class OrdersController extends BaseQueryController<any> {
    static $name = 'OrdersController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(OrdersController);

  class AccountsController extends BaseQueryController<any> {
    static $name = 'AccountsController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(AccountsController);

  class MissionsController extends BaseQueryController<any> {
    static $name = 'MissionsController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(MissionsController);

  class GlobalController extends BaseQueryController<any> {
    static $name = 'GlobalController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GlobalController);

  class GamesController extends BaseQueryController<any> {
    static $name = 'GamesController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GamesController);

  class GamesContentController extends BaseQueryController<any> {
    static $name = 'GamesContentController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GamesContentController);


  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  export function registerCQ(command) { app.registerCommand(command); }

  class GetOrderOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetOrderOverview';
    public execute = [
      () => this.context.getCustom('admin/orders')
        .then(r => r.data)
    ];
  }

  registerCQ(GetOrderOverviewQuery);

  class GetMissionOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetMissionOverview';
    public execute = [() => { }]; // TODO
  }

  registerCQ(GetMissionOverviewQuery);


  class GetGlobalIntegersOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetGlobalIntegersOverview';
    public execute = [
      () => this.context.getCustom('admin/globalintegers')
        .then(r => r.data)
    ];
  }

  registerCQ(GetGlobalIntegersOverviewQuery);


  class GetGameOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetGameOverview';
    public execute = [
      () => this.context.getCustom('admin/games')
        .then(r => r.data)
    ];
  }

  registerCQ(GetGameOverviewQuery);

  class GetGameContentOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetGameContentOverview';
    public execute = [() => this.context.getCustom('admin/games/content').then(r => r.data)];
  }

  registerCQ(GetGameContentOverviewQuery);

  class GetAccountOverviewQuery extends MyApp.DbQueryBase {
    static $name = 'GetAccountOverview';
    public execute = [
      () => this.context.getCustom('admin/accounts')
        .then(r => r.data)
    ];
  }

  registerCQ(GetAccountOverviewQuery);
}

export module MyApp.Components {
  class ComponentsModule extends Tk.Module {
    static $name = "ComponentsModule";

    constructor() {
      super('Components', ['commangular']);
      this.app
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .factory('refreshService', [
          () => {
            var cache = {};
            return {
              getType: (type) => cache[type],
              refreshType: (type) => cache[type] = !cache[type]
            };
          }
        ]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new ComponentsModule();


  export enum FileSize {
    B,
    KB,
    MB,
    GB,
    TB,
    PB,
    EB,
    ZB,
    YB
  }

  export interface IMicrodata {
    title: string;
    description: string;
    image?: string;
    keywords?: string;
    currentPage?: string;
  }

  export interface IPageInfo {
    title: string;
  }

  class DirectivesComponent extends Tk.Module {
    static $name = "DirectivesComponentModule";

    constructor() {
      super('Components.Directives', []);
      this.app // http://stackoverflow.com/questions/21249441/disable-nganimate-form-some-elements
        .directive('sxDisableAnimation', [
          '$animate', ($animate) => {
            return {
              restrict: 'A',
              link: ($scope, $element, $attrs) => $animate.enabled(false, $element)
            };
          }
        ])
        .factory('RecursionHelper', [
          '$compile', $compile => {
            return {
              /**
           * Manually compiles the element, fixing the recursion loop.
           * @param element
           * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
           * @returns An object containing the linking functions.
           */
              compile: (element, link) => {
                // Normalize the link parameter
                if (angular.isFunction(link)) {
                  link = { post: link };
                }

                // Break the recursion loop by removing the contents
                var contents = element.contents().remove();
                var compiledContents;
                return {
                  pre: (link && link.pre) ? link.pre : null,
                                    /**
                                 * Compiles and re-adds the contents
                                 */ post(scope, element) {
                    // Compile the contents
                    if (!compiledContents) {
                      compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, clone => {
                      element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if (link && link.post) {
                      link.post.apply(null, arguments);
                    }
                  }
                };
              }
            };
          }
        ])
        .directive('sxContent', () => {
          var msie = (<any>document).documentMode;
          var propName = 'content',
            name = 'content';
          var normalized = "sxContent";
          return {
            priority: 99, // it needs to run after the attributes are interpolated
            link: (scope, element, attr) => {
              attr.$observe(normalized, value => {
                /*
                                                if (!value) {
                                                    if (attrName === 'href') {
                                                        attr.$set(name, null);
                                                    }
                                                    return;
                                                }
                */

                attr.$set(name, value);

                // on IE, if "ng:src" directive declaration is used and "src" attribute doesn't exist
                // then calling element.setAttribute('src', 'foo') doesn't do anything, so we need
                // to set the property as well to achieve the desired effect.
                // we use attr[attrName] value since $set can sanitize the url.
                if (msie && propName) element.prop(propName, attr[name]);
              });
            }

          };
        })
        .directive('sxMicrodata', () => {
          return {
            require: 'ngModel',
            replace: true,
            scope: {
              twitterName: '@',
              twitterSiteId: '@',
              ogName: '@'
            },
            link: (scope, el, attrs, ngModel) => {

            }
          };
        }).
        directive('sxAdsense', [
          '$window', '$compile', 'adsense', ($window, $compile, adsense) => {
            return {
              restrict: 'E',
              template: "",
              replace: true,
              scope: {
                slot: '&dataSlot',
                width: '&dataWidth',
                height: '&dataHeight',
              },
              link: (scope, element, iAttrs) => {
                var adSenseTpl = '<div class="adlinks"><ins class="adsbygoogle" style="display:inline-block;width:' + iAttrs.width + 'px;height:' + iAttrs.height + 'px" data-ad-client="' + adsense.client + '" data-ad-slot="' + iAttrs.slot + '"></ins></div>';
                element.html(angular.element($compile(adSenseTpl)(scope)));
                if (!$window.adsbygoogle)
                  $window.adsbygoogle = [];
                try {
                  $window.adsbygoogle.push({});
                } catch (ex) {
                }
              }
            };
          }
        ]).
        directive('validFile', () => {
          return {
            require: 'ngModel',
            link: (scope, el, attrs, ngModel: ng.INgModelController) => {
              el.bind('change', () => {
                scope.$apply(() => {
                  ngModel.$setViewValue(el.val());
                  ngModel.$render();
                });
              });
            }
          };
        }).
        directive('sxInitScope', () => {
          return {
            scope: true,
            priority: 450,
            compile: () => {
              return {
                pre: (scope, element, attrs) => {
                  var attr = <any>attrs;
                  scope.$eval(attr.sxInitScope);
                }
              };
            }
          };
        }).
        directive('sxSpoiler', () => {
          return {
            scope: {

            },
            restrict: 'E',
            transclude: true,
            templateUrl: '/src_legacy/app/components/spoiler.html',
            link: ($scope, $element, $attrs, controller) => {
              $scope['shown'] = false;
              $scope['toggle'] = () => {
                $scope['shown'] = !$scope['shown'];
              };
            }
          };
        }).
        directive('sxCompile', [
          '$compile', $compile => (scope, element, attrs) => {
            scope.$watch(
              scope => scope.$eval(attrs.sxCompile),
              value => {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);

                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
              }
            );
          }
        ]).
        directive('sxContentHeader', () => {
          return {
            restrict: 'A',
            transclude: true,
            templateUrl: '/src_legacy/app/play/shared/_content-header-new.html'
          };
        }).
        directive('sxEditListItem', () => {
          return {
            restrict: 'EA',
            transclude: true,
            templateUrl: '/src_legacy/app/play/shared/_edit-list-item.html'
          };
        }).
        directive('sxEditListItemNoModify', () => {
          return {
            restrict: 'EA',
            transclude: true,
            templateUrl: '/src_legacy/app/play/shared/_edit-list-item-no-modify.html'
          };
        }).
        directive('sxInfoPage', () => {
          return {
            restrict: 'E',
            transclude: true,
            templateUrl: '/src_legacy/app/play/shared/_info-page.html'
          };
        }).
        directive('sxMultiTransclude', () => {
          return {
            controller: MultiTranscludeDirectiveController,

            link: ($scope, $element, $attrs, controller: MultiTranscludeDirectiveController) => {
              var attrs = <any>$attrs;
              var selector = '[name=' + attrs.sxMultiTransclude + ']';
              var attach = clone => {
                var $part = clone.find(selector).addBack(selector);
                if ($part.length != 0) {
                  $element.html('');
                  $element.append($part);
                }
              };

              if (controller.$transclude.$$element) {
                attach(controller.$transclude.$$element);
              } else {
                controller.$transclude(clone => {
                  controller.$transclude.$$element = clone;
                  attach(clone);
                });
              }
            }
          };
        }).directive("sxLateTemplate", [
          '$templateCache', '$compile', '$timeout', '$parse', '$http', '$q', ($templateCache, $compile, $timeout, $parse, $http: ng.IHttpService, $q: ng.IQService) => {
            function getTemplate(keyOrUrl: string) {
              var data = $templateCache.get(keyOrUrl);

              if (data) {
                return $q.when(data);
              } else {
                var deferred = $q.defer();

                $http.get(keyOrUrl, { cache: true }).success(function(html) {
                  $templateCache.put(keyOrUrl, html);

                  deferred.resolve(html);
                });

                return deferred.promise;
              }
            }
            return {
              scope: {
                template: '='
              },
              restrict: 'A',
              link: (scope, element, attrs) => {
                $timeout(() => {
                  getTemplate(scope.template).then(x => {
                    var content = $compile(x)(scope.$parent);
                    element.append(content);
                  });
                });

              }
            };
          }
        ]).
        directive('sxTime', () => {
          return {
            restrict: 'E',
            template: ($element, $attrs) => {
              // disabled raw date time display for now.
              // TODO: Convert to proper .html template
              // TODO: Decide on how far ago the timeago should be used
              // TODO: Leverage Moment.js for the date time rendering as per timezone/region settings of browser or user preference..
              //if ($attrs.ago) {
              if ($attrs.title)
                return '<time am-time-ago="' + $attrs.time + '" title="' + $attrs.title + '" datetime="{{' + $attrs.time + ' | date:\'yyyy - MM-ddTHH:mm: ss:Z\'}}" itemprop="datePublished"></time>';
              return '<time am-time-ago="' + $attrs.time + '" title="{{' + $attrs.time + ' | date: \'medium\'}}" datetime="{{' + $attrs.time + ' | date:\'yyyy - MM-ddTHH:mm: ss:Z\'}}" itemprop="datePublished"></time>';
              //}
              //return "{{" + $attrs.time + " | date : \"MMMM d 'at' h:mma\"}}";
            }
          };
        }).
        directive("sxPasswordVerify", () => {
          return {
            require: "ngModel",
            scope: {
              passwordVerify: '=sxPasswordVerify'
            },
            link: (scope: any, element, attrs, ctrl) => {
              scope.$watch(() => {
                var combined;

                if (scope.passwordVerify || ctrl.$viewValue) {
                  combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                }
                return combined;
              }, value => {
                if (value) {
                  ctrl.$parsers.unshift(viewValue => {
                    var origin = scope.passwordVerify;
                    if (origin !== viewValue) {
                      ctrl.$setValidity("passwordVerify", false);
                      return undefined;
                    } else {
                      ctrl.$setValidity("passwordVerify", true);
                      return viewValue;
                    }
                  });
                }
              });
            }
          };
        }).directive('sxBsDropdown', [
          '$window', '$sce', '$dropdown', ($window, $sce, $dropdown) => {

            return {
              restrict: 'EAC',
              scope: true,
              link: (scope, element, attr: any, transclusion) => {

                // Directive options
                var options = { scope: scope, element: null };
                angular.forEach(['placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'template', 'element'], function(key) {
                  if (angular.isDefined(attr[key])) options[key] = attr[key];
                });

                // Support scope as an object
                attr.bsDropdown && scope.$watch(attr.bsDropdown, function(newValue, oldValue) {
                  scope.content = newValue;
                }, true);

                // Visibility binding support
                attr.bsShow && scope.$watch(attr.bsShow, function(newValue, oldValue) {
                  if (!dropdown || !angular.isDefined(newValue)) return;
                  if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(dropdown),?/i);
                  newValue === true ? dropdown.show() : dropdown.hide();
                });

                // Initialize dropdown
                var dropdown = $dropdown(options.element ? options.element : element, options);

                // Garbage collection
                scope.$on('$destroy', function() {
                  if (dropdown) dropdown.destroy();
                  options = null;
                  dropdown = null;
                });

              }
            };
          }
        ]).filter('reverse', function() {
          return function(items) {
            if (items == null)
              return items;
            return items.slice().reverse();
          };
        })
        // TODO: just use <a href/ng-href ?
        .directive('clickLink', [
          '$location', function($location) {
            return {
              link: function(scope, element, attrs) {
                element.on('click', function() {
                  scope.$apply(function() {
                    $location.url(attrs.clickLink);
                  });
                });
              }
            };
          }
        ])
        .directive('autoFocus', function() {
          return {
            link: {
              pre: function preLink(scope, element, attr) {
                // this fails since the element hasn't rendered
                //element[0].focus();
              },
              post: function postLink(scope, element, attr) {
                // this succeeds since the element has been rendered
                element[0].focus();
              }
            }
          };
        }).directive('collapseWidth', [
          '$transition', function($transition, $timeout) {

            return {
              link: function(scope, element, attrs) {

                var initialAnimSkip = true;
                var currentTransition;

                function doTransition(change) {
                  var newTransition = $transition(element, change);
                  if (currentTransition) {
                    currentTransition.cancel();
                  }
                  currentTransition = newTransition;
                  newTransition.then(newTransitionDone, newTransitionDone);
                  return newTransition;

                  function newTransitionDone() {
                    // Make sure it's this transition, otherwise, leave it alone.
                    if (currentTransition === newTransition) {
                      currentTransition = undefined;
                    }
                  }
                }

                function expand() {
                  if (initialAnimSkip) {
                    initialAnimSkip = false;
                    expandDone();
                  } else {
                    element.removeClass('collapse').addClass('collapsing-width');
                    doTransition({ width: element[0].scrollWidth + 'px' }).then(expandDone);
                  }
                }

                function expandDone() {
                  element.removeClass('collapsing-width');
                  element.addClass('collapse in');
                  element.css({ width: 'auto' });
                }

                function collapse() {
                  if (initialAnimSkip) {
                    initialAnimSkip = false;
                    collapseDone();
                    element.css({ width: 0 });
                  } else {
                    // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                    element.css({ width: element[0].scrollWidth + 'px' });
                    //trigger reflow so a browser realizes that height was updated from auto to a specific value
                    var x = element[0].offsetHeight;

                    element.removeClass('collapse in').addClass('collapsing-width');

                    doTransition({ width: 0 }).then(collapseDone);
                  }
                }

                function collapseDone() {
                  element.removeClass('collapsing-width');
                  element.addClass('collapse');
                }

                scope.$watch(attrs.collapseWidth, function(shouldCollapse) {
                  if (shouldCollapse) {
                    collapse();
                  } else {
                    expand();
                  }
                });
              }
            };
          }
        ]).factory('focus', function($timeout) {
          return function(id) {
            // timeout makes sure that is invoked after any other event has been triggered.
            // e.g. click events that need to run before the focus or
            // inputs elements that are in a disabled state but are enabled when those events
            // are triggered.
            $timeout(function() {
              var element = document.getElementById(id);
              if (element)
                element.focus();
            });
          };
        })
        .directive('eventFocus', function(focus) {
          return function(scope, elem, attr) {
            elem.on(attr.eventFocus, function() {
              focus(attr.eventFocusId);
            });

            // Removes bound events in the element itself
            // when the scope is destroyed

            scope.$on('$destroy', function() {
              elem.off(attr.eventFocus);
            });
          };
        })
        .controller('Ctrl', function($scope, focus) {
          $scope.doSomething = function() {
            // do something awesome
            focus('email');
          };
        });
    }
  }

  class MultiTranscludeDirectiveController {
    static $inject = ['$scope', '$element', '$attrs', '$transclude'];

    constructor($scope, $element, $attrs, $transclude) {
      if (!$transclude) {
        throw {
          name: 'DirectiveError',
          message: 'sx-multi-transclude found without parent requesting transclusion'
        };
      }
      this.$transclude = $transclude;
    }

    $transclude;
  }

  var app = new DirectivesComponent();

  angular.module('xeditable').factory('editableController2',
    [
      '$q', 'editableUtils',
      function($q, editableUtils) {

        //EditableController function
        EditableController.$inject = ['$scope', '$attrs', '$element', '$parse', 'editableThemes', 'editableIcons', 'editableOptions', '$rootScope', '$compile', '$q'];

        function EditableController($scope, $attrs, $element, $parse, editableThemes, editableIcons, editableOptions, $rootScope, $compile, $q) {
          var valueGetter;

          //if control is disabled - it does not participate in waiting process
          var inWaiting;

          var self = this;

          self.scope = $scope;
          self.elem = $element;
          self.attrs = $attrs;
          self.inputEl = null;
          self.editorEl = null;
          self.single = true;
          self.error = '';
          self.theme = editableThemes[editableOptions.theme] || editableThemes['default'];
          self.parent = {};

          //will be undefined if icon_set is default and theme is default
          self.icon_set = editableOptions.icon_set === 'default' ? editableIcons.default[editableOptions.theme] : editableIcons.external[editableOptions.icon_set];

          //to be overwritten by directive
          self.inputTpl = '';
          self.directiveName = '';

          // with majority of controls copy is not needed, but..
          // copy MUST NOT be used for `select-multiple` with objects as items
          // copy MUST be used for `checklist`
          self.useCopy = false;

          //runtime (defaults)
          self.single = null;

          /**
           * Attributes defined with `e-*` prefix automatically transfered from original element to
           * control.
           * For example, if you set `<span editable-text="user.name" e-style="width: 100px"`>
           * then input will appear as `<input style="width: 100px">`.
           * See [demo](#text-customize).
           *
           * @var {any|attribute} e-*
           * @memberOf editable-element
           */

          /**
           * Whether to show ok/cancel buttons. Values: `right|no`.
           * If set to `no` control automatically submitted when value changed.
           * If control is part of form buttons will never be shown.
           *
           * @var {string|attribute} buttons
           * @memberOf editable-element
           */
          self.buttons = 'right';
          /**
           * Action when control losses focus. Values: `cancel|submit|ignore`.
           * Has sense only for single editable element.
           * Otherwise, if control is part of form - you should set `blur` of form, not of individual element.
           *
           * @var {string|attribute} blur
           * @memberOf editable-element
           */
          // no real `blur` property as it is transfered to editable form

          //init
          self.init = function(single) {
            self.single = single;

            self.name = $attrs.eName || $attrs[self.directiveName];
            /*
            if(!$attrs[directiveName] && !$attrs.eNgModel && ($attrs.eValue === undefined)) {
              throw 'You should provide value for `'+directiveName+'` or `e-value` in editable element!';
            }
            */
            if ($attrs[self.directiveName]) {
              valueGetter = $parse($attrs[self.directiveName]);
            } else {
              throw 'You should provide value for `' + self.directiveName + '` in editable element!';
            }

            // settings for single and non-single
            if (!self.single) {
              // hide buttons for non-single
              self.buttons = 'no';
            } else {
              self.buttons = self.attrs.buttons || editableOptions.buttons;
            }

            //if name defined --> watch changes and update $data in form
            if ($attrs.eName) {
              self.scope.$watch('$data', function(newVal) {
                self.scope.$form.$data[$attrs.eName] = newVal;
              });
            }

            /**
             * Called when control is shown.
             * See [demo](#select-remote).
             *
             * @var {method|attribute} onshow
             * @memberOf editable-element
             */
            if ($attrs.onshow) {
              self.onshow = function() {
                return self.catchError($parse($attrs.onshow)($scope));
              };
            }

            /**
             * Called when control is hidden after both save or cancel.
             *
             * @var {method|attribute} onhide
             * @memberOf editable-element
             */
            if ($attrs.onhide) {
              self.onhide = function() {
                return $parse($attrs.onhide)($scope);
              };
            }

            /**
             * Called when control is cancelled.
             *
             * @var {method|attribute} oncancel
             * @memberOf editable-element
             */
            if ($attrs.oncancel) {
              self.oncancel = function() {
                return $parse($attrs.oncancel)($scope);
              };
            }

            /**
             * Called during submit before value is saved to model.
             * See [demo](#onbeforesave).
             *
             * @var {method|attribute} onbeforesave
             * @memberOf editable-element
             */
            if ($attrs.onbeforesave) {
              self.onbeforesave = function() {
                return self.catchError($parse($attrs.onbeforesave)($scope));
              };
            }

            /**
             * Called during submit after value is saved to model.
             * See [demo](#onaftersave).
             *
             * @var {method|attribute} onaftersave
             * @memberOf editable-element
             */
            if ($attrs.onaftersave) {
              self.onaftersave = function() {
                return self.catchError($parse($attrs.onaftersave)($scope));
              };
            }

            // watch change of model to update editable element
            // now only add/remove `editable-empty` class.
            // Initially this method called with newVal = undefined, oldVal = undefined
            // so no need initially call handleEmpty() explicitly
            $scope.$parent.$watch($attrs[self.directiveName], function(newVal, oldVal) {
              self.setLocalValue();
              self.handleEmpty();
            });
          };

          self.render = function() {
            var theme = self.theme;

            //build input
            self.inputEl = angular.element(self.inputTpl);

            //build controls
            self.controlsEl = angular.element(theme.controlsTpl);
            self.controlsEl.append(self.inputEl);

            //build buttons
            if (self.buttons !== 'no') {
              self.buttonsEl = angular.element(theme.buttonsTpl);
              self.submitEl = angular.element(theme.submitTpl);
              self.cancelEl = angular.element(theme.cancelTpl);
              if (self.icon_set) {
                self.submitEl.find('span').addClass(self.icon_set.ok);
                self.cancelEl.find('span').addClass(self.icon_set.cancel);
              }
              self.buttonsEl.append(self.submitEl).append(self.cancelEl);
              self.controlsEl.append(self.buttonsEl);

              self.inputEl.addClass('editable-has-buttons');
            }

            //build error
            self.errorEl = angular.element(theme.errorTpl);
            self.controlsEl.append(self.errorEl);

            //build editor
            self.editorEl = angular.element(self.single ? theme.formTpl : theme.noformTpl);
            self.editorEl.append(self.controlsEl);

            // transfer `e-*|data-e-*|x-e-*` attributes
            for (var k in $attrs.$attr) {
              if (k.length <= 1) {
                continue;
              }
              var transferAttr = <any>false;
              var nextLetter = k.substring(1, 2);

              // if starts with `e` + uppercase letter
              if (k.substring(0, 1) === 'e' && nextLetter === nextLetter.toUpperCase()) {
                transferAttr = k.substring(1); // cut `e`
              } else {
                continue;
              }

              // exclude `form` and `ng-submit`,
              if (transferAttr === 'Form' || transferAttr === 'NgSubmit') {
                continue;
              }

              // convert back to lowercase style
              transferAttr = transferAttr.substring(0, 1).toLowerCase() + editableUtils.camelToDash(transferAttr.substring(1));

              // workaround for attributes without value (e.g. `multiple = "multiple"`)
              // except for 'e-value'
              var attrValue = (transferAttr !== 'value' && $attrs[k] === '') ? transferAttr : $attrs[k];

              // set attributes to input
              self.inputEl.attr(transferAttr, attrValue);
            }

            self.inputEl.addClass('editable-input');
            self.inputEl.attr('ng-model', '$data');

            // add directiveName class to editor, e.g. `editable-text`
            self.editorEl.addClass(editableUtils.camelToDash(self.directiveName));

            if (self.single) {
              self.editorEl.attr('editable-form', '$form');
              // transfer `blur` to form
              self.editorEl.attr('blur', self.attrs.blur || (self.buttons === 'no' ? 'cancel' : editableOptions.blurElem));
            }

            //apply `postrender` method of theme
            if (angular.isFunction(theme.postrender)) {
              theme.postrender.call(self);
            }

          };

          // with majority of controls copy is not needed, but..
          // copy MUST NOT be used for `select-multiple` with objects as items
          // copy MUST be used for `checklist`
          self.setLocalValue = function() {
            self.scope.$data = self.useCopy ?
              angular.copy(valueGetter($scope.$parent)) :
              valueGetter($scope.$parent);
          };

          //show
          self.show = function() {
            // set value of scope.$data
            self.setLocalValue();

            /*
            Originally render() was inside init() method, but some directives polluting editorEl,
            so it is broken on second openning.
            Cloning is not a solution as jqLite can not clone with event handler's.
            */
            self.render();

            // insert into DOM
            $element.after(self.editorEl);

            // compile (needed to attach ng-* events from markup)
            $compile(self.editorEl)($scope);

            // attach listeners (`escape`, autosubmit, etc)
            self.addListeners();

            // hide element
            $element.addClass('editable-hide');

            // onshow
            return self.onshow();
          };

          //hide
          self.hide = function() {
            self.editorEl.remove();
            $element.removeClass('editable-hide');

            // onhide
            return self.onhide();
          };

          // cancel
          self.cancel = function() {
            // oncancel
            self.oncancel();
            // don't call hide() here as it called in form's code
          };

          /*
          Called after show to attach listeners
          */
          self.addListeners = function() {
            // bind keyup for `escape`
            self.inputEl.bind('keyup', function(e) {
              if (!self.single) {
                return;
              }

              // todo: move this to editable-form!
              switch (e.keyCode) {
                // hide on `escape` press
                case 27:
                  self.scope.$apply(function() {
                    self.scope.$form.$cancel();
                  });
                  break;
              }
            });

            // autosubmit when `no buttons`
            if (self.single && self.buttons === 'no') {
              self.autosubmit();
            }

            // click - mark element as clicked to exclude in document click handler
            self.editorEl.bind('click', function(e) {
              // ignore right/middle button click
              if (e.which && e.which !== 1) {
                return;
              }

              if (self.scope.$form.$visible) {
                self.scope.$form._clicked = true;
              }
            });
          };

          // setWaiting
          self.setWaiting = function(value) {
            if (value) {
              // participate in waiting only if not disabled
              inWaiting = !self.inputEl.attr('disabled') &&
                !self.inputEl.attr('ng-disabled') &&
                !self.inputEl.attr('ng-enabled');
              if (inWaiting) {
                self.inputEl.attr('disabled', 'disabled');
                if (self.buttonsEl) {
                  self.buttonsEl.find('button').attr('disabled', 'disabled');
                }
              }
            } else {
              if (inWaiting) {
                self.inputEl.removeAttr('disabled');
                if (self.buttonsEl) {
                  self.buttonsEl.find('button').removeAttr('disabled');
                }
              }
            }
          };

          self.activate = function(start, end) {
            setTimeout(function() {
              var el = self.inputEl[0];
              if (editableOptions.activate === 'focus' && el.focus) {
                if (start) {
                  end = end || start;
                  el.onfocus = function() {
                    var that = this;
                    setTimeout(function() {
                      that.setSelectionRange(start, end);
                    });
                  };
                }
                el.focus();
              }
              if (editableOptions.activate === 'select' && el.select) {
                el.select();
              }
            }, 0);
          };

          self.setError = function(msg) {
            if (!angular.isObject(msg)) {
              $scope.$error = msg;
              self.error = msg;
            }
          };

          /*
          Checks that result is string or promise returned string and shows it as error message
          Applied to onshow, onbeforesave, onaftersave
          */
          self.catchError = function(result, noPromise) {
            if (angular.isObject(result) && noPromise !== true) {
              $q.when(result).then(
                //success and fail handlers are equal
                angular.bind(this, function(r) {
                  this.catchError(r, true);
                }),
                angular.bind(this, function(r) {
                  this.catchError(r, true);
                })
              );
              //check $http error
            } else if (noPromise && angular.isObject(result) && result.status &&
              (result.status !== 200) && result.data && angular.isString(result.data)) {
              this.setError(result.data);
              //set result to string: to let form know that there was error
              result = result.data;
            } else if (angular.isString(result)) {
              this.setError(result);
            }
            return result;
          };

          self.save = function() {
            valueGetter.assign($scope.$parent,
              self.useCopy ? angular.copy(self.scope.$data) : self.scope.$data);

            // no need to call handleEmpty here as we are watching change of model value
            // self.handleEmpty();
          };

          /*
          attach/detach `editable-empty` class to element
          */
          self.handleEmpty = function() {
            var val = valueGetter($scope.$parent);
            var isEmpty = val === null || val === undefined || val === "" || (angular.isArray(val) && val.length === 0);
            $element.toggleClass('editable-empty', isEmpty);
          };

          /*
          Called when `buttons = "no"` to submit automatically
          */
          self.autosubmit = angular.noop;

          self.onshow = angular.noop;
          self.onhide = angular.noop;
          self.oncancel = angular.noop;
          self.onbeforesave = angular.noop;
          self.onaftersave = angular.noop;
        }

        return EditableController;
      }
    ]);
  //#region editableMarkdown
  angular.module('xeditable').directive('editableMarkdown', [
    'editableLinkDirectiveFactory',
    editableDirectiveFactory => editableDirectiveFactory({
      directiveName: 'editableMarkdown',
      inputTpl: '<textarea sx-pagedown></textarea>',
      addListeners: function() {
        var self = this;
        self.parent.addListeners.call(self);
        // submit textarea by ctrl+enter even with buttons
        if (self.single && self.buttons !== 'no') {
          self.autosubmit();
        }
      },
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
            self.scope.$apply(function() {
              self.scope.$form.$submit();
            });
          }
        });
      },
      render: function() {
        var self = this;

        self.parent.render();

        self.editorEl.attr('blur', '');
      },
      activate: function() {
        //var self = this;

        //setTimeout(function() {
        //    var elem = <HTMLFormElement>self.editorEl[0];
        //    $(elem).find(".wmd-input").focus();
        //}, 0);
      }
    })
  ]);

  angular.module('xeditable').directive('editableHtml', [
    'editableLinkDirectiveFactory', '$timeout',
    (editableDirectiveFactory, $timeout) => editableDirectiveFactory({
      directiveName: 'editableHtml',
      inputTpl: '<textarea redactor="{blurCallback: initBlur(), keydownCallback: initKeydown()}"></textarea>',
      addListeners: function() {
        var self = this;
        self.parent.addListeners.call(self);
        // submit textarea by ctrl+enter even with buttons
        if (self.single && self.buttons !== 'no') {
          self.autosubmit();
        }
      },
      autosubmit: function() {
        var self = this;
        self.keydownEvents = self.keyDownEvents || [];
        //self.inputEl.bind('keydown',
        self.keydownEvents.push(e => {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
            this.scope.$apply(() => {
              this.scope.$form.$submit();
            });
          }
        });
        self.blurEvents = self.blurEvents || [];
        if (self.attrs.blurSaves != undefined) {
          self.blurEvents = self.blurEvents || [];
          //self.inputEl.bind('blur',
          self.blurEvents.push((e) => {
            self.scope.$apply(() => {
              self.scope.$form.$submit();
            });
          });
        }
      },
      render: function() {
        var self = this;
        // TODO: Consider if it would make sense to proxy these events to the actual textarea element
        // (so disable these events on the textarea itself, then raise these events as if it were the textarea's own events)
        // this would at least make the editor more compatible with anything listening for these events??

        self.scope.initBlur = () => self.scope.blur; // helper to attach the event handler
        self.scope.initKeydown = () => self.scope.keydown; // helper to attach the event handler
        self.scope.blur = e => { if (self.blurEvents) angular.forEach(self.blurEvents, x => x(e)); };
        self.scope.keydown = e => { if (self.keydownEvents) angular.forEach(self.keydownEvents, x => x(e)); };
        self.parent.render();

        // TODO: This makes no sense?
        self.editorEl.attr('blur', '');
        if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
          self.editorEl.attr('blur', '');
      },
      activate: function() {
        $timeout(() => {
          var elem = <HTMLFormElement>this.editorEl[0];
          $(elem).find('textarea[redactor]').redactor('core.getObject').focus.setStart();
        }, 0);
      }
    })
  ]);

  angular.module('xeditable').directive('sxEditableTextarea', [
    'editableLinkDirectiveFactory',
    editableDirectiveFactory => editableDirectiveFactory({
      directiveName: 'sxEditableTextarea',
      inputTpl: '<textarea></textarea>',
      addListeners: function() {
        var self = this;
        self.parent.addListeners.call(self);
        // submit textarea by ctrl+enter even with buttons
        if (self.single && self.buttons !== 'no') {
          self.autosubmit();
        }
      },
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('keydown', e => {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
            this.scope.$apply(() => {
              this.scope.$form.$submit();
            });
          }
        });
        if (self.attrs.blurSaves != undefined)
          self.inputEl.bind('blur', (e) => {
            self.scope.$apply(() => {
              self.scope.$form.$submit();
            });
          });
      },
      render: function() {
        var self = this;

        self.parent.render();

        self.editorEl.attr('blur', '');
        if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
          self.editorEl.attr('blur', '');
      },
      activate: () => {
        //var self = this;

        //setTimeout(function() {
        //    var elem = <HTMLFormElement>self.editorEl[0];
        //    $(elem).find(".wmd-input").focus();
        //}, 0);
      }
    })
  ]);

  //#endregion
  angular.module('xeditable').directive('editableMarkdownPreviewFirst', [
    'editableLinkDirectiveFactory',
    editableDirectiveFactory => editableDirectiveFactory({
      directiveName: 'editableMarkdownPreviewFirst',
      inputTpl: '<textarea sx-pagedown preview-first></textarea>',
      addListeners: function() {
        var self = this;
        self.parent.addListeners.call(self);
        // submit textarea by ctrl+enter even with buttons
        if (self.single && self.buttons !== 'no') {
          self.autosubmit();
        }
      },
      autosubmit: function() {
        var self = this;
        self.editorEl.bind('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
            self.scope.$apply(function() {
              self.scope.$form.$submit();
            });
          }
        });
        if (self.attrs.blurSaves != undefined)
          self.inputEl.bind('blur', (e) => {
            self.scope.$apply(() => {
              self.scope.$form.$submit();
            });
          });
      },
      render: function() {
        var self = this;

        self.parent.render();

        self.editorEl.attr('blur', '');
        if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
          self.editorEl.attr('blur', '');
      },
      activate: function() {
        //var self = this;

        //setTimeout(function () {
        //    var elem = <HTMLFormElement>self.editorEl[0];
        //    $(elem).find(".wmd-input").focus();
        //}, 0);
      }
    })
  ]);
  angular.module('xeditable').directive('editableTagAutoComplete', [
    'editableDirectiveFactory', '$parse',
    (editableDirectiveFactory, $parse) => {
      return editableDirectiveFactory({
        directiveName: 'editableTagAutoComplete',
        inputTpl: '<tags-input replace-spaces-with-dashes="false" min-tags="0" allow-leftover-text="false" enable-editing-last-tag="false"><auto-complete min-length="0" debounce-delay="500" display-property="text"></auto-complete></tags-input>',
        link: function(scope, elem, attrs, ctrl) {
          var self = this;

          scope.$watch('e-form', function(newValue, oldValue) {
            if (newValue)
              Debug.log("I see a data change!");
          }, true);

          self.parent.link(scope, elem, attrs, ctrl);
        },
        addListeners: function() {
          var self = this;
          self.parent.addListeners.call(self);
        },
        autosubmit: function() {
          var self = this;
          self.inputEl.bind('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
              self.scope.$apply(function() {
                self.scope.$form.$submit();
              });
            }
          });
          if (self.attrs.blurSaves != undefined)
            self.inputEl.bind('blur', (e) => {
              self.scope.$apply(() => {
                self.scope.$form.$submit();
              });
            });
        },
        render: function() {
          var self = this;
          var elem = <HTMLElement>angular.element(self.inputTpl)[0];
          var acNode = <HTMLElement>elem.childNodes[0];

          elem.setAttribute("on-tag-added", self.attrs.onTagAdded.replace("$data", "$tag"));
          acNode.setAttribute("source", self.attrs.source);

          if (self.attrs.inline != undefined) {
            elem.classList.add("hide-tags");
          }

          if (self.attrs.placeholder != undefined) {
            elem.setAttribute("placeholder", self.attrs.placeholder);
          }

          if (self.attrs.addFromAutocompleteOnly != undefined) {
            elem.setAttribute("add-from-autocomplete-only", self.attrs.addFromAutocompleteOnly);
          }

          if (self.attrs.loadOnFocus != undefined) {
            acNode.setAttribute("load-on-focus", self.attrs.loadOnFocus);
          }
          if (self.attrs.loadOnEmpty != undefined) {
            acNode.setAttribute("load-on-empty", self.attrs.loadOnEmpty);
          }
          if (self.attrs.maxResultsToShow != undefined) {
            acNode.setAttribute("max-results-to-show", self.attrs.maxResultsToShow);
          }


          if (self.attrs.displayProperty != undefined) {
            elem.setAttribute("display-property", self.attrs.displayProperty);
          } else {
            elem.setAttribute("display-property", "text");
          }

          self.scope.$data = $parse(self.attrs.tags)(self.scope);

          self.inputTpl = elem.outerHTML;

          self.parent.render();

          self.editorEl.attr('unsaved-warning-form', '');

          if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
            self.editorEl.attr('blur', '');

        },
        activate: function() {
          var self = this;

          setTimeout(function() {
            var elem = <HTMLFormElement>self.editorEl[0];
            $(elem).find(".tags").find("input.input").focus();
          }, 0);
        }
      });

    }
  ]);
  var types = 'text|email|tel|number|url|search|color|date|datetime|time|month|week'.split('|');

  //todo: datalist

  // generate directives
  angular.forEach(types, function(type) {
    var directiveName = 'sxEditable' + type.charAt(0).toUpperCase() + type.slice(1);
    angular.module('xeditable').directive(directiveName, [
      'editableLinkDirectiveFactory',
      function(editableDirectiveFactory) {
        return editableDirectiveFactory({
          directiveName: directiveName,
          inputTpl: '<input type="' + type + '">',
          autosubmit: function() {
            var self = this;
            if (self.attrs.blurSaves != undefined)
              self.inputEl.bind('blur', (e) => {
                self.scope.$apply(() => {
                  self.scope.$form.$submit();
                });
              });
          },
          render: function() {
            var self = this;

            self.parent.render();
            if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
              self.editorEl.attr('blur', '');
          }
        });
      }
    ]);
  });

  angular.module('xeditable').directive('sxEditableSelect', [
    'editableDirectiveFactory2',
    function(editableDirectiveFactory) {
      return editableDirectiveFactory({
        directiveName: 'sxEditableSelect',
        inputTpl: '<select></select>',
        autosubmit: function() {
          var self = this;
          self.inputEl.bind('change', (e) => {
            self.scope.$apply(() => {
              self.scope.$form.$submit();
            });
          });
          if (self.attrs.blurSaves != undefined)
            self.inputEl.bind('blur', (e) => {
              self.scope.$apply(() => {
                self.scope.$form.$submit();
              });
            });
        },
        render: function() {
          var self = this;

          self.parent.render();
          if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
            self.editorEl.attr('blur', '');
        }
      });
    }
  ]);

  //`range` is bit specific
  angular.module('xeditable').directive('sxEditableRange', [
    'editableLinkDirectiveFactory',
    function(editableDirectiveFactory) {
      return editableDirectiveFactory({
        directiveName: 'editableRange',
        inputTpl: '<input type="range" id="range" name="range">',
        autosubmit: function() {
          var self = this;
          if (self.attrs.blurSaves != undefined)
            self.inputEl.bind('blur', (e) => {
              self.scope.$apply(() => {
                self.scope.$form.$submit();
              });
            });
        },
        render: function() {
          var self = this;
          this.parent.render.call(this);
          this.inputEl.after('<output>{{$data}}</output>');
          if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
            self.editorEl.attr('blur', '');
        }
      });
    }
  ]);

  /*
editableFactory is used to generate editable directives (see `/directives` folder)
Inside it does several things:
- detect form for editable element. Form may be one of three types:
1. autogenerated form (for single editable elements)
2. wrapper form (element wrapped by <form> tag)
3. linked form (element has `e-form` attribute pointing to existing form)

- attach editableController to element

Depends on: editableController, editableFormFactory
*/
  angular.module('xeditable').factory('editableLinkDirectiveFactory',
    [
      '$parse', '$compile', 'editableThemes', '$rootScope', '$document', 'editableController2', 'editableFormController',
      ($parse, $compile, editableThemes, $rootScope, $document, editableController, editableFormController) => overwrites => {
        return {
          restrict: 'A',
          scope: {
            editing: '=',
            canEdit: '=',
            onaftersave: '@'
          },
          require: [overwrites.directiveName, '?^form'],
          controller: editableController,
          link: function(scope, elem, attrs, ctrl) {
            // editable controller
            var eCtrl = ctrl[0];

            // form controller
            var eFormCtrl;

            // this variable indicates is element is bound to some existing form,
            // or it's single element who's form will be generated automatically
            // By default consider single element without any linked form.ß
            var hasForm = false;

            // element wrapped by form
            if (ctrl[1]) {
              eFormCtrl = ctrl[1];
              hasForm = true;
            } else if (attrs.eForm) { // element not wrapped by <form>, but we hane `e-form` attr
              var getter = $parse(attrs.eForm)(scope);
              if (getter) { // form exists in scope (above), e.g. editable column
                eFormCtrl = getter;
                hasForm = true;
              } else { // form exists below or not exist at all: check document.forms
                for (var i = 0; i < $document[0].forms.length; i++) {
                  if ($document[0].forms[i].name === attrs.eForm) {
                    // form is below and not processed yet
                    eFormCtrl = null;
                    hasForm = true;
                    break;
                  }
                }
              }
            }

            /*
                    if(hasForm && !attrs.eName) {
                      throw new Error('You should provide `e-name` for editable element inside form!');
                    }
                    */

            //check for `editable-form` attr in form
            /*
                    if(eFormCtrl && ) {
                      throw new Error('You should provide `e-name` for editable element inside form!');
                    }
                    */

            // store original props to `parent` before merge
            angular.forEach(overwrites, function(v, k) {
              if (eCtrl[k] !== undefined) {
                eCtrl.parent[k] = eCtrl[k];
              }
            });

            // merge overwrites to base editable controller
            Object.assign(eCtrl, overwrites);

            // init editable ctrl
            eCtrl.init(!hasForm);

            // publich editable controller as `$editable` to be referenced in html
            scope.$editable = eCtrl;

            // add `editable` class to element
            elem.addClass('editable');
            if (attrs.canEdit) {
              scope.$watch("canEdit", (newValue, oldValue) => {
                if (newValue == oldValue)
                  return;
                if (newValue) {
                  elem.addClass('editable-click');
                } else {
                  elem.removeClass('editable-click');
                }

              }, true);
            }

            scope.$watch("editing", (newValue, oldValue) => {
              if (newValue == oldValue)
                return;
              if (newValue > oldValue) {
                scope.$form.$show();
              } else {
                scope.$form.$hide();
              }
            });

            // hasForm
            if (hasForm) {
              if (eFormCtrl) {
                scope.$form = eFormCtrl;
                if (!scope.$form.$addEditable) {
                  throw new Error('Form with editable elements should have `editable-form` attribute.');
                }
                scope.$form.$addEditable(eCtrl);
              } else {
                // future form (below): add editable controller to buffer and add to form later
                $rootScope.$$editableBuffer = $rootScope.$$editableBuffer || {};
                $rootScope.$$editableBuffer[attrs.eForm] = $rootScope.$$editableBuffer[attrs.eForm] || [];
                $rootScope.$$editableBuffer[attrs.eForm].push(eCtrl);
                scope.$form = null; //will be re-assigned later
              }
              // !hasForm
            } else {
              // create editableform controller
              scope.$form = editableFormController();
              // add self to editable controller
              scope.$form.$addEditable(eCtrl);

              // if `e-form` provided, publish local $form in scope
              if (attrs.eForm) {
                scope.$parent[attrs.eForm] = scope.$form;
              }
              if (attrs.canEdit) {
                if (scope.canEdit)
                  elem.addClass('editable-click');

                elem.bind('click', function(e) {
                  if (!scope.canEdit) {
                    return;
                  }
                  e.preventDefault();
                  e.editable = eCtrl;
                  scope.$apply(function() {
                    scope.$form.$show();
                  });
                });
              } else {
                elem.addClass('editable-click');
                elem.bind('click', function(e) {
                  e.preventDefault();
                  e.editable = eCtrl;
                  scope.$apply(function() {
                    scope.$form.$show();
                  });
                });
              }
              if (attrs.editing && scope.editing > 0) {
                //scope.$apply(function () {
                scope.$form.$show();
                //});
              }
            }

          }
        };
      }
    ]); //directive object

  /*
editableFactory is used to generate editable directives (see `/directives` folder)
Inside it does several things:
- detect form for editable element. Form may be one of three types:
1. autogenerated form (for single editable elements)
2. wrapper form (element wrapped by <form> tag)
3. linked form (element has `e-form` attribute pointing to existing form)
- attach editableController to element
Depends on: editableController, editableFormFactory
*/
  angular.module('xeditable').factory('editableDirectiveFactory2',
    [
      '$parse', '$compile', 'editableThemes', '$rootScope', '$document', 'editableController2', 'editableFormController', 'editableOptions',
      function($parse, $compile, editableThemes, $rootScope, $document, editableController, editableFormController, editableOptions) {

        //directive object
        return function(overwrites) {
          return {
            restrict: 'A',
            scope: {
              editing: '=',
              canEdit: '=',
              onaftersave: '@',
              eNgOptions: '@'
            },
            require: [overwrites.directiveName, '?^form'],
            controller: editableController,
            link: function(scope, elem, attrs, ctrl) {
              // editable controller
              var eCtrl = ctrl[0];

              // form controller
              var eFormCtrl;

              // this variable indicates is element is bound to some existing form,
              // or it's single element who's form will be generated automatically
              // By default consider single element without any linked form.ß
              var hasForm = false;

              // element wrapped by form
              if (ctrl[1]) {
                eFormCtrl = ctrl[1];
                hasForm = true;
              } else if (attrs.eForm) { // element not wrapped by <form>, but we hane `e-form` attr
                var getter = $parse(attrs.eForm)(scope);
                if (getter) { // form exists in scope (above), e.g. editable column
                  eFormCtrl = getter;
                  hasForm = true;
                } else { // form exists below or not exist at all: check document.forms
                  for (var i = 0; i < $document[0].forms.length; i++) {
                    if ($document[0].forms[i].name === attrs.eForm) {
                      // form is below and not processed yet
                      eFormCtrl = null;
                      hasForm = true;
                      break;
                    }
                  }
                }
              }

              /*
                  if(hasForm && !attrs.eName) {
                    throw 'You should provide `e-name` for editable element inside form!';
                  }
                  */

              //check for `editable-form` attr in form
              /*
                  if(eFormCtrl && ) {
                    throw 'You should provide `e-name` for editable element inside form!';
                  }
                  */

              // store original props to `parent` before merge
              angular.forEach(overwrites, function(v, k) {
                if (eCtrl[k] !== undefined) {
                  eCtrl.parent[k] = eCtrl[k];
                }
              });

              // merge overwrites to base editable controller
              Object.assign(eCtrl, overwrites);

              // x-editable can be disabled using editableOption or edit-disabled attribute
              var disabled = angular.isDefined(attrs.editDisabled) ?
                scope.$eval(attrs.editDisabled) :
                editableOptions.isDisabled;

              if (disabled) {
                return;
              }

              // init editable ctrl
              eCtrl.init(!hasForm);

              // publich editable controller as `$editable` to be referenced in html
              scope.$editable = eCtrl;

              // add `editable` class to element
              elem.addClass('editable');
              if (attrs.canEdit) {
                scope.$watch("canEdit", (newValue, oldValue) => {
                  if (newValue == oldValue)
                    return;
                  if (newValue) {
                    elem.addClass('editable-click');
                  } else {
                    elem.removeClass('editable-click');
                  }

                }, true);
              }
              scope.$watch("editing", (newValue, oldValue) => {
                if (newValue == oldValue)
                  return;
                if (newValue > oldValue) {
                  scope.$form.$show();
                } else {
                  scope.$form.$hide();
                }
              });

              // hasForm
              if (hasForm) {
                if (eFormCtrl) {
                  scope.$form = eFormCtrl;
                  if (!scope.$form.$addEditable) {
                    throw 'Form with editable elements should have `editable-form` attribute.';
                  }
                  scope.$form.$addEditable(eCtrl);
                } else {
                  // future form (below): add editable controller to buffer and add to form later
                  $rootScope.$$editableBuffer = $rootScope.$$editableBuffer || {};
                  $rootScope.$$editableBuffer[attrs.eForm] = $rootScope.$$editableBuffer[attrs.eForm] || [];
                  $rootScope.$$editableBuffer[attrs.eForm].push(eCtrl);
                  scope.$form = null; //will be re-assigned later
                }
                // !hasForm
              } else {
                // create editableform controller
                scope.$form = editableFormController();
                // add self to editable controller
                scope.$form.$addEditable(eCtrl);

                // if `e-form` provided, publish local $form in scope
                if (attrs.eForm) {
                  scope.$parent[attrs.eForm] = scope.$form;
                }

                if (attrs.canEdit) {
                  if (scope.canEdit)
                    elem.addClass('editable-click');

                  elem.bind('click', function(e) {
                    if (!scope.canEdit) {
                      return;
                    }
                    e.preventDefault();
                    e.editable = eCtrl;
                    scope.$apply(function() {
                      scope.$form.$show();
                    });
                  });
                } else {
                  elem.addClass('editable-click');
                  elem.bind('click', function(e) {
                    e.preventDefault();
                    e.editable = eCtrl;
                    scope.$apply(function() {
                      scope.$form.$show();
                    });
                  });
                }
                if (attrs.editing && scope.editing > 0) {
                  //scope.$apply(function () {
                  scope.$form.$show();
                  //});
                }

                //// bind click - if no external form defined
                //if (!attrs.eForm || attrs.eClickable) {
                //    elem.addClass('editable-click');
                //    elem.bind(editableOptions.activationEvent, function (e) {
                //        e.preventDefault();
                //        e.editable = eCtrl;
                //        scope.$apply(function () {
                //            scope.$form.$show();
                //        });
                //    });
                //}
              }

            }
          };
        };
      }
    ]);

  export class ForwardService {
    static $name = 'ForwardService';
    static $inject = ['$window', '$location', 'w6'];

    constructor(private $window: ng.IWindowService, private $location: ng.ILocationService, private w6: W6) { }

    public forward(url) {
      var fullUrl = this.$location.protocol() + ":" + url;
      this.forwardNaked(fullUrl);
    }

    public reload() {
      Debug.log("reloading url");
      this.$window.location.reload(true);
    }

    public forwardNaked(fullUrl) {
      Debug.log("changing URL: " + fullUrl);
      this.$window.location.href = fullUrl;
    }


    // TODO: This should rather be a task of the router...
    // e.g; add annotations to the router, and enable a default resolve on all routes to enforce it, or check on a route change etc
    // or different?
    public forceSsl() {
      if (!this.isSsl())
        throw new Tools.RequireSslException("This page requires SSL");
    }

    public forceNonSsl() {
      if (this.isSsl())
        throw new Tools.RequireNonSslException("This page requires non-SSL");
    }

    public forceSslIfPremium() {
      if (this.w6.userInfo.isPremium)
        this.forceSsl();
    }

    public forceNonSslUnlessPremium() {
      if (!this.w6.userInfo.isPremium)
        this.forceNonSsl();
    }

    public handleSsl() {
      if (this.w6.userInfo.isPremium)
        this.forceSsl();
      else
        this.forceNonSsl();
    }

    public requireSsl() {
      if (!this.isSsl()) {
        this.switchToSsl();
        return true;
      }
      return false;
    }

    public requireNonSsl() {
      if (this.isSsl()) {
        this.switchToNonSsl();
        return true;
      }
      return false;
    }

    public switchToSsl() {
      this.$window.location.href = this.$location.absUrl().replace('http', 'https').replace(":9000", ":9001");
    }


    public switchToNonSsl() {
      this.$window.location.href = this.$location.absUrl().replace('https', 'http').replace(":9001", ":9000");
    }

    public isSsl(): boolean {
      return this.$location.protocol() == 'https';
    }
  }

  registerService(ForwardService);

  /**!
* AngularJS file upload/drop directive and service with progress and abort
* @author  Danial  <danial.farid@gmail.com>
* @version 4.2.4
*/
  (function() {

    var key, i;

    function patchXHR(fnName, newFn) {
      (<any>window).XMLHttpRequest.prototype[fnName] = newFn((<any>window).XMLHttpRequest.prototype[fnName]);
    }

    if ((<any>window).XMLHttpRequest && !(<any>window).XMLHttpRequest.__isFileAPIShim) {
      patchXHR('setRequestHeader', function(orig) {
        return function(header, value) {
          if (header === '__setXHR_') {
            var val = value(this);
            // fix for angular < 1.2.0
            if (val instanceof Function) {
              val(this);
            }
          } else {
            orig.apply(this, arguments);
          }
        };
      });
    }

    var ngFileUpload = angular.module('ngFileUpload2', []);

    (<any>ngFileUpload).version = '4.2.4';
    ngFileUpload.service('Upload', [
      '$http', '$q', '$timeout', function($http, $q, $timeout) {
        function sendHttp(config) {
          config.method = config.method || 'POST';
          config.headers = config.headers || {};
          config.transformRequest = config.transformRequest || function(data, headersGetter) {
            if ((<any>window).ArrayBuffer && data instanceof (<any>window).ArrayBuffer) {
              return data;
            }
            return $http.defaults.transformRequest[0](data, headersGetter);
          };
          var deferred = $q.defer();
          var promise = deferred.promise;

          config.headers['__setXHR_'] = function() {
            return function(xhr) {
              if (!xhr) return;
              config.__XHR = xhr;
              config.xhrFn && config.xhrFn(xhr);
              xhr.upload.addEventListener('progress', function(e) {
                e.config = config;
                deferred.notify ? deferred.notify(e) : promise.progress_fn && $timeout(function() {
                  promise.progress_fn(e);
                });
              }, false);
              //fix for firefox not firing upload progress end, also IE8-9
              xhr.upload.addEventListener('load', function(e) {
                if (e.lengthComputable) {
                  e.config = config;
                  deferred.notify ? deferred.notify(e) : promise.progress_fn && $timeout(function() {
                    promise.progress_fn(e);
                  });
                }
              }, false);
            };
          };

          $http(config).then(function(r) {
            deferred.resolve(r);
          }, function(e) {
            deferred.reject(e);
          }, function(n) {
            deferred.notify(n);
          });

          promise.success = function(fn) {
            promise.then(function(response) {
              fn(response.data, response.status, response.headers, config);
            });
            return promise;
          };

          promise.error = function(fn) {
            promise.then(null, function(response) {
              fn(response.data, response.status, response.headers, config);
            });
            return promise;
          };

          promise.progress = function(fn) {
            promise.progress_fn = fn;
            promise.then(null, null, function(update) {
              fn(update);
            });
            return promise;
          };
          promise.abort = function() {
            if (config.__XHR) {
              $timeout(function() {
                config.__XHR.abort();
              });
            }
            return promise;
          };
          promise.xhr = function(fn) {
            config.xhrFn = (function(origXhrFn) {
              return function() {
                origXhrFn && origXhrFn.apply(promise, arguments);
                fn.apply(promise, arguments);
              };
            })(config.xhrFn);
            return promise;
          };

          return promise;
        }

        this.upload = function(config) {
          config.headers = config.headers || {};
          config.headers['Content-Type'] = undefined;
          config.transformRequest = config.transformRequest ?
            (angular.isArray(config.transformRequest) ?
              config.transformRequest : [config.transformRequest]) : [];
          config.transformRequest.push(function(data) {
            var formData = new FormData();
            var allFields = {};
            for (key in config.fields) {
              if (config.fields.hasOwnProperty(key)) {
                allFields[key] = config.fields[key];
              }
            }
            if (data) allFields['data'] = data;

            if (config.formDataAppender) {
              for (key in allFields) {
                if (allFields.hasOwnProperty(key)) {
                  config.formDataAppender(formData, key, allFields[key]);
                }
              }
            } else {
              for (key in allFields) {
                if (allFields.hasOwnProperty(key)) {
                  var val = allFields[key];
                  if (val !== undefined) {
                    if (angular.isDate(val)) {
                      val = val.toISOString();
                    }
                    if (angular.isString(val)) {
                      formData.append(key, val);
                    } else {
                      if (config.sendObjectsAsJsonBlob && angular.isObject(val)) {
                        formData.append(key, new Blob([val], { type: 'application/json' }));
                      } else {
                        formData.append(key, JSON.stringify(val));
                      }
                    }

                  }
                }
              }
            }

            if (config.file != null) {
              var fileFormName = config.fileFormDataName || 'file';

              if (angular.isArray(config.file)) {
                var isFileFormNameString = angular.isString(fileFormName);
                for (var i = 0; i < config.file.length; i++) {
                  formData.append(isFileFormNameString ? fileFormName : fileFormName[i], config.file[i],
                    (config.fileName && config.fileName[i]) || config.file[i].name);
                }
              } else {
                formData.append(fileFormName, config.file, config.fileName || config.file.name);
              }
            }
            return formData;
          });

          return sendHttp(config);
        };

        this.http = function(config) {
          return sendHttp(config);
        };
      }
    ]);

    ngFileUpload.directive('ngfSelect2', [
      '$parse', '$timeout', '$compile',
      function($parse, $timeout, $compile) {
        return {
          restrict: 'AEC',
          require: '?ngModel',
          link: function(scope, elem, attr, ngModel) {
            linkFileSelect(scope, elem, attr, ngModel, $parse, $timeout, $compile);
          }
        };
      }
    ]);

    function linkFileSelect(scope, elem, attr, ngModel, $parse, $timeout, $compile) {
      if (elem.attr('__ngf_gen__')) {
        return;
      }

      function isInputTypeFile() {
        return elem[0].tagName.toLowerCase() === 'input' && elem.attr('type') && elem.attr('type').toLowerCase() === 'file';
      }

      var isUpdating = false;

      function changeFn(evt) {
        if (!isUpdating) {
          isUpdating = true;
          try {
            var fileList = evt.__files_ || (evt.target && evt.target.files);
            var files = [], rejFiles = [];

            for (var i = 0; i < fileList.length; i++) {
              var file = fileList.item(i);
              if (validate(scope, $parse, attr, file, evt)) {
                files.push(file);
              } else {
                rejFiles.push(file);
              }
            }
            updateModel($parse, $timeout, scope, ngModel, attr, attr.ngfChange || attr.ngfSelect, files, rejFiles, evt, null);
            if (files.length == 0) evt.target.value = files;
            //                if (evt.target && evt.target.getAttribute('__ngf_gen__')) {
            //                    angular.element(evt.target).remove();
            //                }
          } finally {
            isUpdating = false;
          }
        }
      }

      function bindAttrToFileInput(fileElem) {
        if (attr.ngfMultiple) fileElem.attr('multiple', $parse(attr.ngfMultiple)(scope));
        if (!$parse(attr.ngfMultiple)(scope)) fileElem.attr('multiple', undefined);
        if (attr['accept']) fileElem.attr('accept', attr['accept']);
        if (attr.ngfCapture) fileElem.attr('capture', $parse(attr.ngfCapture)(scope));
        //        if (attr.ngDisabled) fileElem.attr('disabled', $parse(attr.disabled)(scope));
        for (var i = 0; i < elem[0].attributes.length; i++) {
          var attribute = elem[0].attributes[i];
          if ((isInputTypeFile() && attribute.name !== 'type')
            || (attribute.name !== 'type' && attribute.name !== 'class' &&
              attribute.name !== 'id' && attribute.name !== 'style')) {
            fileElem.attr(attribute.name, attribute.value);
          }
        }
      }

      function createFileInput(evt) {
        if (elem.attr('disabled')) {
          return;
        }
        var fileElem = angular.element('<input type="file">');
        bindAttrToFileInput(fileElem);

        if (isInputTypeFile()) {
          elem.replaceWith(fileElem);
          elem = fileElem;
          fileElem.attr('__ngf_gen__', <any>true);
          $compile(elem)(scope);
        } else {
          fileElem.css('visibility', 'hidden').css('position', 'absolute')
            .css('width', '1').css('height', '1').css('z-index', '-100000')
            .attr('tabindex', '-1');
          if (elem.__ngf_ref_elem__) {
            elem.__ngf_ref_elem__.remove();
          }
          elem.__ngf_ref_elem__ = fileElem;
          document.body.appendChild(fileElem[0]);
        }

        return fileElem;
      }

      function resetModel(evt) {
        updateModel($parse, $timeout, scope, ngModel, attr, attr.ngfChange || attr.ngfSelect, [], [], evt, true);
      }

      function clickHandler(evt) {
        if (evt != null) {
          evt.preventDefault();
          evt.stopPropagation();
        }
        var fileElem = createFileInput(evt);
        if (fileElem) {
          fileElem.bind('change', changeFn);
          if (evt) {
            resetModel(evt);
          }

          function clickAndAssign(evt) {
            if (evt != null) {
              fileElem[0].click();
            }
            if (isInputTypeFile()) {
              elem.bind('click touchend', clickHandler);
            }
          }

          // fix for android native browser
          if (navigator.userAgent.toLowerCase().match(/android/)) {
            setTimeout(function() {
              clickAndAssign(evt);
            }, 0);
          } else {
            clickAndAssign(evt);
          }
        }
        return false;
      }

      if ((<any>window).FileAPI && (<any>window).FileAPI.ngfFixIE) {
        (<any>window).FileAPI.ngfFixIE(elem, createFileInput, bindAttrToFileInput, changeFn, resetModel);
      } else {
        clickHandler(null);
        if (!isInputTypeFile()) {
          elem.bind('click touchend', clickHandler);
        }
      }
    }

    ngFileUpload.directive('ngfDrop2', [
      '$parse', '$timeout', '$location', function($parse, $timeout, $location) {
        return {
          restrict: 'AEC',
          require: '?ngModel',
          link: function(scope, elem, attr, ngModel) {
            linkDrop(scope, elem, attr, ngModel, $parse, $timeout, $location);
          }
        };
      }
    ]);

    ngFileUpload.directive('ngfNoFileDrop2', function() {
      return function(scope, elem) {
        if (dropAvailable()) elem.css('display', 'none');
      };
    });

    ngFileUpload.directive('ngfDropAvailable2', [
      '$parse', '$timeout', function($parse, $timeout) {
        return function(scope, elem, attr) {
          if (dropAvailable()) {
            var fn = $parse(attr.ngfDropAvailable);
            $timeout(function() {
              fn(scope);
              if (fn.assign) {
                fn.assign(scope, true);
              }
            });
          }
        };
      }
    ]);

    function linkDrop(scope, elem, attr, ngModel, $parse, $timeout, $location) {
      var available = dropAvailable();
      if (attr.dropAvailable) {
        $timeout(function() {
          scope[attr.dropAvailable] ? scope[attr.dropAvailable].value = available : scope[attr.dropAvailable] = available;
        });
      }
      if (!available) {
        if ($parse(attr.ngfHideOnDropNotAvailable)(scope) == true) {
          elem.css('display', 'none');
        }
        return;
      }
      var leaveTimeout = null;
      var stopPropagation = $parse(attr.ngfStopPropagation);
      var dragOverDelay = 1;
      var accept = $parse(attr.ngfAccept);
      var actualDragOverClass;

      elem[0].addEventListener('dragover', function(evt) {
        if (elem.attr('disabled')) return;
        evt.preventDefault();
        if (stopPropagation(scope)) evt.stopPropagation();
        // handling dragover events from the Chrome download bar
        if (navigator.userAgent.indexOf("Chrome") > -1) {
          var b = evt.dataTransfer.effectAllowed;
          evt.dataTransfer.dropEffect = ('move' === b || 'linkMove' === b) ? 'move' : 'copy';
        }
        $timeout.cancel(leaveTimeout);
        if (!scope.actualDragOverClass) {
          actualDragOverClass = calculateDragOverClass(scope, attr, evt);
        }
        elem.addClass(actualDragOverClass);
      }, false);
      elem[0].addEventListener('dragenter', function(evt) {
        if (elem.attr('disabled')) return;
        evt.preventDefault();
        if (stopPropagation(scope)) evt.stopPropagation();
      }, false);
      elem[0].addEventListener('dragleave', function() {
        if (elem.attr('disabled')) return;
        leaveTimeout = $timeout(function() {
          elem.removeClass(actualDragOverClass);
          actualDragOverClass = null;
        }, dragOverDelay || 1);
      }, false);
      elem[0].addEventListener('drop', function(evt) {
        if (elem.attr('disabled')) return;
        evt.preventDefault();
        if (stopPropagation(scope)) evt.stopPropagation();
        elem.removeClass(actualDragOverClass);
        actualDragOverClass = null;
        extractFiles(evt, function(files, rejFiles) {
          updateModel($parse, $timeout, scope, ngModel, attr,
            attr.ngfChange || attr.ngfDrop, files, rejFiles, evt, null);
        }, $parse(attr.ngfAllowDir)(scope) != false, attr.multiple || $parse(attr.ngfMultiple)(scope));
      }, false);

      function calculateDragOverClass(scope, attr, evt) {
        var accepted = true;
        var items = evt.dataTransfer.items;
        if (items != null) {
          for (var i = 0; i < items.length && accepted; i++) {
            accepted = accepted
              && (items[i].kind == 'file' || items[i].kind == '')
              && validate(scope, $parse, attr, items[i], evt);
          }
        }
        var clazz = $parse(attr.ngfDragOverClass)(scope, { $event: evt });
        if (clazz) {
          if (clazz.delay) dragOverDelay = clazz.delay;
          if (clazz.accept) clazz = accepted ? clazz.accept : clazz.reject;
        }
        return clazz || attr.ngfDragOverClass || 'dragover';
      }

      function extractFiles(evt, callback, allowDir, multiple) {
        var files = [], rejFiles = [], items = evt.dataTransfer.items, processing = 0;

        function addFile(file) {
          if (validate(scope, $parse, attr, file, evt)) {
            files.push(file);
          } else {
            rejFiles.push(file);
          }
        }

        if (items && items.length > 0 && $location.protocol() != 'file') {
          var f2 = evt.dataTransfer.getData('text/uri-list');

          if (f2 != null && f2 != "") {
            addFile(f2);
          }

          for (var i = 0; i < items.length; i++) {
            if (items[i].webkitGetAsEntry && items[i].webkitGetAsEntry() && items[i].webkitGetAsEntry().isDirectory) {
              var entry = items[i].webkitGetAsEntry();
              if (entry.isDirectory && !allowDir) {
                continue;
              }
              if (entry != null) {
                traverseFileTree(files, entry, null);
              }
            } else {
              var f = items[i].getAsFile();
              if (f != null) addFile(f);
            }
            if (!multiple && files.length > 0) break;
          }
        } else {
          var fileList = evt.dataTransfer.files;
          if (fileList != null) {
            for (var i = 0; i < fileList.length; i++) {
              addFile(fileList.item(i));
              if (!multiple && files.length > 0) break;
            }
          }
        }
        var delays = 0;
        (function waitForProcess(delay) {
          $timeout(function() {
            if (!processing) {
              if (!multiple && files.length > 1) {
                i = 0;
                while (files[i].type == 'directory') i++;
                files = [files[i]];
              }
              callback(files, rejFiles);
            } else {
              if (delays++ * 10 < 20 * 1000) {
                waitForProcess(10);
              }
            }
          }, delay || 0);
        })(null);

        function traverseFileTree(files, entry, path) {
          if (entry != null) {
            if (entry.isDirectory) {
              var filePath = (path || '') + entry.name;
              addFile({ name: entry.name, type: 'directory', path: filePath });
              var dirReader = entry.createReader();
              var entries = [];
              processing++;
              var readEntries = function() {
                dirReader.readEntries(function(results) {
                  try {
                    if (!results.length) {
                      for (var i = 0; i < entries.length; i++) {
                        traverseFileTree(files, entries[i], (path ? path : '') + entry.name + '/');
                      }
                      processing--;
                    } else {
                      entries = entries.concat(Array.prototype.slice.call(results || [], 0));
                      readEntries();
                    }
                  } catch (e) {
                    processing--;
                    Tools.Debug.error(e);
                  }
                }, function() {
                  processing--;
                });
              };
              readEntries();
            } else {
              processing++;
              entry.file(function(file) {
                try {
                  processing--;
                  file.path = (path ? path : '') + file.name;
                  addFile(file);
                } catch (e) {
                  processing--;
                  Tools.Debug.error(e);
                }
              }, function() {
                processing--;
              });
            }
          }
        }
      }
    }

    ngFileUpload.directive('ngfSrc2', [
      '$parse', '$timeout', function($parse, $timeout) {
        return {
          restrict: 'AE',
          link: function(scope, elem, attr, file) {
            if ((<any>window).FileReader) {
              scope.$watch(attr.ngfSrc, function(file) {
                if (file &&
                  validate(scope, $parse, attr, file, null) &&
                  (!(<any>window).FileAPI || navigator.userAgent.indexOf('MSIE 8') === -1 || file.size < 20000) &&
                  (!(<any>window).FileAPI || navigator.userAgent.indexOf('MSIE 9') === -1 || file.size < 4000000)) {
                  $timeout(function() {
                    //prefer URL.createObjectURL for handling refrences to files of all sizes
                    //since it doesn´t build a large string in memory
                    var URL = (<any>window).URL || (<any>window).webkitURL;
                    if (URL && URL.createObjectURL) {
                      elem.attr('src', URL.createObjectURL(file));
                    } else {
                      var fileReader = new FileReader();
                      fileReader.readAsDataURL(file);
                      fileReader.onload = function(e) {
                        $timeout(function() {
                          elem.attr('src', (<any>e).target.result);
                        });
                      };
                    }
                  });
                } else {
                  elem.attr('src', attr.ngfDefaultSrc || '');
                }
              });
            }
          }
        };
      }
    ]);

    function dropAvailable() {
      var div = document.createElement('div');
      return ('draggable' in div) && ('ondrop' in div);
    }

    function updateModel($parse, $timeout, scope, ngModel, attr, fileChange, files, rejFiles, evt, noDelay) {
      function update() {
        if (ngModel) {
          $parse(attr.ngModel).assign(scope, files);
          $timeout(function() {
            ngModel && ngModel.$setViewValue(files != null && files.length == 0 ? null : files);
          });
        }
        if (attr.ngModelRejected) {
          $parse(attr.ngModelRejected).assign(scope, rejFiles);
        }
        if (fileChange) {
          $parse(fileChange)(scope, {
            $files: files,
            $rejectedFiles: rejFiles,
            $event: evt
          });

        }
      }

      if (noDelay) {
        update();
      } else {
        $timeout(function() {
          update();
        });
      }
    }

    function validate(scope, $parse, attr, file, evt) {
      var accept = $parse(attr.ngfAccept)(scope, { $file: file, $event: evt });
      var fileSizeMax = $parse(attr.ngfMaxSize)(scope, { $file: file, $event: evt }) || 9007199254740991;
      var fileSizeMin = $parse(attr.ngfMinSize)(scope, { $file: file, $event: evt }) || -1;
      if (accept != null && angular.isString(accept)) {
        var regexp = new RegExp(globStringToRegex(accept), 'gi');
        accept = (file.type != null && regexp.test(file.type.toLowerCase())) ||
          (file.name != null && regexp.test(file.name.toLowerCase()));
      }
      return (accept == null || accept) && (file.size == null || (file.size < fileSizeMax && file.size > fileSizeMin));
    }

    function globStringToRegex(str) {
      if (str.length > 2 && str[0] === '/' && str[str.length - 1] === '/') {
        return str.substring(1, str.length - 1);
      }
      var split = str.split(','), result = '';
      if (split.length > 1) {
        for (var i = 0; i < split.length; i++) {
          result += '(' + globStringToRegex(split[i]) + ')';
          if (i < split.length - 1) {
            result += '|';
          }
        }
      } else {
        if (str.indexOf('.') == 0) {
          str = '*' + str;
        }
        result = '^' + str.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + '-]', 'g'), '\\$&') + '$';
        result = result.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
      }
      return result;
    }

  })();

  class FiltersComponent extends Tk.Module {
    static $name = "FiltersComponentModule";

    constructor() {
      super('Components.Filters', []);

      this.app.filter('uppercaseFirst', () => (val: string) => val ? val.toUpperCaseFirst() : val)
        .filter('lowercaseFirst', () => (val: string) => val ? val.toLowerCaseFirst() : val)
        // TODO: Dedup; this does pretty much the same as the bytes filter!
        .filter('amount', () => count => window.w6Cheat.converters.amount.toView(count))
        .filter('speed', () => (size, format, includeMarkup = true) => window.w6Cheat.converters.speed.toView(size, format, includeMarkup))
        .filter('size', () => (size, format, includeMarkup = true) => window.w6Cheat.converters.size.toView(size, format, includeMarkup))
        .filter('accounting', () => (nmb, currencyCode) => {
          var currency = {
            USD: "$",
            GBP: "£",
            AUD: "$",
            EUR: "€",
            CAD: "$",
            MIXED: "~"
          },
            thousand,
            decimal,
            format;
          if ($.inArray(currencyCode, ["USD", "AUD", "CAD", "MIXED"]) >= 0) {
            thousand = ",";
            decimal = ".";
            format = "%s %v";
          } else {
            thousand = ".";
            decimal = ",";
            format = "%s %v";
          };
          return accounting.formatMoney(nmb, currency[currencyCode], 2, thousand, decimal, format);
        })
        .filter('pagedown', () => (input, htmlSafe?) => {
          if (input == null) return input;
          // TODO: Markdown is not rendered the same here in JS as in the backend, support for following seems lacking:
          // - AutoNewLines
          // - StrictBoldItalic
          // - EncodeProblemUrlCharacters
          // One way to solve it would be to have a markdown web api endpoint on the server which renders markdown input into html output?
          var converter = htmlSafe ? new Markdown.Converter() : Markdown.getSanitizingConverter();
          return converter.makeHtml(input);
        })
        .filter('htmlToPlaintext', () => text => String(text).replace(/<[^>]+>/gm, ''))
        .filter('htmlToPlaintext2', () => text => angular.element('<span>' + text + '</span>').text())
        // For some reason htmlSafe switch not working on main pagedown directive??
        .filter('pagedownSafe', () => (input) => {
          if (input == null) return input;
          var converter = new Markdown.Converter();
          return converter.makeHtml(input);
        })
        .filter('commentfilter', () => (input: any[]) => !input ? input : input.asEnumerable().where(x => !x.replyToId).toArray())
        .filter('deletedfilter', () => (input: IBreezeModMediaItem[], mod: IBreezeMod) => {
          if (!input || input.length == 0 || mod == null) return [];
          return input.asEnumerable().where(x => x.modId == mod.id && x.entityAspect.entityState.isDeleted()).toArray()
        })
        .filter('unsafe', ['$sce', function($sce) { return $sce.trustAsHtml; }])
        .filter('monthName', [
          () => monthNumber => { //1 = January
            var monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return monthNames[monthNumber - 1];
          }
        ]);
    }
  }

  var app = new FiltersComponent();

  class Debounce {
    static $name = 'debounce';
    static $inject = ['$timeout'];
    static factory = getFactory(Debounce.$inject, ($timeout) => new Debounce($timeout).create);

    constructor(private $timeout) { }

    public create = (callback, interval) => {
      var timeout = null;
      return () => {
        this.$timeout.cancel(timeout);
        timeout = this.$timeout(callback, interval);
      };
    };
  }

  angular.module('Components.Debounce', [])
    .factory(Debounce.$name, Debounce.factory);
}

export module MyApp.Components.AccountCard {
  angular.module('Components.AccountCard', []);
}
export module MyApp.Components.AccountCard {

  class AccountCardDirectiveController {
    static $inject = ['$scope', '$element', '$attrs', '$transclude', '$rootScope'];
    static viewBase = '/src_legacy/app/components/account-card';

    constructor($scope, $element, $attrs, $transclude, $rootScope) {
    }
  }

  class AccountCardDirective extends Tk.Directive {
    static $name = 'sxAccountCard';
    static $inject = [];
    static factory = getFactory(AccountCardDirective.$inject, () => new AccountCardDirective());

    controller = AccountCardDirectiveController;
    templateUrl = AccountCardDirectiveController.viewBase + '/index.html';
    transclude = true;
    restrict = 'E';
    scope = {
      account: '=',
    };
  }

  angular.module('Components.AccountCard')
    .directive(AccountCardDirective.$name, AccountCardDirective.factory);
}
export module MyApp.Components.BackImg {
  class BackImageDirective extends Tk.Directive {
    static $name = 'sxBackImg';
    static factory = getFactory(['w6'], w6 => new BackImageDirective(w6));

    constructor(private w6: W6) { super(); }

    restrict = 'A';
    link = (scope, element, attrs) => {
      scope.getImage = this.getImage;
      attrs.$observe(BackImageDirective.$name, value => {
        element.css({
          'background-image': 'url(' + value + ')'
        });
      });
    }; // TODO: rather user sx-default-img attr instead?
    public getImage = (img: string, updatedAt?: Date): string => {
      if (!img || img == "")
        return this.w6.url.cdn + "/img/noimage.png";
      return img.startsWith("http") || img.startsWith("//") ? img : this.w6.url.getUsercontentUrl(img, updatedAt);
    };
  }

  angular.module('Components.BackImg', [])
    .directive(BackImageDirective.$name, BackImageDirective.factory);
}
export module MyApp.Components.Basket {
  export enum BasketItemType {
    Mod,
    Mission,
    Collection,
  }

  export interface IBasketItem {
    id: string;
    name: string;
    packageName: string;
    image: string;
    author: string;
    itemType: BasketItemType;
    constraint?: string;
    isOnlineCollection?: boolean;
    gameId: string;
    sizePacked: number;
  }

  export interface IBasketCollection {
    id: string;
    gameId: string;
    name: string;
    collectionId?: string;
    changed?: boolean;
    state: BasketState;
    items: IBasketItem[];
    isPersistent: boolean;
    isTemporary: boolean;
    basketType: BasketType;
  }

  export interface IBasketModel {
    collections: IBasketCollection[];
    activeId: string;
  }

  export interface IBaskets {
    gameBaskets: _Indexer<IBasketModel>;
  }

  export enum BasketState {
    Unknown = 0,
    Install = 1,
    Syncing = 2,
    Update = 3,
    Launch = 4
  }
  export enum BasketType {
    Default = 0,
    SingleItem = 1,
    SingleCollection = 2,
  }

  export interface IBasketSettings {
    hasConnected: boolean;
  }
  export interface IBasketScope extends ng.IScope {
    settings: IBasketSettings;
    baskets: IBaskets;
  }

  export class BasketService extends Tk.Service {
    static $name = "basketService";
    static $inject = ['localStorageService', 'logger', '$rootScope', 'modInfoService'];
    private baskets: IBaskets;
    private scope: IBasketScope;
    public settings: IBasketSettings;
    private constructedBaskets: _Indexer<any> = {};
    lastActiveItem: string;

    constructor(private localStorage: angular.local.storage.ILocalStorageService, public logger: Logger.ToastLogger, root: IRootScope, private modInfo) {
      super();
      this.scope = <any>root.$new(true);

      this.refresh();

      this.setDefaults();
    }

    refresh() { this.setupBindings(this.localStorage); }

    abort(gameId: string) { return this.modInfo.abort(gameId); };

    private setDefaults() {
      if (this.settings.hasConnected == null) {
        this.settings.hasConnected = false;
      }
    }

    private createLocalBaskets(): IBaskets {
      return {
        gameBaskets: {},
      };
    }

    addToBasket(gameId: string, item: IBasketItem) {
      var baskets = this.getGameBaskets(gameId);
      baskets.active.toggleInBasket(Object.assign({ gameId: gameId }, item));
    }

    getGameBaskets(gameId: string) {
      if (this.constructedBaskets[gameId] != null) return this.constructedBaskets[gameId];

      if (this.baskets.gameBaskets[gameId] == null) this.baskets.gameBaskets[gameId] = {
        activeId: null,
        collections: []
      };

      var basketModel = this.baskets.gameBaskets[gameId];
      try {
        var i = basketModel.collections.length;
      } catch (e) {
        this.logger.error("A Game Basket Group was damaged and had to be reset", "Error Loading Game Baskets");
        delete this.baskets.gameBaskets[gameId];
        return this.getGameBaskets(gameId);
      }

      return this.constructedBaskets[gameId] = window.w6Cheat.api.createGameBasket(gameId, basketModel);
    }

    private setupBinding<TModel>(localStorage: angular.local.storage.ILocalStorageService, key: string, setFunc: () => TModel, testFunc: (model: TModel) => boolean) {
      if (localStorage.keys().indexOf(key) == -1) {
        localStorage.set(key, setFunc());
      } else {
        try {
          var model = localStorage.get<TModel>(key);
          if (!testFunc(model))
            throw new Error("Failed Model Test");
        } catch (e) {
          localStorage.remove(key);
          this.logger.error("Some of your settings were damaged and have been reset to prevent errors.", "Error Loading Status Bar");
          this.setupBinding(localStorage, key, setFunc, testFunc);
          return;
        }
      }
      localStorage.bind(this.scope, key);
    }

    private setupBindings(localStorage: angular.local.storage.ILocalStorageService) {
      this.setupBinding(localStorage, "baskets", () => this.createLocalBaskets(), (model) => {
        if (model.gameBaskets === null || typeof model.gameBaskets !== 'object')
          return false;
        return true;
      });
      this.setupBinding(localStorage, "settings", () => <IBasketSettings>{
        hasConnected: false
      }, (model) => {
        return true;
      });

      this.baskets = this.scope.baskets;
      this.settings = this.scope.settings;
    }
  }

  registerService(BasketService);
}

export module MyApp.Components.BytesFilter {
  // TODO: Dedup; this does pretty much the same as the size filter!
  export class BytesFilter {
    static $name = 'bytes';
    static factory = getFactory([], () => new BytesFilter().convert);

    static units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

    public convert = (bytes, precision, unit) => {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
        return '-';

      if (bytes == 0)
        return "-";

      if (typeof precision === 'undefined')
        precision = 1;

      if (typeof unit === 'undefined')
        unit = 0;

      var n = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, Math.floor(n))).toFixed(precision) + ' ' + BytesFilter.units[n + unit];
    };
  }

  angular.module('Components.BytesFilter', [])
    .filter(BytesFilter.$name, BytesFilter.factory);
}
export module MyApp.Components.Comments {
  interface ICommentScope extends ICommentSectionScope {
    newComment: { replyTo?; message: string; open: boolean };
    comment: AbstractDefs.IBreezeComment;
    edit: { editing: number; showComments: boolean };
    actionsEnabled;
    userAvatar;
    canEdit;
  }

  class CommentDirective extends Tk.Directive {
    static $name = 'sxComment';
    static $inject = ['RecursionHelper', 'w6'];
    static factory = getFactory(CommentDirective.$inject, (recursionHelper, w6) => new CommentDirective(recursionHelper, w6));

    constructor(private recursionHelper, private w6: W6) {
      super();
    }

    templateUrl = CommentSectionDirectiveController.viewBase + '/comment.html';
    restrict = 'E';
    scope = true;
    internalLink = ($scope: ICommentScope) => {
      $scope.newComment = {
        replyTo: $scope.comment,
        message: "",
        open: false
      };
      $scope.edit = { editing: 0, showComments: $scope.comment.hasReply() };
      $scope.actionsEnabled = !$scope.comment.archivedAt || $scope.canManage;
      $scope.userAvatar = $scope.comment.authorId == this.w6.userInfo.id ? this.w6.userInfo.getAvatarUrl(72) : $scope.comment.author.getAvatarUrl(72);
      $scope.canEdit = $scope.canManage || this.w6.userInfo.id == $scope.comment.authorId;
      $scope.level += 1;

      $scope.$on('closeComment', () => $scope.newComment.open = false);
    }; // Use the compile function from the RecursionHelper,
    compile = element => this.recursionHelper.compile(element, this.internalLink); // And return the linking function(s) which it returns
  }

  interface ICommentSectionScope extends ng.IScope {
    w6: W6;
    url: W6Urls;
    level: number;
    closeComments: () => any;
    openLoginDialog: () => any;
    selfAvatar;
    newComment: { open: boolean; message: string };
    editComment: (comment, model) => any;
    canManage: boolean;
    cancelCommentInternal: (scope) => void;
    addCommentInternal: (scope) => void;
  }

  class CommentSectionDirectiveController {
    static $inject = ['$scope', '$element', '$attrs', '$transclude', '$rootScope'];
    static viewBase = '/src_legacy/app/components/comments';

    constructor($scope: ICommentSectionScope, $element, $attrs, $transclude, $rootScope: IRootScope) {
      $scope.url = $rootScope.url;
      $scope.w6 = $rootScope.w6;
      $scope.editComment = (comment, model) => model.editing = model.editing + 1;
      $scope.newComment = { open: true, message: "" };
      $scope.selfAvatar = $rootScope.w6.userInfo.getAvatarUrl(72);
      $scope.openLoginDialog = $rootScope.openLoginDialog;
      $scope.closeComments = () => $scope.$broadcast('closeComment');
      $scope.level = 0;
      /*
                  $scope.addCommentInternal = () => {
                      $scope.addComment({ comment: $scope.newComment });
                      $scope.closeComments();
                  };
      */

      // WARNING: Workaround because of Scope issues - we loose the appropriate scope at different times.
      $scope.cancelCommentInternal = scope => {
        scope.newComment.message = '';
        scope.newComment.open = false;
      };
      $scope.addCommentInternal = scope => {
        scope.addComment({ comment: scope.newComment });
        //scope.closeComments();
        $scope.closeComments();
        scope.newComment.open = false; // Workaround
        if (scope.edit)
          scope.edit.showComments = true;
      };
    }
  }

  class CommentSectionDirective extends Tk.Directive {
    static $name = 'sxComments';
    static $inject = [];
    static factory = getFactory(CommentSectionDirective.$inject, () => new CommentSectionDirective());

    controller = CommentSectionDirectiveController;
    templateUrl = CommentSectionDirectiveController.viewBase + '/index.html';
    transclude = true;
    restrict = 'E';
    scope = {
      comments: '=',
      canManage: '=',
      addComment: '&',
      deleteComment: '&',
      saveComment: '&',
      reportComment: '&',
      likeComment: '&',
      unlikeComment: '&',
      likeStates: '='
    };
  }

  angular.module('Components.Comments', [])
    .directive(CommentDirective.$name, CommentDirective.factory)
    .directive(CommentSectionDirective.$name, CommentSectionDirective.factory);
}

export module MyApp.Components.Dfp {
  angular.module('Components.Dfp', []);
}
export module MyApp.Components.Dfp {
  class DfpDirective extends Tk.Directive {
    static $name = 'sxDfp';
    static $inject = [];
    static factory = getFactory(DfpDirective.$inject, () => new DfpDirective());

    restrict = 'E';
    scope = {};

    link = (scope, element, attrs) => {
      var adSlot = googletag.defineSlot("/19223485/main_rectangle_btf", [[125, 125], [180, 150], [300, 250], [336, 280]], "add-home2").addService(googletag.pubads());
      var mapping = googletag.sizeMapping()
        .addSize([1120, 400], [[336, 280], [300, 250], [180, 150], [125, 125]])
        .addSize([980, 400], [[300, 250], [180, 150], [125, 125]])
        .addSize([768, 400], [[180, 150], [125, 125]])
        .addSize([468, 200], [[336, 280], [300, 250], [180, 150], [125, 125]])
        .addSize([0, 0], [[300, 250], [180, 150], [125, 125]])
        .build();
      adSlot.defineSizeMapping(mapping);
    };
  }

  angular.module('Components.Dfp')
    .directive(DfpDirective.$name, DfpDirective.factory);
}
export module MyApp.Components.Dialogs {
  export class SendReportCommand extends DbCommandBase {
    static $name = 'SendReportCommand';
    public execute = ['data', (data) => this.context.postCustom("report", data, { requestName: 'sendReport' })];
  }

  export class ResendActivationCommand extends DbCommandBase {
    static $name = 'ResendActivation';
    public execute = [
      'data', data => this.context.postCustom("user/resend-activation-code", data, { requestName: 'resendActivation' })
        .then(result => this.respondSuccess("Request sent!"))
        .catch(this.respondError)
    ];
  }

  registerCQ(ResendActivationCommand);

  export class OpenReportDialogQuery extends DialogQueryBase {
    static $name = 'OpenReportDialog';
    public execute = () => this.openDialog(ReportDialogController);
  }

  export class OpenResendActivationDialogQuery extends DialogQueryBase {
    static $name = 'OpenResendActivationDialog';
    public execute = ['email', (email) => this.createDialog(ResendActivationDialogController, { email: email }, { size: "lg" })];
  }

  export class OpenRegisterDialogQuery extends DialogQueryBase {
    static $name = 'OpenRegisterDialog';
    public execute = () => this.openDialog(RegisterDialogController, { size: "lg" });
  }

  export class OpenRegisterDialogWithExistingDataQuery extends DialogQueryBase {
    static $name = 'OpenRegisterDialogWithExistingData';
    public execute = ['model', (model) => this.createDialog(RegisterDialogWithExistingDataController, model, { size: "lg" })];
  }

  export class OpenForgotPasswordDialogQuery extends DialogQueryBase {
    static $name = 'OpenForgotPasswordDialog';
    public execute = ['email', email => this.createDialog(ForgotPasswordDialogController, { email: email })];
  }

  export class OpenTermsDialogQuery extends DialogQueryBase {
    static $name = 'OpenTermsDialog';
    public execute = [
      () => this.openDialog(DefaultDialogWithDataController, {
        templateUrl: '/src_legacy/app/components/dialogs/terms-dialog.html',
        size: 'lg',
        resolve: {
          data: () => this.context.getMd("global/TermsOfService.md")
        }
      })
    ];
  }

  export class SearchQuery extends DbQueryBase {
    static $name = 'Search';
    public execute = [
      'model', model => this.context.getCustom("search", { params: model, requestName: 'search' })
        .then(result => result.data)
    ];
  }

  export interface ILoginConfig {
    fallbackUrl: string;
    overrideInPage: boolean;
  }

  /*
      export class ClearSessionCommand extends DbCommandBase {
          static $inject = ['dbContext', '$q', 'w6'];
          constructor(public context: W6Context, public $q: ng.IQService, private w6: W6) {
              super(context, $q);
          }

          static $name = 'ClearSession'
          public execute = [() => this.context.postCustom(this.w6.url.authSsl + "/api/login/clear", null, { requestName: 'login' })]
      }

      registerCQ(ClearSessionCommand);*/

  export class LoginCommand extends DbCommandBase {
    static $name = 'Login';
    static $inject = ['dbContext', '$location', '$window', '$rootScope', 'w6', '$q'];

    constructor(w6Context: W6Context, private $location: ng.ILocationService, private $window: ng.IWindowService, private $rootScope: IRootScope, private w6: W6, $q: ng.IQService) { super(w6Context); }

    public execute = [
      'data', 'config', (data, config: ILoginConfig) =>
        /*                this.context.postCustom(this.w6.url.authSsl + "/api/login/clear", null, { requestName: 'login' })
                            .then(r => */
        this.context.postCustom(this.w6.url.authSsl + "/api/login", data, { requestName: 'login' })
          .then(result => this.processReturn(result, config))
          .catch(this.respondError)
    ];

    private msg = "Sucessfully logged in";

    processReturn = (result, config) => {
      // Or should we get these things from the server, hmm?
      var returnUrl = this.$location.search().ReturnUrl;
      this.w6.updateUserInfo(result.data.account, this.w6.userInfo);

      if (config.overrideInPage) {
        if (config.fallbackUrl) throw new Error("Cannot have both overrideInPage and fallbackUrl specified");
        if (returnUrl) Debug.warn("returnUrl specified while overrideInPage");
        return { success: true, message: this.msg };
      }

      // TODO: Validate ReturnUrl domain..
      var fallbackUrl = returnUrl || config.fallbackUrl;
      if (fallbackUrl && (fallbackUrl.containsIgnoreCase("/login") || fallbackUrl.containsIgnoreCase("/register") || fallbackUrl.containsIgnoreCase("/forgot-password") || fallbackUrl.containsIgnoreCase("/forgot-username")
        || fallbackUrl.containsIgnoreCase("/finalize")))
        fallbackUrl = undefined;
      if (fallbackUrl == "reload")
        this.$window.location.reload(true);
      else
        this.$window.location.href = fallbackUrl || (this.w6.url.connect + "/u/" + this.w6.userInfo.slug);
      return { success: true, message: this.msg };
    };
  }

  export class RegisterCommand extends DbCommandBase {
    static $name = 'Register';
    public execute = [
      'data', (data) => this.context.postCustom("user/register", data, { requestName: 'register' })
        .then(result => this.respondSuccess('Succesfully registered'))
        .catch(this.respondError)
    ];
  }

  export class UsernameExistsQuery extends DbQueryBase {
    static $name = "UsernameExists";
    public execute = [
      'userName', userName => {
        if (!userName || userName.length == 0) return false;
        var cache = this.context.getUsernameExistsCache(userName);
        if (cache === false || cache === true) return cache;

        return <any>this.context.getCustom("accounts/username-exists", { params: { userName: userName } })
          .then(result => this.context.addUsernameExistsCache(userName, (<any>result.data).result));
      }
    ];
  }

  registerCQ(UsernameExistsQuery);

  export class EmailExistsQuery extends DbQueryBase {
    static $name = "EmailExists";
    public execute = [
      'email', email => {
        if (!email || email.length == 0) return false;
        var cache = this.context.getEmailExistsCache(email);
        if (cache === false || cache === true) return cache;

        return <any>this.context.getCustom("accounts/email-exists", { params: { email: email } })
          .then(result => this.context.addEmailExistsCache(email, (<any>result.data).result));
      }
    ];
  }

  registerCQ(EmailExistsQuery);

  export class ForgotPasswordCommand extends DbCommandBase {
    static $name = 'ForgotPassword';
    public execute = ['data', (data) => this.context.postCustom("user/forgot-password", data, { requestName: 'forgotPassword' })];
  }

  export class ForgotUsernameCommand extends DbCommandBase {
    static $name = 'ForgotUsername';
    public execute = ['data', (data) => this.context.postCustom("user/forgot-username", data, { requestName: 'forgotUsername' })];
  }

  registerCQ(OpenReportDialogQuery);
  registerCQ(OpenForgotPasswordDialogQuery);
  registerCQ(OpenResendActivationDialogQuery);
  registerCQ(OpenRegisterDialogQuery);
  registerCQ(OpenRegisterDialogWithExistingDataQuery);
  registerCQ(SendReportCommand);
  registerCQ(SearchQuery);
  registerCQ(OpenTermsDialogQuery);
  registerCQ(ForgotPasswordCommand);
  registerCQ(ForgotUsernameCommand);

  registerCQ(LoginCommand);
  registerCQ(RegisterCommand);
}

export module MyApp.Components.Dialogs {
  export class DefaultDialogController extends DialogControllerBase {
    static $name = "DefaultDialogController";

    constructor($scope, logger, $modalInstance, $q) {
      super($scope, logger, $modalInstance, $q);
      $scope.ok = () => $modalInstance.close();
    }
  }

  export class DefaultDialogWithDataController extends DialogControllerBase {
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];
    static $name = "DefaultDialogWithDataController";

    constructor($scope, logger, $modalInstance, $q, data) {
      super($scope, logger, $modalInstance, $q);
      $scope.ok = () => $modalInstance.close();
      $scope.data = data;
    }
  }

  export class ReportDialogController extends DialogControllerBase {
    static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q'];
    static $name = 'ReportDialogController';
    static $view = '/src_legacy/app/components/dialogs/report.html';

    constructor(public $scope, public logger, $routeParams, $location: ng.ILocationService, $modalInstance, $q) {
      super($scope, logger, $modalInstance, $q);

      $scope.model = { content: $routeParams.content || $location.absUrl() };
      $scope.sendReport = () => this.processCommand($scope.request(SendReportCommand, { data: $scope.model }, "Report sent!")
        .then((data) => $scope.sent = true));
    }
  }

  export class ForgotPasswordDialogController extends DialogControllerBase {
    static $inject = ['$scope', 'logger', '$modalInstance', '$routeParams', '$location', '$q', 'data'];
    static $name = 'ForgotPasswordDialogController';
    static $view = '/src_legacy/app/components/dialogs/forgot-password.html';

    constructor(public $scope, public logger, $modalInstance, $routeParams, $location: ng.ILocationService, $q, model) {
      super($scope, logger, $modalInstance, $q);
      $scope.model = {
        email: model.email
      };
      $scope.submit = () => this.processCommand($scope.request(ForgotPasswordCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
    }
  }

  export class ResendActivationDialogController extends DialogControllerBase {
    static $name = "ResendActivationDialogController";
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];
    static $view = '/src_legacy/app/components/dialogs/resend-activation.html';

    constructor(public $scope, public logger, $modalInstance, $q, model) {
      super($scope, logger, $modalInstance, $q);

      $scope.model = {
        email: model.email
      };
      $scope.submit = () => this.requestAndProcessResponse(ResendActivationCommand, { data: $scope.model });
    }
  }

  export class RegisterDialogController extends DialogControllerBase {
    static $name = 'RegisterDialogController';
    static $view = '/src_legacy/app/components/dialogs/register.html';

    constructor($scope, logger, $modalInstance, $q) {
      super($scope, logger, $modalInstance, $q);

      $scope.model = { fingerPrint: new Fingerprint().get() };
      $scope.openForgotPasswordDialog = () => $scope.request(OpenForgotPasswordDialogQuery, { email: $scope.model.email }).then(result => $modalInstance.close());
      $scope.register = () => this.requestAndProcessResponse(Dialogs.RegisterCommand, { data: $scope.model });
    }
  }

  export class RegisterDialogWithExistingDataController extends RegisterDialogController {
    static $name = 'RegisterDialogWithExistingDataController';
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'data'];

    constructor($scope, logger, $modalInstance, $q, model) {
      super($scope, logger, $modalInstance, $q);
      $scope.model = model;
      $scope.model.fingerPrint = new Fingerprint().get();
    }
  }

  // Registered because we load it in connect.ts router.. // lets check it anyway
  registerController(ReportDialogController);
}

export module MyApp.Components.Fields {
  class FieldsModule extends Tk.Module {
    static $name = "FieldsModule";

    constructor() {
      super('Components.Fields', []);
      this.tplRoot = '/src_legacy/app/components/fields';

      this.app.directive('sxBirthdayField', () => {
        return {
          require: '^form',
          scope: {
            birthday: '=model',
            label: '@',
            ngDisabled: '=?'
          },
          restrict: 'E',
          link: ($scope, $element, $attrs: any, ctrl) => {
            new FieldBase().link($scope, $element, $attrs, ctrl, 'birthday', 'Birthday');
          },
          templateUrl: this.tplRoot + '/_date-field.html'
        };
      })
        .directive('sxDatetimeField', () => {
          return {
            require: '^form',
            scope: {
              datetime: '=model',
              label: '@',
              ngDisabled: '=?'
            },
            restrict: 'E',
            link: ($scope, $element, $attrs: any, ctrl) => {
              new FieldBase().link($scope, $element, $attrs, ctrl, 'datetime', 'Date');
            },
            templateUrl: this.tplRoot + '/_datetime-field.html'
          };
        })
        .directive('sxEmailField', [
          '$rootScope', ($rootScope: IRootScope) => {
            return {
              require: '^form',
              scope: {
                email: '=model',
                label: '@',
                placeholder: '@',
                forgotPassword: '&',
                login: '&',
                showLabel: '=?'
              },
              restrict: 'E',
              link: ($scope, $element, $attrs: any, ctrl) => {
                new FieldBase().link($scope, $element, $attrs, ctrl, 'email', 'Email');
                // TODO: OnBlur only!sb@
                if ($attrs.checkAlreadyExists) {
                  // TODO: Only if not other validations failed?
                  // using viewValue as workaround because model not set when already invalid last time
                  $scope.checkExists = () => $rootScope.request(Dialogs.EmailExistsQuery, { email: ctrl.email.$viewValue })
                    .then(result => {
                      ctrl.email.$setValidity("sxExists", !result.lastResult);
                      // workaround angular not updating the model after setValidity..
                      // https://github.com/angular/angular.js/issues/8080
                      if (ctrl.email.$valid) $scope.email = ctrl.email.$viewValue;
                    });
                };
                $scope.blurred = () => {
                  ctrl.email.sxBlurred = true;
                  if ($scope.checkExists) $scope.checkExists();
                };
              },
              templateUrl: this.tplRoot + '/_email-field.html'
            };
          }
        ])
        .directive('sxTextField', [
          '$rootScope', ($rootScope: IRootScope) => {
            return {
              require: '^form',
              scope: {
                text: '=model',
                label: '@',
                placeholder: '@',
                checkAlreadyExists: '&?'
              },
              restrict: 'E',
              link: ($scope, $element, $attrs: any, ctrl) => {
                new FieldBase().link($scope, $element, $attrs, ctrl, 'text', 'Text');
                // TODO: OnBlur only!sb@
                if ($attrs.checkAlreadyExists) {
                  // TODO: Only if not other validations failed?
                  // using viewValue as workaround because model not set when already invalid last time
                  $scope.checkExists = () => $scope.checkAlreadyExists({ value: ctrl.text.$viewValue })
                    .then(result => {
                      ctrl.text.$setValidity("sxExists", !result);
                      // workaround angular not updating the model after setValidity..
                      // https://github.com/angular/angular.js/issues/8080
                      if (ctrl.text.$valid) $scope.text = ctrl.text.$viewValue;
                    });
                };
                $scope.blurred = () => {
                  ctrl.text.sxBlurred = true;
                  if ($scope.checkExists) $scope.checkExists();
                };
              },
              templateUrl: this.tplRoot + '/_text-field.html'
            };
          }
        ])
        .directive('sxUsernameField', [
          '$rootScope', ($rootScope: IRootScope) => {
            return {
              require: '^form',
              scope: {
                userName: '=model',
                label: '@',
                placeholder: '@'
              },
              restrict: 'E',
              link: ($scope, $element, $attrs: any, ctrl) => {
                new FieldBase().link($scope, $element, $attrs, ctrl, 'userName', 'Username');
                // TODO: OnBlur only!
                if ($attrs.checkAlreadyExists) {
                  // TODO: Only if not other validations failed?
                  // using viewValue as workaround because model not set when already invalid last time
                  $scope.checkExists = () => $rootScope.request(Dialogs.UsernameExistsQuery, { userName: ctrl.userName.$viewValue })
                    .then(result => {
                      ctrl.userName.$setValidity("sxExists", !result.lastResult);
                      // workaround angular not updating the model after setValidity..
                      // https://github.com/angular/angular.js/issues/8080
                      if (ctrl.userName.$valid) $scope.userName = ctrl.userName.$viewValue;
                    });
                };
                $scope.blurred = () => {
                  ctrl.userName.sxBlurred = true;
                  if ($scope.checkExists) $scope.checkExists();
                };

              },
              templateUrl: this.tplRoot + '/_username-field.html'
            };
          }
        ])
        .directive('sxAcceptedField', () => {
          return {
            require: '^form',
            scope: {
              accepted: '=model',
              name: '@name'
            },
            transclude: true,
            restrict: 'E',
            link: ($scope, $element, $attrs: any, ctrl) => {
              new FieldBase().link($scope, $element, $attrs, ctrl, 'accepted', null);
            },
            templateUrl: this.tplRoot + '/_accepted-field.html'
          };
        })
        .directive('sxDisplayNameField', () => {
          return {
            require: '^form',
            scope: {
              displayName: '=model',
              label: '@',
              placeholder: '@'
            },
            restrict: 'E',
            link: ($scope, $element, $attrs: any, ctrl) => {
              new FieldBase().link($scope, $element, $attrs, ctrl, 'displayName', 'Display name');
            },
            templateUrl: this.tplRoot + '/_displayName-field.html'
          };
        })
        .directive('sxPasswordField', () => {
          return {
            require: '^form',
            scope: {
              password: '=model',
              confirmPassword: '=?confirmModel',
              validate: '=?',
              label: '@',
              showLabel: '=?',
              placeholder: '@',
              notContains: '&?',
              notEquals: '&?'
            },
            restrict: 'E',
            link: ($scope, $element, $attrs: any, ctrl) => {
              new FieldBase().link($scope, $element, $attrs, ctrl, 'password', 'Password');
              if ($attrs.confirmModel) $scope.confirmEnabled = true;
              if (!$attrs.validate) $scope.validate = true;
              $scope.blurredConfirm = () => ctrl.passwordConfirmation.sxBlurred = true;
            },
            templateUrl: this.tplRoot + '/_password-field.html'
          };
        })
        .directive('sxValidationMessages', () => {
          return {
            require: '^form',
            scope: {
              field: '=',
              label: '='
            },
            transclude: true,
            restrict: 'E',
            link: ($scope, $element, $attrs: any, ctrl) => {
              $scope.form = ctrl;
              $scope.Modernizr = Modernizr;
              $scope.showGeneralError = (field) => {
                if (!field.$invalid) return false;
                if (ctrl.sxValidateOnBlur && field.sxBlurred) {
                } else if (ctrl.sxValidateOnlyOnSubmit && !ctrl.sxFormSubmitted && field.$pristine) return false;
                var err = field.$error;
                return !err.sxExists && !err.minlength && !err.maxlength && !err.passwordVerify;
              };
            },
            templateUrl: this.tplRoot + '/_validation_messages.html'
          };
        })
        .directive('sxValidateOnSubmit', () => {
          return {
            require: 'form',
            scope: {
              method: '&sxValidateOnSubmit'
            },
            restrict: 'A',
            link: ($scope: any, $element, $attrs, ctrl) => {
              //if ($attrs.hideIndicator) ctrl.sxHideIndicator = true;
              ctrl.sxValidateOnlyOnSubmit = true;
              if ($attrs.validateOnBlur) ctrl.sxValidateOnBlur = true;
              $attrs.$set('novalidate', 'novalidate');
              $element.submit((e) => {
                var message = $attrs.sxReallyMessage;
                if (!message || confirm(message)) {
                  $scope.$apply(() => ctrl.sxFormSubmitted = true);
                  if (ctrl.$valid) $scope.method();
                }
              });
            }
          };
        })
        .directive('sxValidateOnBlur', () => {
          return {
            require: 'form',
            restrict: 'A',
            link: ($scope: any, $element, $attrs, ctrl) => {
              ctrl.sxValidateOnBlur = true;
              $attrs.$set('novalidate', 'novalidate');
            }
          };
        })
        .directive('sxValidateNotContains', () => {
          return {
            require: 'ngModel',
            restrict: 'A',
            link: ($scope: any, $element, $attrs, ctrl: ng.INgModelController) => {
              ctrl.$parsers.unshift(viewValue => {
                if (!viewValue) return viewValue;
                var valid = true;
                var notContains = $scope.notContains ? $scope.notContains() : [];
                if (!notContains) return viewValue;
                if (notContains.length == 0) return viewValue;
                angular.forEach(notContains, v => {
                  if (!v || !valid) return;
                  angular.forEach(v.split(/[\s@]+/), v2 => {
                    if (viewValue.containsIgnoreCase(v2))
                      valid = false;
                  });
                });
                ctrl.$setValidity('notContains', valid);
                return viewValue;
              });
            }
          };
        })
        .directive('sxValidateNotEquals', () => {
          return {
            require: 'ngModel',
            restrict: 'A',
            link: ($scope: any, $element, $attrs, ctrl: ng.INgModelController) => {
              ctrl.$parsers.unshift(viewValue => {
                if (!viewValue) return viewValue;
                var valid = true;
                var notContains = $scope.notEquals ? $scope.notEquals() : [];
                if (!notContains) return viewValue;
                if (notContains.length == 0) return viewValue;
                angular.forEach(notContains, v => {
                  if (!v || !valid) return;
                  angular.forEach(v.split(/[\s@]+/), v2 => {
                    if (viewValue.equalsIgnoreCase(v2))
                      valid = false;
                  });
                });
                ctrl.$setValidity('notEquals', valid);
                return viewValue;
              });
            }
          };
        });
    }

    tplRoot: string;
  }

  class FieldBase {
    public link($scope, $element, $attrs: any, ctrl, defaultFieldName: string, label: string) {
      $scope.model = $scope; // To workaround ng-model input scope issues... // TODO: Remove or what?
      $scope.getFieldName = () => $scope.name || defaultFieldName;
      $scope.getField = () => ctrl[$scope.getFieldName()];
      $scope.form = ctrl;
      $scope.Modernizr = Modernizr;
      $scope.isInvalid = (field?) => {
        if (field == null) field = $scope.getField();
        if (field == null) return false; // the field is not always initialized at the start
        return this.isInvalid(field, ctrl);
      };
      $scope.blurred = () => $scope.getField().sxBlurred = true;
      if (!$attrs.label) $attrs.label = label;
      if ($attrs.showLabel == null) $scope.showLabel = true;

      if (!$scope.showLabel && ($attrs.placeholder == null || $attrs.placeholder == ''))
        $attrs.placeholder = $attrs.label;
    }

    private isInvalid = (field, ctrl) => {
      if (!field.$invalid) return false;
      if (ctrl.sxValidateOnBlur && field.sxBlurred) return true;
      //if (!ctrl.sxHideIndicator && !field.$pristine) return true;
      return ctrl.sxFormSubmitted;
      //return field.$invalid && ((!ctrl.sxHideIndicator && !field.$pristine) || ctrl.sxFormSubmitted)
    };
  }

  var app = new FieldsModule();

}

export module MyApp.Components.Geo {
  export class GeoService extends Tk.Service {
    static $name = 'geoService';
    static $inject = ['$http', 'promiseCache', '$q'];

    constructor(private $http: ng.IHttpService, private promiseCache, private $q) {
      super();
    }

    public getMyInfo(): ng.IHttpPromise<{ longitude; latitude }> {
      return this.promiseCache({
        promise: () => this.$http.get("//freegeoip.net/json/"),
        key: "geoService-"
      });
    }

    public getMyInfo2(): Promise<{ longitude; latitude }> {
      var q = this.$q.defer();
      if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition((location) => q.resolve(location.coords));
      } else {
        this.getMyInfo()
          .then((result) => q.resolve(result.data))
          .catch((reason) => q.reject(reason));
      }
      return q.promise;
    }

    public getInfo(ip: string): ng.IHttpPromise<{ longitude; latitude }> {
      return this.promiseCache({
        promise: () => this.$http.get("http://freegeoip.net/json/" + ip),
        key: "geoService-" + ip
      });
    }
  }

  registerService(GeoService);
}
export module MyApp.Components.LoadingStatusInterceptor {

  export interface IW6Request extends ng.IRequestConfig {
    w6Request: boolean;
  }

  // TODO: Should be careful when cancelling posting data to the server - the server would probably still process the request, so should only occur for queries?
  export class LoadingStatusInterceptor extends Tk.Service {
    static $name = 'loadingStatusInterceptor';
    static $inject = ['$q', '$rootScope', '$cookies', 'userInfo', 'promiseCache', 'localStorageService', 'w6'];
    private activeRequests: number;

    // Temporary repurposed as Breeze loading interceptor
    constructor(private $q: ng.IQService, private $rootScope, private $cookies: ng.cookies.ICookiesService, private userInfo, private promiseCache, private $localStorage, private w6: W6) {
      super();
      this.activeRequests = 0;
    }

    // Need lambda syntax because of how interceptors are called
    public request = (config: IW6Request) => {
      if (config.w6Request) {
        this.setupConfig(config);
        Debug.log("w6request", config);
      }
      this.started();
      return config || this.$q.when(config);
    };
    public requestError = (rejection) => {
      if (rejection.config && rejection.config.w6Request && debug) Debug.log("requestError", rejection);

      this.ended();
      return this.$q.reject(rejection);
    };
    public response = (response) => {
      if (response.config && response.config.w6Request) {
        if (response.data) response.data = LoadingStatusInterceptor.convertToClient(response.data);
        Debug.log("w6Response", response);
      } else if (response.config.breezeRequest) {
        Debug.log("breezeResponse", response);
      }
      this.ended();
      return response || this.$q.when(response);
    };

    public responseError = (rejection) => {
      if (rejection.config) {
        if (rejection.config.w6Request) {
          if (rejection.data) rejection.data = LoadingStatusInterceptor.convertToClient(rejection.data);
          Debug.log("w6ResponseError", rejection);
        } else if (rejection.config.breezeRequest) {
          if (rejection.data) rejection.data = LoadingStatusInterceptor.convertToClient(rejection.data, false);
          Debug.log("breezeResponseError", rejection);
        }
      }
      this.ended();
      return this.$q.reject(rejection);
    };
    static iso8601RegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;

    public static convertToClient(obj, convertPropertyNames = true) {
      var converter = breeze.NamingConvention.defaultInstance;
      if (obj instanceof Array) {
        var newAr = [];
        angular.forEach(obj, (v, i) => newAr[i] = this.convertToClient(v, convertPropertyNames));
        return newAr;
      } else if (obj instanceof Date) {
        return obj;
      } else if (obj instanceof Object) {
        var newObj = {};
        if (convertPropertyNames) angular.forEach(obj, (v, p) => newObj[converter.serverPropertyNameToClient(p)] = this.convertToClient(v, convertPropertyNames));
        else angular.forEach(obj, (v, p) => newObj[p] = this.convertToClient(v, convertPropertyNames));
        return newObj;
      } else if (typeof obj == "string") {
        if (this.iso8601RegEx.test(obj)) {
          return breeze.DataType.parseDateFromServer(obj);
          // if (!obj.endsWith("Z")) obj = obj + "Z";
          // return new Date(obj);
        }
      }

      return obj;
    }

    private convertToServer(obj) {
      var converter = breeze.NamingConvention.defaultInstance;
      if (obj instanceof Array) {
        var newAr = [];
        angular.forEach(obj, (v, i) => newAr[i] = this.convertToServer(v));
        return newAr;
      } else if (obj instanceof Date) {
        return obj;
      } else if (obj instanceof Object) {
        var newObj = {};
        angular.forEach(obj, (v, p) => newObj[converter.clientPropertyNameToServer(p)] = v instanceof Object ? this.convertToServer(v) : v);
        return newObj;
      }
      return obj;
    }

    handleDefer() {
      if (this.defer) return this.defer;
      return this.defer = this.$q.defer();
    }

    startedBreeze(requestInfo) {
      // TODO: Canceler should have a requestName, and be cancelled specifically based on requestName ...
      requestInfo.timeout = this.handleDefer().promise;
      requestInfo.config.breezeRequest = true;
      this.setupConfig(requestInfo.config);
      Debug.log("breezeRequest", requestInfo);
    }

    started() {
      if (this.activeRequests == 0) {
        this.$rootScope.canceler = this.handleDefer();
        this.$rootScope.$broadcast('loadingStatusActive');
      }
      this.activeRequests++;
    }

    ended() {
      this.activeRequests--;
      if (this.activeRequests == 0) {
        this.$rootScope.canceler = undefined;
        this.defer = undefined;
        this.$rootScope.$broadcast('loadingStatusInactive');
      }
    }

    defer;

    setupConfig(config: IW6Request) { }
  }

  registerService(LoadingStatusInterceptor);
}

export module MyApp.Components.Logger {
  export class ToastLogger extends Tk.Service {
    static $inject = ['$log'];
    static $name = 'logger';

    constructor(private $log) {
      super();

      // This logger wraps the toastr logger and also logs to console using ng $log
      // toastr.js is library by John Papa that shows messages in pop up toast.
      // https://github.com/CodeSeven/toastr

      toastr.options.timeOut = 3 * 1000;
      toastr.options.positionClass = 'toast-bottom-right';
    }

    public error(message: string, title: string = null, options?: ToastrOptions) {
      var opts = { timeOut: 10 * 1000 };
      if (options) Object.assign(opts, options);
      toastr.error(message, title, opts);
      this.$log.error("Error: " + message);
    }

    public errorRetry(message: string, title: string = null, options?: ToastrOptions) {
      var opts = {
        timeOut: 0,
        extendedTimeOut: 0,
        tapToDismiss: false
      };
      if (options) Object.assign(opts, options);
      this.$log.error("ErrorRetry: " + title);
      return toastr.error(message, title, opts);
    }

    public info(message: string, title: string = null, options?: ToastrOptions) {
      this.$log.info("Info: " + message);
      return toastr.info(message, title, options);
    }

    public success(message: string, title: string = null, options?: ToastrOptions) {
      this.$log.info("Success: " + message);
      return toastr.success(message, title, options);
    }

    public warning(message: string, title: string = null, options?: ToastrOptions) {
      var opts = { timeOut: 10 * 1000 };
      if (options) Object.assign(opts, options);
      this.$log.warn("Warning: " + message);
      return toastr.warning(message, title, opts);
    }

    public log(message) { this.$log.log(message); }
  }

  registerService(ToastLogger);
}

export module MyApp.Components.ModInfo {
  // Deprecated in favour of withsix-sync-api
  export interface IContentState {
    id: string; gameId: string; state: ItemState; version: string;
    speed?: number; progress?: number;
  }

  export enum ItemState {
    NotInstalled = 0,

    Uptodate = 1,

    UpdateAvailable = 2,
    Incomplete = 3,

    Installing = 11,
    Updating = 12,
    Uninstalling = 13,
    Diagnosing = 14,
    Launching = 15
  }

  export interface IClientInfo {
    content: { [id: string]: IContentState };
    globalLock: boolean;
    gameLock: boolean;
    isRunning: boolean;
  }

  export enum State {
    Normal = 0,
    Paused = 1,
    Error = 2,
  }
}

export module MyApp.Components.Pagedown {
  class PagedownDirective {
    static $name = 'sxPagedown';
    static $inject = ['$compile', '$timeout'];
    static factory = getFactory(PagedownDirective.$inject, ($compile, $timeout) => new PagedownDirective($compile, $timeout));

    static getConverter() {
      var converter = Markdown.getSanitizingConverter();
      //converter.hooks.chain("preBlockGamut", (text, rbg) => text.replace(/^ {0,3}""" *\n((?:.*?\n)+?) {0,3}""" *$/gm, (whole, inner) => "<blockquote>" + rbg(inner) + "</blockquote>\n"));
      return converter;
    }

    static converter = PagedownDirective.getConverter();

    constructor(private $compile, private $timeout) {
      this.nextId = 0;
    }

    require = 'ngModel';
    replace = true;
    template = '<div class="pagedown-bootstrap-editor"></div>';

    public link = (scope, iElement, attrs, ngModel) => {

      var editorUniqueId;

      if (attrs.id == null) {
        editorUniqueId = this.nextId++;
      } else {
        editorUniqueId = attrs.id;
      }
      var newElement = "";
      if (attrs.previewFirst != null) {
        newElement = this.$compile(
          '<div>' +
          '<div id="wmd-preview-' + editorUniqueId + '" class="pagedown-preview wmd-panel wmd-preview"></div>' +
          '<div class="wmd-panel">' +
          '<div id="wmd-button-bar-' + editorUniqueId + '"></div>' +
          '<textarea class="wmd-input" id="wmd-input-' + editorUniqueId + '">' +
          '</textarea>' +
          '</div>' +
          '</div>')(scope);
      } else {
        newElement = this.$compile(
          '<div>' +
          '<div class="wmd-panel">' +
          '<div id="wmd-button-bar-' + editorUniqueId + '"></div>' +
          '<textarea class="wmd-input" id="wmd-input-' + editorUniqueId + '">' +
          '</textarea>' +
          '</div>' +
          '<div id="wmd-preview-' + editorUniqueId + '" class="pagedown-preview wmd-panel wmd-preview"></div>' +
          '</div>')(scope);
      }


      iElement.html(newElement);

      var help = () => {
        alert("There is no help");
      };
      var editor = new Markdown.Editor(PagedownDirective.converter, "-" + editorUniqueId, {
        handler: help
      });

      var $wmdInput = iElement.find('#wmd-input-' + editorUniqueId);

      var init = false;

      editor.hooks.chain("onPreviewRefresh", () => {
        var val = $wmdInput.val();
        if (init && val !== ngModel.$modelValue) {
          this.$timeout(() => {
            scope.$apply(() => {
              ngModel.$setViewValue(val);
              ngModel.$render();
            });
          });
        }
      });

      ngModel.$formatters.push(value => {
        init = true;
        $wmdInput.val(value);
        editor.refreshPreview();
        return value;
      });

      editor.run();
    };
    nextId: number;
  }

  angular.module('Components.Pagedown', [])
    .directive(PagedownDirective.$name, PagedownDirective.factory);
}
export module MyApp.Components.ReallyClick {
  class ReallyClickDirective extends Tk.Directive {
    static $name = 'sxReallyClick';
    static factory = getFactory([], () => new ReallyClickDirective());

    restrict = 'A';
    link = (scope, element, attrs) => {
      element.bind('click', () => {
        var message = attrs.sxReallyMessage;
        if (message && confirm(message))
          scope.$apply(attrs.sxReallyClick);
      });
    };
  }

  angular.module('Components.ReallyClick', [])
    .directive(ReallyClickDirective.$name, ReallyClickDirective.factory);
}
export module MyApp.Components.Upload {

  // ReSharper disable InconsistentNaming
  export interface IAWSUploadPolicy {
    AccessKey: string;
    Signature: string;
    SecurityToken: string;
    ACL: string;
    ContentType: string;
    Key: string;
    BucketName: string;
    EncryptedPolicy: string;
    CallbackUrl: string;
  }

  // ReSharper restore InconsistentNaming

  export class UploadService extends Tk.Service {
    static $name = 'UploadService';
    static $inject = ['$http', '$upload', 'options', 'dbContext'];

    constructor(private $http, private $upload, private options, private context) {
      super();
    }

    public uploadToAmazon(file: File, authorizationPath, policyType, requestName?) {
      throw Error("Not Implemented");
      //this.getPolicy(file, authorizationPath, policyType, requestName)
      //  .success(s3Params => this.uploadToBucket(file, s3Params, requestName));
    }

    public uploadToAmazonWithPolicy(file: File, uploadPolicy: IBreezeAWSUploadPolicy): ng.IHttpPromise<any> {
      return this.uploadToBucket(file, uploadPolicy);

    }

    private getPolicy(file, authorizationPath, policyType, requestName?) {
      return this.context.getCustom(this.options.serviceName + '/' + authorizationPath, { requestName: requestName, params: { policyType: policyType, filePath: file } });
    }

    private uploadToBucket = (file: File, s3Params: IBreezeAWSUploadPolicy, requestName?): ng.IHttpPromise<any> => {
      var data = {
        key: s3Params.key,
        acl: s3Params.aCL, // ?? acl vs CannedACL ?
        //success_action_redirect: s3Params.callbackUrl,
        'Content-Type': s3Params.contentType,
        'x-amz-security-token': s3Params.securityToken,
        AWSAccessKeyId: s3Params.accessKey, // ?? included in policy?
        Policy: jQuery.parseJSON(s3Params.encryptedPolicy).policy, // TODO: We actually really only need the policy property??
        Signature: s3Params.signature,
        //filename: file.name, // ?? included in policy?
        //filename: file.name //Required for IE8/9 //,
      };
      /*
                  if (s3Params.callbackUrl) {

                      data.success_action_redirect = s3Params.callbackUrl;
                      //data.success_action_status = '201';
                  }
      */

      return this.$upload.upload({
        url: 'https://' + s3Params.bucketName + '.s3.amazonaws.com/',
        method: 'POST',
        data: data,
        file: file,
      });
      //.progress(evt => {
      //Debug.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      //}).success((data, status, headers, config) => {
      // file is uploaded successfully
      //Debug.log(data);
      //});
      //.error(...)
      //.then(success, error, progress);
      // access or attach event listeners to the underlying XMLHttpRequest.
      //.xhr(function(xhr){xhr.upload.addEventListener(...)})
    };
  }

  registerService(UploadService);
}

export module MyApp.Auth {
  angular.module('MyAppAuthTemplates', []);

  // TODO: Move Login/Register etc from Connect to Auth modules
  class AuthModule extends Tk.Module {
    static $name = "AuthModule";

    constructor() {
      super('MyAppAuth', ['app', 'ngRoute', 'ngDfp', 'commangular', 'MyAppPlayTemplates', 'route-segment', 'view-segment', 'Components', 'MyAppAuthTemplates', 'MyAppConnect']);
      this.app
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            var register = $routeProvider
              .when('/register', 'register')
              //.when('/register/finalize', 'register_finalize')
              .segment('register', {
                controller: 'RegisterController',
                templateUrl: '/src_legacy/app/connect/pages/register.html'
              });

            /*                        register.segment('register_finalize', {
                                        controller: 'FinalizeController',
                                        templateUrl: '/src_legacy/app/connect/pages/finalize.html'
                                    });*/

            var login = $routeProvider
              .when('/login', 'login')
              .when('/login/verify', 'login_resend_code')
              .when('/login/verify/:activationCode', 'login_verify')
              .when('/login/forgot-password', 'login_forgot-password')
              .when('/login/forgot-username', 'login_forgot-username')
              .when('/login/forgot-password/reset/:resetCode', 'login_reset-password')
              .segment('login', {
                redirectTo: '/me'
              });

            login.segment('login_verify', {
              controller: 'AureliaPageController'
            });

            login.segment('login_resend_code', {
              controller: 'ResendActivationController',
              templateUrl: '/src_legacy/app/connect/pages/resend-activation.html'
            });

            login.segment('login_forgot-password', {
              controller: 'ForgotPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-password.html'
            });
            login.segment('login_forgot-username', {
              controller: 'ForgotUsernameController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-username.html'
            });
            login.segment('login_reset-password', {
              controller: 'ResetPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/reset-password.html'
            });
          }
        ])
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new AuthModule();
}

export module MyApp.Connect {
  angular.module('MyAppConnectTemplates', []);

  class ConnectModule extends Tk.Module {
    static $name = "ConnectModule";

    constructor() {
      super('MyAppConnect', ['app', 'ngRoute', 'ngDfp', 'commangular', 'MyAppPlayTemplates', 'route-segment', 'view-segment', 'Components', 'MyAppConnectTemplates']);

      this.app
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            $routeProvider.
              when('/report', 'report')
              .segment('report', {
                controller: Components.Dialogs.ReportDialogController,
                templateUrl: '/src_legacy/app/components/dialogs/report.html'
              });

            var register = $routeProvider
              .when('/register', 'register')
              //.when('/register/finalize', 'register_finalize')
              .segment('register', {
                controller: 'RegisterController',
                templateUrl: '/src_legacy/app/connect/pages/register.html'
              });

            /*
                              register.segment('register_finalize', {
                                  controller: 'FinalizeController',
                                  templateUrl: '/src_legacy/app/connect/pages/finalize.html',
                              });
            */

            var login = $routeProvider
              .when('/login', 'login')
              .when('/login/verify', 'login_resend_code')
              .when('/login/verify/:activationCode', 'login_verify')
              .when('/login/forgot-password', 'login_forgot-password')
              .when('/login/forgot-username', 'login_forgot-username')
              .when('/login/forgot-password/reset/:resetCode', 'login_reset-password')
              .segment('login', {
                redirectTo: '/me'
              });

            login.segment('login_verify', {
              controller: 'AureliaPageController'
            });


            login.segment('login_resend_code', {
              controller: 'ResendActivationController',
              templateUrl: '/src_legacy/app/connect/pages/resend-activation.html',
            });

            login.segment('login_forgot-password', {
              controller: 'ForgotPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-password.html',
            });
            login.segment('login_forgot-username', {
              controller: 'ForgotUsernameController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-username.html'
            });
            login.segment('login_reset-password', {
              controller: 'ResetPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/reset-password.html',
            });


            var me = $routeProvider.
              when('/me', 'me').
              when('/me/groups', 'aurelia').
              when('/me/groups/:id/:slug', 'aurelia').
              when('/me/groups/:id/:slug/join/:token', 'aurelia').
              when('/me/groups/:id/:slug/members', 'aurelia').
              when('/me/groups/:id/:slug/collections', 'aurelia').
              when('/me/groups/:id/:slug/mods', 'aurelia').
              when('/me/groups/:id/:slug/servers', 'aurelia').
              when('/me/library', 'aurelia').
              when('/me/library/:gameSlug', 'aurelia').
              when('/me/library/:gameSlug/mods', 'aurelia').
              when('/me/library/:gameSlug/missions', 'aurelia').
              when('/me/library/:gameSlug/collections', 'aurelia').
              when('/me/library/:gameSlug/collections/:collectionId/:collectionSlug?', 'aurelia').
              when('/me/library/:gameSlug/servers', 'aurelia').
              when('/me/content', 'aurelia').
              when('/me/content/collections', 'aurelia').
              when('/me/content/missions', 'aurelia').
              when('/me/content/mods', 'aurelia').
              when('/me/library/:gameSlug/apps', 'aurelia').
              when('/me/settings', 'me.settings').
              when('/me/settings/personal', 'me.settings.personal').
              when('/me/settings/avatar', 'me.settings.avatar').
              when('/me/settings/credentials', 'me.settings.credentials').
              when('/me/settings/premium', 'me.settings.premium').
              when('/me/blog', 'me.blog').
              when('/me/blog/create', 'me.blog.create').
              when('/me/blog/:slug', 'me.blog.edit').
              when('/me/friends', 'me.friends').
              when('/me/offers', 'me.offers').
              when('/me/messages', 'me.messages').
              when('/me/messages/:slug', 'me.messages.user').
              segment('aurelia', {
                controller: 'AureliaPageController'
              }).
              segment('me', {
                controller: 'MeController',
                templateUrl: '/src_legacy/app/connect/me/index.html'
              }).within();

            me.segment('settings', {
              controller: 'MeSettingsController',
              templateUrl: '/src_legacy/app/connect/me/settings/index.html',
            })
              .within()
              .segment('personal', {
                default: true,
                templateUrl: '/src_legacy/app/connect/me/settings/personal.html',
                controller: 'MeSettingsPersonalController',
                resolve: setupQuery(Me.GetMeSettingsPersonalQuery),
              }).segment('avatar', {
                templateUrl: '/src_legacy/app/connect/me/settings/avatar.html',
                controller: 'MeSettingsAvatarController',
                resolve: setupQuery(Me.GetMeSettingsAvatarQuery),
              }).segment('credentials', {
                templateUrl: '/src_legacy/app/connect/me/settings/credentials.html',
                controller: 'MeSettingsCredentialsController',
                resolve: setupQuery(Me.GetMeSettingsCredentialsQuery),
              }).segment('premium', {
                templateUrl: '/src_legacy/app/connect/me/settings/premium.html',
                controller: 'MeSettingsPremiumController',
                resolve: setupQuery(Me.GetMeSettingsPremiumQuery),
                watcher: $routeProvider.defaultRefreshFunction('me.settings.premium'),
              });

            me.segment('offers', {
              templateUrl: '/src_legacy/app/connect/me/special-offers.html',
            });

            me.segment('blog', {
              templateUrl: '/src_legacy/app/connect/me/blog/index.html',
              controller: 'MeBlogController',
            })
              .within()
              .segment('archive', {
                default: true,
                templateUrl: '/src_legacy/app/connect/me/blog/archive.html',
                controller: 'MeBlogArchiveController',
                resolve: setupQuery(Me.GetMeBlogQuery),
              }).segment('create', {
                templateUrl: '/src_legacy/app/connect/me/blog/create.html',
                controller: 'MeBlogCreateController',
              }).segment('edit', {
                templateUrl: '/src_legacy/app/connect/me/blog/edit.html',
                controller: 'MeBlogEditController',
                resolve: setupQuery(Me.GetMeBlogPostQuery),
              });

            me.segment('friends', {
              templateUrl: '/src_legacy/app/connect/me/friends.html',
              controller: 'MeFriendsController',
              resolve: setupQuery(Me.GetMeFriendsQuery),
            });

            me.segment('messages', {
              templateUrl: '/src_legacy/app/connect/me/messages.html',
            }).within()
              .segment('list', {
                default: true,
                controller: 'MeMessagesController',
                templateUrl: '/src_legacy/app/connect/me/messages-list.html',
                resolve: setupQuery(Me.GetMeMessagesQuery)
              })
              .segment('user', {
                templateUrl: '/src_legacy/app/connect/profile/messages.html',
                controller: 'MeUserMessagesController',
                resolve: setupQuery(Me.GetMeUserMessagesQuery),
              });

            var profile = $routeProvider.
              when('/u/:userSlug', 'profile').
              when('/u/:userSlug/blogposts', 'profile.blog').
              when('/u/:userSlug/friends', 'profile.friends').
              when('/u/:userSlug/messages', 'profile.messages').
              when('/u/:userSlug/content', 'profile.content').
              when('/u/:userSlug/content/collections', 'profile.content.aurelia').
              when('/u/:userSlug/content/missions', 'profile.content.aurelia').
              when('/u/:userSlug/content/mods', 'profile.content.aurelia').
              segment('profile', {
                controller: 'ProfileController',
                templateUrl: '/src_legacy/app/connect/profile/index.html',
                dependencies: ['userSlug'],
                resolve: setupQuery(Profile.GetProfileQuery),
              })
              .within();

            profile.segment('content', { default: true })
              .within()
              .segment('aurelia', {});

            profile.segment('blog', {
              templateUrl: '/src_legacy/app/connect/profile/blogposts.html',
              controller: 'ProfileBlogController',
              resolve: setupQuery(Profile.GetProfileBlogQuery),
            });

            profile.segment('friends', {
              templateUrl: '/src_legacy/app/connect/profile/friends.html',
              controller: 'ProfileFriendsController',
              resolve: setupQuery(Profile.GetProfileFriendsQuery),
            });
            profile.segment('messages', {
              templateUrl: '/src_legacy/app/connect/profile/messages.html',
              controller: 'ProfileMessagesController',
              resolve: setupQuery(Profile.GetProfileMessagesQuery),
            });

            // $routeProvider.
            //     when('/wall', 'wall').
            //     segment('wall', {
            //         controller: 'WallController',
            //         templateUrl: '/src_legacy/app/connect/wall/index.html',
            //         resolve: setupQuery('GetWallQuery')
            //     });
          }
        ]);
    }
    siteConfig() {
      this.app
        .config([
          'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
            if (w6.enableAds) {
              // TODO: Consider if we can deal with ads more on the fly instead of at app config?
              doubleClickProvider
                .defineSlot('/' + dfp.publisherId + '/connect_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["connect_rectangle_atf"])
                .defineSlot('/' + dfp.publisherId + '/connect_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["connect_rectangle_btf"])
                .defineSlot('/' + dfp.publisherId + '/connect_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["connect_leaderboard_atf"]);
            }
          }
        ])
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new ConnectModule();
}

export module MyApp.Connect.Me {

  // Fail Test code:
  // public execute = ['$q', (q: ng.IQService) => q.reject("ouch!")]
  // public execute = ['$q', (q: ng.IQService) => q.reject({data: { message: "woopsydaisy" }, statusText: "statusText", status: 666})]
  export class MeQueryBase extends DbQueryBase {
    private getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }

    public getMeData(resource?) { return this.context.getCustom(this.getMeUrl(resource)).then((result) => result.data); }
  }

  export class GetMeSettingsPersonalQuery extends MeQueryBase {
    static $name = "GetMeSettingsPersonal";
    public execute = [() => this.getMeData("settingspersonal")];
  }

  export class GetMeSettingsAvatarQuery extends MeQueryBase {
    static $name = "GetMeSettingsAvatar";
    public execute = [() => this.getMeData("settingsavatar")];
  }

  export class GetMeSettingsCredentialsQuery extends MeQueryBase {
    static $name = "GetMeSettingsCredentials";
    public execute = [() => this.getMeData("settingscredentials")];
  }

  export class GetMeSettingsPremiumQuery extends MeQueryBase {
    static $name = "GetMeSettingsPremium";
    public execute = [() => this.getMeData("settingspremium")];
  }

  export class GetMeBlogQuery extends MeQueryBase {
    static $name = "GetMeBlog";
    public execute = [() => this.getMeData("blog")];
  }

  export class GetMeBlogPostQuery extends MeQueryBase {
    static $name = "GetMeBlogPost";
    public execute = ['slug', (slug) => this.getMeData("blog/" + slug)];
  }

  export class GetMeContentQuery extends MeQueryBase {
    static $name = "GetMeContent";
    public execute = [() => this.getMeData("content")];
  }

  export class GetMeFriendsQuery extends MeQueryBase {
    static $name = "GetMeFriends";
    public execute = [() => this.getMeData("friends")];
  }

  export class GetMeMessagesQuery extends MeQueryBase {
    static $name = "GetMeMessages";
    public execute = [() => this.getMeData("messages")];
  }

  export class GetMeUserMessagesQuery extends MeQueryBase {
    static $name = "GetMeUserMessages";
    public execute = ['slug', (slug) => this.getMeData("messages/" + slug)];
  }


  export class MeCommandbase extends DbCommandBase {
    private getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }

    public postMeData(resource?, data?, requestName?) { return this.context.postCustom(this.getMeUrl(resource), data, { requestName: requestName }).then((result) => result.data); }

    public deleteMeData(resource?, requestName?, params?) { return this.context.deleteCustom(this.getMeUrl(resource), { requestName: requestName, params: params }).then((result) => result.data); }
  }

  export class SaveMeSettingsPersonalCommand extends MeCommandbase {
    static $name = "SaveMeSettingsPersonal";
    public execute = [
      'data', data => this.postMeData("SettingsPersonal", data, "saveMeSettingsPersonal")
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  export class SaveMeSettingsAvatarCommand extends MeCommandbase {
    static $name = "SaveMeSettingsAvatar";
    public execute = [
      'file', file => {
        var fd = new FormData();
        fd.append('file', file);
        return this.context.postCustomFormData("Me/SettingsAvatar", fd, { requestName: 'saveMeSettingsAvatar' })
          .then(result => this.respondSuccess("Sucessfully saved!"))
          .catch(this.respondError);
      }
    ];
  }

  export class SaveMeSettingsCredentialsCommand extends MeCommandbase {
    static $name = "SaveMeSettingsCredentials";
    public execute = [
      'data', data => this.postMeData("SettingsCredentials", data, "saveMeSettingsCredentials")
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  export class SaveMeSettingsEmailCredentialsCommand extends MeCommandbase {
    static $name = "SaveMeSettingsEmailCredentials";
    public execute = [
      'data', data => this.postMeData("SettingsCredentialsEmail", data, "saveMeSettingsCredentials")
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  export class SaveMeSettingsCredentialsOtherCommand extends MeCommandbase {
    static $name = "SaveMeSettingsCredentialsOther";
    public execute = [
      'data', data => this.postMeData("SettingsCredentialsOther", data, "saveMeSettingsCredentialsOther")
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  registerCQ(SaveMeSettingsCredentialsOtherCommand);

  export class CreatePrivateMessageCommand extends MeCommandbase {
    static $name = "CreatePrivateMessage";
    public execute = ['userSlug', 'data', (userSlug, data) => this.postMeData("Messages/" + userSlug, data, "createPrivateMessage")];
  }

  export class CreateBlogPostCommand extends MeCommandbase {
    static $name = "CreateBlogPost";
    public execute = ['data', data => this.postMeData("Blog", data, "createBlogPost")];
  }

  export class UpdateBlogPostCommand extends MeCommandbase {
    static $name = "UpdateBlogPost";
    public execute = ['id', 'data', (id, data) => this.postMeData("Blog/" + id, data, "updateBlogPost")];
  }

  export class DeleteBlogPostCommand extends MeCommandbase {
    static $name = "DelteBlogPost";
    public execute = ['id', id => this.deleteMeData("Blog/" + id, "deleteBlogPost")];
  }

  export class AcceptFriendRequestCommand extends MeCommandbase {
    static $name = "AcceptFriendRequest";
    public execute = ['friendId', id => this.postMeData("Friends/" + id, null, "acceptFriendRequest")];
  }

  export class DenyFriendRequestCommand extends MeCommandbase {
    static $name = "DenyFriendRequest";
    public execute = ['friendId', id => this.deleteMeData("Friends/" + id, "denyFriendRequest")];
  }

  export class CancelPremiumRecurringCommand extends MeCommandbase {
    static $name = "CancelPremiumRecurring";
    public execute = [
      'model', (model) => this.deleteMeData("SettingsPremium", "cancelPremium", model)
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  export class SavePremiumCommand extends MeCommandbase {
    static $name = "SavePremium";
    public execute = [
      'data', (data) => this.postMeData("SettingsPremium", data, "savePremium")
        .then(result => this.respondSuccess("Sucessfully saved!"))
        .catch(this.respondError)
    ];
  }

  export class ClearAvatarCommand extends MeCommandbase {
    static $name = "ClearAvatar";
    public execute = [() => this.deleteMeData("SettingsAvatar", "clearAvatar")];
  }

  registerCQ(GetMeContentQuery);
  registerCQ(GetMeBlogQuery);
  registerCQ(GetMeBlogPostQuery);
  registerCQ(GetMeFriendsQuery);
  registerCQ(GetMeMessagesQuery);
  registerCQ(GetMeUserMessagesQuery);
  registerCQ(GetMeSettingsPersonalQuery);
  registerCQ(GetMeSettingsAvatarQuery);
  registerCQ(GetMeSettingsCredentialsQuery);
  registerCQ(GetMeSettingsPremiumQuery);

  registerCQ(CreateBlogPostCommand);
  registerCQ(UpdateBlogPostCommand);
  registerCQ(DeleteBlogPostCommand);

  registerCQ(AcceptFriendRequestCommand);
  registerCQ(DenyFriendRequestCommand);

  registerCQ(SaveMeSettingsPersonalCommand);
  registerCQ(SaveMeSettingsAvatarCommand);
  registerCQ(SaveMeSettingsCredentialsCommand);
  registerCQ(SaveMeSettingsEmailCredentialsCommand);

  registerCQ(CreatePrivateMessageCommand);

  registerCQ(ClearAvatarCommand);
  registerCQ(CancelPremiumRecurringCommand);
  registerCQ(SavePremiumCommand);

  interface IMeScope extends IBaseScope {
    getFullName: () => string
  }

  class MeController extends BaseController {
    static $name = "MeController";
    static $inject = ['$scope', 'logger', 'ForwardService', '$q'];

    constructor(public $scope: IMeScope, public logger, forwardService: Components.ForwardService, $q) {
      super($scope, logger, $q);

      var items = [];
      items.push({ header: "Settings", segment: "settings", icon: "fa fa-cog", isDefault: true });
      if ($scope.w6.userInfo.isAdmin || $scope.w6.userInfo.isManager)
        items.push({ header: "Blog", segment: "blog", icon: "fa fa-book" });
      items.push({ header: "Content", segment: "content", icon: "fa fa-th-large" });
      items.push({ header: "Friends", segment: "friends", icon: "fa fa-group" });
      items.push({ header: "Messages", segment: "messages", icon: "fa fa-comments" });
      //items.push({ header: "Special Offers", segment: "offers", icon: "icon withSIX-icon-Notification" });

      $scope.getFullName = () => {
        var ar = [];
        if ($scope.w6.userInfo.firstName) ar.push($scope.w6.userInfo.firstName);
        if ($scope.w6.userInfo.lastName) ar.push($scope.w6.userInfo.lastName);
        return ar.join(" ");
      };
      $scope.menuItems = this.getMenuItems(items, "me");
    }
  }

  class MeSettingsController extends BaseController {
    static $name = "MeSettingsController";

    constructor(public $scope: IBaseScope, public logger, $q) {
      super($scope, logger, $q);
      var menuItems = <Array<IMenuItem>>[
        { header: "Personal", segment: "personal", isDefault: true, icon: "fa fa-user" },
        { header: "Avatar", segment: "avatar", icon: "fa fa-picture-o" },
        { header: "Credentials", segment: "credentials", icon: "fa fa-key" }
      ];

      menuItems.push({ header: "Premium", segment: "premium", mainSegment: $scope.w6.userInfo.isPremium ? null : "globalMenu", icon: "icon withSIX-icon-Badge-Sponsor", cls: "premium" });

      $scope.menuItems = this.getMenuItems(menuItems, "me.settings", true);
    }
  }

  interface IMeSettingsPersonalScope extends IBaseScopeT<any> {
    open: ($event) => void;
    today: Date;
    save: (form) => any;
  }

  class MeSettingsPersonalController extends BaseQueryController<any> {
    static $name = "MeSettingsPersonalController";

    constructor(public $scope: IMeSettingsPersonalScope, public logger, $q, model) {
      super($scope, logger, $q, model);

      $scope.today = new Date();
      $scope.save = (form) => this.requestAndProcessResponse(SaveMeSettingsPersonalCommand, { data: $scope.model })
        .then((data) => {
          form.$setPristine();
          $scope.$emit('myNameChanged', { firstName: $scope.model.firstName, lastName: $scope.model.lastName });
        });
    }
  }

  interface IMeSettingsPremiumScope extends IBaseScopeT<any> {
    cancelPremium: () => any;
    save: (form) => any;
    cancelModel: { password: string; reason?: string };
  }

  class MeSettingsPremiumController extends BaseQueryController<any> {
    static $name = "MeSettingsPremiumController";
    static $inject = ['$scope', 'logger', '$q', 'model', 'refreshService'];

    constructor(public $scope: IMeSettingsPremiumScope, public logger, $q, model, refreshService) {
      super($scope, logger, $q, model);
      $scope.cancelModel = { password: "", reason: "" };
      $scope.cancelPremium = () => this.requestAndProcessResponse(CancelPremiumRecurringCommand, { model: $scope.cancelModel })
        .then((result) => refreshService.refreshType('me.settings.premium'));

      $scope.save = (form) => this.requestAndProcessResponse(SavePremiumCommand, { data: { hidePremium: model.hidePremium } })
        .then((result) => form.$setPristine());
    }
  }

  interface IMeSettingsCredentialsScope extends IBaseScopeT<any> {
    save: (form) => any;
    saveOther: (form) => any;
    connectExternal: (system) => any;
    modelOther: { twoFactorEnabled };
    openForgotPasswordDialog: () => any;
  }

  class MeSettingsCredentialsController extends BaseQueryController<any> {
    static $name = "MeSettingsCredentialsController";

    static $inject = ['$scope', 'logger', '$q', '$window', '$location', 'model'];

    constructor(public $scope: IMeSettingsCredentialsScope, public logger, $q, $window, $location, model) {
      super($scope, logger, $q, model);

      $scope.modelOther = { twoFactorEnabled: model.twoFactorEnabled };
      $scope.save = form => {
        if ($scope.model.emailConfirmed)
          return this.requestAndProcessResponse(SaveMeSettingsCredentialsCommand, { data: $scope.model })
            .then((result) => $window.location.reload());
        else
          return this.requestAndProcessResponse(SaveMeSettingsEmailCredentialsCommand, { data: $scope.model })
            .then((result) => $window.location.reload());
      };

      // TODO: Second controller
      $scope.saveOther = form => this.requestAndProcessResponse(SaveMeSettingsCredentialsOtherCommand, { data: $scope.modelOther })
        .then((result) => form.$setPristine());

      $scope.connectExternal = system =>
        this.forward($scope.url.connect + "/login/" + system + "?connect=true&fingerprint=" + new Fingerprint().get() + ($scope.model.rememberMe ? "&rememberme=true" : ""), $window, $location);

      $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
    }
  }

  interface IMeSettingsAvatarScope extends IBaseScopeT<any> {
    clearAvatar: () => any;
    uploadAvatar: (form) => any;
    updateFileInfo: (files) => any;
    files: Object[];
    refresh: number;
  }

  class MeSettingsAvatarController extends BaseQueryController<any> {
    static $name = "MeSettingsAvatarController";

    constructor(public $scope: IMeSettingsAvatarScope, public logger, $q, model) {
      super($scope, logger, $q, model);

      this.$scope.files = [];
      this.$scope.model.avatarUrl = $scope.url.calculateAvatarUrl(this.getUserModel(), 400);

      $scope.clearAvatar = () => $scope.request(ClearAvatarCommand)
        .then(this.avatarCleared)
        .catch(this.httpFailed);

      $scope.updateFileInfo = (files) => $scope.files = files;

      $scope.uploadAvatar = (form) => {
        this.requestAndProcessResponse(SaveMeSettingsAvatarCommand, { file: $scope.files[0] })
          .then((data) => this.avatarUploaded(data, form));
      };
    }

    private avatarCleared = (data) => {
      this.$scope.model.hasAvatar = false;
      this.avatarChanged();
    };
    private avatarUploaded = (data, form) => {
      (<HTMLFormElement>document.forms[form.$name]).reset();
      this.$scope.files = [];
      this.$scope.model.hasAvatar = true;
      this.$scope.model.avatarURL = this.$scope.url.contentCdn + "/account/" + this.$scope.w6.userInfo.id + "/profile/avatar/";
      this.$scope.model.avatarUpdatedAt = new Date().toISOString();
      this.avatarChanged();
    };

    private getUserModel() {
      var info = angular.copy(this.$scope.model);
      info.id = this.$scope.w6.userInfo.id;
      return info;
    }

    private avatarChanged() {
      this.$scope.model.avatarUrl = this.$scope.url.calculateAvatarUrl(this.getUserModel(), 400);
      // TODO: We could actually move this into the commandhandlers instead, and $broadcast on the $rootScope instead?
      // $emit sends events up the tree, to parent scopes
      // $broadcast sends events down the tree, to child scopes
      this.$scope.$emit("myAvatarChanged", this.$scope.model);
    }
  }

  class MeBlogController extends BaseController {
    static $name = "MeBlogController";

    constructor(public $scope: IBaseScope, public logger, $q) {
      super($scope, logger, $q);

      $scope.menuItems = this.getMenuItems([
        { header: "Archive", segment: "archive", icon: "fa fa-list-ul", isDefault: true },
        { header: "Create", segment: "create", icon: "fa fa-plus-sign" }
      ], "me.blog");
    }
  }

  class MeContentController extends BaseQueryController<any> {
    static $name = "MeContentController";

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model) {
      super($scope, logger, $q, model);

      var menuItems = [
        { header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection", isDefault: true },
        { header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" },
        { header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" }
      ];

      $scope.menuItems = this.getMenuItems(menuItems, "me.content");
    }
  }

  class MeFriendsController extends BaseQueryController<any> {
    static $name = "MeFriendsController";

    constructor(public $scope, public logger, $q, model) {
      super($scope, logger, $q, model);

      $scope.accept = (friendRequest) => this.processCommand($scope.request(AcceptFriendRequestCommand, { friendId: friendRequest.sender.id }))
        .then((data) => Tools.removeEl(model.friendshipRequests, friendRequest));
      $scope.deny = (friendRequest) => this.processCommand($scope.request(DenyFriendRequestCommand, { friendId: friendRequest.sender.id }))
        .then((data) => Tools.removeEl(model.friendshipRequests, friendRequest));
    }
  }

  class MeMessagesController extends BaseQueryController<any> {
    static $name = "MeMessagesController";

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model) {
      super($scope, logger, $q, model);
    }
  }

  class MeUserMessagesController extends BaseQueryController<any> {
    static $name = "MeUserMessagesController";

    constructor(public $scope, public logger, $q, model) {
      super($scope, logger, $q, model);

      $scope.inputModel = { message: "" };
      $scope.sendMessage = this.sendMessage;
    }

    sendMessage = form =>
      this.processCommand(this.$scope.request(CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
        .then((data) => {
          this.$scope.model.messages.push({ message: this.$scope.inputModel.body, receivedAt: new Date(), isAuthor: true });
          this.$scope.inputModel.body = "";
          form.$setPristine();
        }));
  }

  class MeBlogArchiveController extends BaseQueryController<any> {
    static $name = "MeBlogArchiveController";
  }

  class MeBlogCreateController extends BaseController {
    static $name = "MeBlogCreateController";
    static $inject = ['$scope', 'logger', '$q', '$routeSegment', '$location'];

    constructor(public $scope, public logger, $q, $routeSegment, $location: ng.ILocationService) {
      super($scope, logger, $q);
      var back = () => $location.url($routeSegment.getSegmentUrl("me.blog"));
      $scope.model = { created: new Date() };
      $scope.updateDate = () => $scope.model.created = new Date();
      $scope.cancel = () => back();
      $scope.save = form => this.processCommand($scope.request(CreateBlogPostCommand, { data: $scope.model }))
        .then(() => {
          form.$setPristine();
          back();
        });
    }
  }

  export interface IMeBlogEditScope extends IBaseScopeT<any> {
    save: (form) => any;
    delete: () => any;
    cancel: () => void;
    updateDate: () => Date;
  }

  class MeBlogEditController extends BaseQueryController<any> {
    static $name = "MeBlogEditController";
    static $inject = ['$scope', 'logger', '$q', 'model', '$routeSegment', '$location'];

    constructor(public $scope: IMeBlogEditScope, public logger, $q, model, $routeSegment, $location: ng.ILocationService) {
      super($scope, logger, $q, model);

      var back = () => $location.url($routeSegment.getSegmentUrl("me.blog"));

      $scope.save = form => this.processCommand($scope.request(UpdateBlogPostCommand, { id: model.id, data: model }))
        .then(() => {
          form.$setPristine();
          back();
        });

      $scope.updateDate = () => $scope.model.created = new Date();

      $scope.cancel = () => back();
      $scope.delete = () => this.processCommand($scope.request(DeleteBlogPostCommand, { id: model.id }), 'Post deleted')
        .then(() => back());
    }
  }

  registerController(MeController);

  registerController(MeMessagesController);
  registerController(MeUserMessagesController);
  registerController(MeFriendsController);
  registerController(MeContentController);

  registerController(MeSettingsController);
  registerController(MeSettingsPersonalController);
  registerController(MeSettingsPremiumController);
  registerController(MeSettingsCredentialsController);
  registerController(MeSettingsAvatarController);

  registerController(MeBlogController);
  registerController(MeBlogArchiveController);
  registerController(MeBlogCreateController);
  registerController(MeBlogEditController);
}

export module MyApp.Connect.Pages {
  export class VerifyCommand extends DbCommandBase {
    static $name = 'Verify';
    public execute = ['code', code => this.context.postCustom("user/activate/" + code, {}, { requestName: 'activate' })];
  }

  export class ResetPasswordCommand extends DbCommandBase {
    static $name = 'ResetPassword';
    public execute = ['data', data => this.context.postCustom("user/reset-password", data, { requestName: 'resetPassword' })];
  }

  /*    export class FinalizeCommand extends DbCommandBase {
          static $inject = ['dbContext', '$q', 'w6'];
          constructor(public context: W6Context, public $q: ng.IQService, private w6: W6) {
              super(context, $q);
          }

          static $name = 'Finalize';
          public execute = [
              'data', (data) => this.context.postCustom(this.w6.url.authSsl + "/api/register/finalize", data, { requestName: 'finalize' })
              .then(result => this.respondSuccess('Succesfully registered'))
              .catch(this.respondError)
          ];
      }*/

  registerCQ(ResetPasswordCommand);
  registerCQ(VerifyCommand);
  //registerCQ(FinalizeCommand);

  class ResendActivationController extends BaseController {
    static $name = "ResendActivationController";
    static $inject = ['$scope', 'logger', '$q', '$routeParams'];

    constructor(public $scope, public logger, $q, $routeParams) {
      super($scope, logger, $q);

      $scope.model = {
        email: $routeParams.email,
        fingerPrint: new Fingerprint().get()
      };
      $scope.submit = () => this.requestAndProcessResponse(Components.Dialogs.ResendActivationCommand, { data: $scope.model });
    }
  }

  registerController(ResendActivationController);

  class ForgotPasswordController extends BaseController {
    static $name = "ForgotPasswordController";
    static $inject = ['$scope', 'logger', '$q', '$routeParams'];

    constructor(public $scope, public logger, $q, $routeParams) {
      super($scope, logger, $q);

      $scope.model = {};
      $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotPasswordCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
    }
  }

  registerController(ForgotPasswordController);

  class ForgotUsernameController extends BaseController {
    static $name = "ForgotUsernameController";
    static $inject = ['$scope', 'logger', '$q', '$routeParams'];

    constructor(public $scope, public logger, $q, $routeParams) {
      super($scope, logger, $q);

      $scope.model = {};
      $scope.submit = () => this.processCommand($scope.request(Components.Dialogs.ForgotUsernameCommand, { data: $scope.model }).then(result => $scope.success = true), "Request sent!");
    }
  }

  registerController(ForgotUsernameController);

  class ResetPasswordController extends BaseController {
    static $name = "ResetPasswordController";
    static $inject = ['$scope', 'logger', '$q', '$routeParams'];

    constructor(public $scope, public logger, $q, $routeParams) {
      super($scope, logger, $q);

      $scope.model = {
        password: "",
        confirmPassword: "",
        passwordResetCode: $routeParams.resetCode
      };
      // TODO
      $scope.tokenKnown = true;

      $scope.submit = () => this.processCommand($scope.request(ResetPasswordCommand, { data: $scope.model })
        .then(result => $scope.success = true));
    }
  }

  registerController(ResetPasswordController);

  /*    class FinalizeController extends BaseController {
          static $name = 'FinalizeController'

          constructor(public $scope, public logger, $q) {
              super($scope, logger, $q);

              $scope.model = { fingerPrint: new Fingerprint().get() };
              $scope.finalize = () => this.requestAndProcessResponse(FinalizeCommand, { data: $scope.model });
              $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
          }
      }

      registerController(FinalizeController);*/


  class RegisterController extends BaseController {
    static $name = "RegisterController";

    constructor(public $scope, public logger, $q) {
      super($scope, logger, $q);

      $scope.model = { fingerPrint: new Fingerprint().get() };
      $scope.register = () => this.requestAndProcessResponse(Components.Dialogs.RegisterCommand, { data: $scope.model });
      $scope.openForgotPasswordDialog = () => $scope.request(Components.Dialogs.OpenForgotPasswordDialogQuery, { email: $scope.model.email });
      //$scope.openLoginDialog = () => $scope.request(Components.Dialogs.OpenLoginDialogQuery);
    }
  }

  registerController(RegisterController);
}

export module MyApp.Connect.Profile {

  export class ProfileQueryBase extends DbQueryBase {
    private getUserUrl(userSlug, resource?) { return "profile/" + this.context.getUserSlugCache(userSlug) + (resource ? "/" + resource : ""); }

    public getUserProfileData(userSlug, resource?) { return this.context.getCustom(this.getUserUrl(userSlug, resource)).then((result) => result.data); }
  }

  export class GetProfileQuery extends ProfileQueryBase {
    static $name = "GetProfile";
    public execute = [
      'userSlug', (userSlug) => this.context.getCustom("profile/" + userSlug)
        .then((result) => {
          var userProfile = <any>result.data;
          this.context.addUserSlugCache(userSlug, userProfile.id);
          return userProfile;
        })
    ];
  }

  export class GetProfileMessagesQuery extends ProfileQueryBase {
    static $name = "GetProfileMessages";
    public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "messages")];
  }

  export class GetProfileBlogQuery extends ProfileQueryBase {
    static $name = "GetProfileBlog";
    public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "blogposts")];
  }

  export class GetProfileFriendsQuery extends ProfileQueryBase {
    static $name = "GetProfileFriends";
    public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "friends")];
  }

  export class ProfileCommandbase extends DbCommandBase {
    private getUserUrl(userSlug, resource?) { return "profile/" + this.context.getUserSlugCache(userSlug) + (resource ? "/" + resource : ""); }

    public postProfileData(userSlug, resource?, data?, requestName?) { return this.context.postCustom(this.getUserUrl(userSlug, resource), data, { requestName: requestName }).then((result) => result.data); }

    public deleteProfileData(userSlug, resource?, requestName?) { return this.context.deleteCustom(this.getUserUrl(userSlug, resource), { requestName: requestName }).then((result) => result.data); }
  }

  export class AddAsFriendCommand extends ProfileCommandbase {
    static $name = "AddAsFriend";
    public execute = ['userSlug', (userSlug) => this.postProfileData(userSlug, "friends", undefined, "addAsFriend")];
  }

  export class RemoveAsFriendCommand extends ProfileCommandbase {
    static $name = "RemoveAsFriend";
    public execute = ['userSlug', (userSlug) => this.deleteProfileData(userSlug, "friends", "removeAsFriend")];
  }

  registerCQ(GetProfileQuery);
  registerCQ(GetProfileMessagesQuery);
  registerCQ(GetProfileFriendsQuery);
  registerCQ(GetProfileBlogQuery);
  registerCQ(AddAsFriendCommand);
  registerCQ(RemoveAsFriendCommand);

  export interface IProfileScope extends IBaseScopeT<any> {
    addFriend;
    removeFriend;
  }

  class ProfileController extends BaseQueryController<any> {
    static $name = "ProfileController";

    constructor(public $scope: IProfileScope, public logger, $q, model) {
      super($scope, logger, $q, model);
      var menuItems = [
        { header: "Content", segment: "content", icon: "fa fa-th", isDefault: true },
        { header: "Blogposts", segment: "blog", icon: "fa fa-book" },
        { header: "Friends", segment: "friends", icon: "fa fa-group" }
      ];

      if (model.isFriend)
        menuItems.push({ header: "Send message to", segment: "messages", icon: "fa fa-comments" });

      $scope.menuItems = this.getMenuItems(menuItems, "profile");
      // TODO: Switch menuitems based on isFriend dynamically changing
      $scope.addFriend = () => this.processCommand($scope.request(AddAsFriendCommand, { userSlug: model.slug })
        .then((data) => model.isFriend = true));
      $scope.removeFriend = () => this.processCommand($scope.request(RemoveAsFriendCommand, { userSlug: model.slug })
        .then((data) => model.isFriend = false));
    }
  }

  class ProfileBlogController extends BaseQueryController<any> {
    static $name = "ProfileBlogController";
  }

  class ProfileMessagesController extends BaseQueryController<any> {
    static $name = "ProfileMessagesController";

    constructor(public $scope, public logger, $q, model) {
      super($scope, logger, $q, model);

      $scope.inputModel = { message: "" };
      $scope.sendMessage = form =>
        this.processCommand(this.$scope.request(Me.CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
          .then((data) => {
            this.$scope.model.messages.push({ message: this.$scope.inputModel.body, receivedAt: new Date(), isAuthor: true });
            this.$scope.inputModel.body = "";
            form.$setPristine();
          }));
    }
  }

  class ProfileFriendsController extends BaseQueryController<any> {
    static $name = "ProfileFriendsController";
  }

  class ProfileContentController extends BaseController {
    static $name = "ProfileContentController";

    constructor(public $scope: IBaseScope, public logger, $q) {
      super($scope, logger, $q);
      var menuItems = [
        { header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection", isDefault: true },
        { header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" },
        { header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" }
      ];

      $scope.menuItems = this.getMenuItems(menuItems, "profile.content");
    }
  }

  registerController(ProfileController);
  registerController(ProfileBlogController);
  registerController(ProfileFriendsController);
  registerController(ProfileMessagesController);
  registerController(ProfileContentController);
}


export module MyApp.Connect.Wall {
  export interface IWallScope extends IBaseScope {
    posts: any[];
    contacts: any[];
    contactListShown: boolean;
    showContactList: {};
  }

  export class WallController extends BaseController {
    static $name = 'WallController';
    static $inject = [
      '$q', '$scope', '$timeout',
      '$cookieStore', '$location', '$routeParams', 'w6',
      'logger', 'signalrService'
    ];

    constructor(public $q: ng.IQService, public $scope: IWallScope, private $timeout: ng.ITimeoutService,
      public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
      public logger: Components.Logger.ToastLogger, private signalrService) {

      super($scope, logger, $q);

      $scope.contactListShown = false;
      $scope.showContactList = () => {
        $scope.contactListShown = !$scope.contactListShown;
      };
      this.getStream();
      this.getContacts();
    }

    // TODO: Convert to Query Objects
    private getStream() {
      this.getStreamQuery()
        .then(this.querySucceeded)
        .catch(this.breezeQueryFailed);
    }

    private getContacts() {
      this.getContactsQuery()
        .then(this.usersQuerySucceeded)
        .catch(this.breezeQueryFailed);
    }

    public querySucceeded = (data) => {
      this.$scope.posts = data.results;
    };
    usersQuerySucceeded = (data) => {
      this.$scope.contacts = data.results;
    }; // TODO: Convert to CDNUrl (currently AzureCDN)
    placeHolderAvatar = "//withsix.azureedge.net/img/avatar/noava_48.jpg";

    getPlaceHolderComment() {
      return {
        author: {
          displayName: "Sven",
          avatar: this.placeHolderAvatar
        },
        createdAt: Date.now(),
        content: "I really dig this stuff!<br />some basic text without formatting<br />not too shabby..."
      };
    }

    getPlaceHolderPost(commentCount) {
      var comments = [];
      for (var i = 0; i < commentCount; i++) {
        comments.push(this.getPlaceHolderComment());
      }
      return {
        title: "Someones first post",
        author: {
          displayName: "Martin",
          avatar: this.placeHolderAvatar
        },
        content: "Most awesome-est post<br />gotto love it",
        createdAt: Date.now(),
        comments: comments
      };
    }

    getStreamQuery() {
      var deferred = this.$q.defer();
      deferred.resolve({
        results: [
          this.getPlaceHolderPost(1),
          this.getPlaceHolderPost(2),
          this.getPlaceHolderPost(3),
          this.getPlaceHolderPost(4),
          this.getPlaceHolderPost(3),
          this.getPlaceHolderPost(2),
          this.getPlaceHolderPost(1),
          this.getPlaceHolderPost(4)
        ]
      });

      return deferred.promise;
    }

    getContactsQuery() {
      var deferred = this.$q.defer();
      deferred.resolve({
        results: [
          {
            displayName: "Martin",
            slug: "martin",
            avatar: this.placeHolderAvatar
          }, {
            displayName: "Sven",
            slug: "paragraphic-l",
            avatar: this.placeHolderAvatar
          }, {
            displayName: "Oliver",
            slug: "ocbaker",
            avatar: this.placeHolderAvatar
          }, {
            displayName: "Group 1",
            slug: "group-1",
            avatar: this.placeHolderAvatar
          }, {
            displayName: "Group 2",
            slug: "group-2",
            avatar: this.placeHolderAvatar
          }
        ]
      });
      return deferred.promise;
    }
  }

  registerController(WallController);
}

export module MyApp.Kb {
  angular.module('MyAppKbTemplates', []);

  class KbModule extends Tk.Module {
    static $name = "KbModule";

    constructor() {
      super('MyAppKb', ['app', 'ngRoute', 'ngDfp', 'commangular', 'route-segment', 'view-segment', 'Components', 'MyAppKbTemplates']);
      this.app
        .config([
          'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
            if (w6.enableAds) {
              // TODO: Consider if we can deal with ads more on the fly instead of at app config?
              doubleClickProvider
                .defineSlot('/' + dfp.publisherId + '/main_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["main_rectangle_atf"])
                .defineSlot('/' + dfp.publisherId + '/main_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["main_rectangle_btf"])
                .defineSlot('/' + dfp.publisherId + '/main_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["main_leaderboard_atf"]);
            }
          }
        ])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            // TODO: Latest should just become a NG action etc...
            $routeProvider
              .when('/', 'static_root')
              .when('/:page*', 'static_root')
              .segment('static_root', {
                controller: 'KbStaticMainController',
                templateUrl: '/src_legacy/app/kb/index.html',
                resolve: setupQuery(GetKbQuery),
              });
          }
        ])
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new KbModule();

  interface IKbModel {
    title: string;
    doc: string;
  }

  // Load Md's
  class KbStaticMainController extends BaseQueryController<IKbModel> {
    static $name = 'KbStaticMainController';
    static $inject = ['$scope', 'logger', '$q', '$routeParams', 'model'];

    constructor(public $scope: IBaseScopeT<IKbModel>, public logger, public $q, $routeParams, model: IKbModel) {
      super($scope, logger, $q, model);
      $scope.$on('$routeChangeSuccess', () => {
        $scope.model = null;
        $scope.request(GetKbQuery, { '$routeParams': $routeParams }).then(result => $scope.model = result.lastResult);
      });
    }
  }

  registerController(KbStaticMainController);


  class GetKbQuery extends DbQueryBase {
    static $name = 'GetKb';

    public execute = [
      '$routeParams', routeParams => this.context.getDocMd((routeParams.page || 'index') + '.md', true)
        .then(data => {
          return {
            // TODO: Improve nonsense
            doc: (<string>data).replace(/\[([^\]]+)]\(([^\/])(.*)/g, "[$1](/$2$3").replace(/\/http(s?):/g, "http$1:"),
            page: routeParams.page,
            title: routeParams.page ? routeParams.page.split('/').map(v => this.fixStr(v).replace(/_/g, ' ')).join('\\') : 'Home'
          };
        })
    ];

    fixStr(str) {
      var out = str.replace(/^\s*/, ""); // strip leading spaces
      out = out.replace(/^[a-z]|[^\s][A-Z]/g, (str, offset) => {
        if (offset == 0) {
          return (str.toUpperCase());
        } else {
          return (str.substr(0, 1) + " " + str.substr(1).toLowerCase());
        }
      });
      return (out);
    }

  }

  registerCQ(GetKbQuery);
}

export module MyApp.Main {
  angular.module('MyAppMainTemplates', []);

  class MainModule extends Tk.Module {
    static $name = "MainModule";

    constructor() {
      super('MyAppMain', ['app', 'ngRoute', 'ngDfp', 'commangular', 'route-segment', 'view-segment', 'Components', 'MyAppMainTemplates']);

      this.app.config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
      this.siteConfig();
    }
    siteConfig() {
      this.app
        .config([
          'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
            if (w6.enableAds) {
              // TODO: Consider if we can deal with ads more on the fly instead of at app config?
              doubleClickProvider
                .defineSlot('/' + dfp.publisherId + '/main_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["main_rectangle_atf"])
                .defineSlot('/' + dfp.publisherId + '/main_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["main_rectangle_btf"])
                .defineSlot('/' + dfp.publisherId + '/main_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["main_leaderboard_atf"])
                .defineSlot('/' + dfp.publisherId + '/main_leaderboard_btf', leaderboardSlotSizes, 'angular-ad-leader2', w6.ads.slots["main_leaderboard_btf"])
                .defineSlot('/' + dfp.publisherId + '/main_skyscraper_atf', skyscraperSlotSizes, 'angular-ad-sky', w6.ads.slots["main_skyscraper_atf"])
                .defineSlot('/' + dfp.publisherId + '/main_skyscraper_btf', skyscraperSlotSizes, 'angular-ad-sky2', w6.ads.slots["main_skyscraper_btf"]);
            }
          }
        ])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            // TODO: Latest should just become a NG action etc...
            $routeProvider
              .when('/', 'static_root')
              .when('/download', 'static_download')
              .when('/getting-started', 'static_getting-started')
              .when('/getting-started-publishing', 'static_getting-started-publishing')
              .when('/legal', 'static_legal')
              .when('/orders/:orderId/:action?', 'static_orders')
              .when('/orders/:orderId/:action/:subaction', 'static_orders')
              .when('/support', 'static_community')
              .when('/community', 'static_community')
              .when('/update', 'static_update')
              .segment('static_orders', { controller: 'AureliaPageController' })
              .segment('static_community', { controller: 'AureliaPageController' })
              .segment('static_root', { controller: 'AureliaPageController' })
              .segment('static_getting-started', { controller: 'AureliaPageController' })
              .segment('static_getting-started-publishing', { controller: 'AureliaPageController' })
              .segment('static_legal', { controller: 'AureliaPageController' })
              .segment('static_download', { controller: 'AureliaPageController' })
              .segment('static_update',
              { controller: 'AureliaPageController' }
              );

            var global = $routeProvider
              .when('/changelog/:nolayout?', 'globalMenu.changelog')
              .when('/gopremium', 'globalMenu.premium')
              .when('/download/start', 'globalMenu.download_start')
              .when('/blog', 'globalMenu.blog')
              .when('/blog/team', 'globalMenu.blog_team')
              .when('/blog/archive/:year/:month', 'globalMenu.blog_archive')
              .when('/blog/team/archive/:year/:month', 'globalMenu.blog_team_archive')
              .when('/blog/:slug', 'globalMenu.blog_show')
              .segment('globalMenu', {
                controller: 'MainController',
                templateUrl: '/src_legacy/app/main/main.html'
              }).within();

            global.segment('changelog', {
              templateUrl: '/src_legacy/app/main/changelog/show.html',
              controller: 'ChangelogController',
              resolve: setupQuery(Changelog.GetChangelogQuery)
            });

            global
              .segment('download_start', {
                controller: 'DownloadStartController',
                templateUrl: '/src_legacy/app/main/download/start.html'
              });

            global.segment('premium', {
              templateUrl: '/src_legacy/app/main/premium/premium.html',
            }).within()
              .segment('form', {
                default: true,
                controller: 'PremiumController',
                templateUrl: '/src_legacy/app/main/premium/_premium-form.html',
                resolve: setupQuery(Premium.GetPremiumQuery),
              });

            global.segment('blog', {
              controller: 'BlogsController',
              templateUrl: '/src_legacy/app/main/blog/index.html',
              resolve: {
                model: setupQueryPart(Blog.GetBlogsQuery, { team: false }),
                postArchive: setupQueryPart(Blog.GetBlogArchiveSideQuery, { team: false }),
                recentPosts: setupQueryPart(Blog.GetBlogRecentQuery, { team: false })
              }
            })
              .segment('blog_team', {
                controller: 'BlogsController',
                templateUrl: '/src_legacy/app/main/blog/index.html',
                resolve: {
                  model: setupQueryPart(Blog.GetBlogsQuery, { team: true }),
                  postArchive: setupQueryPart(Blog.GetBlogArchiveSideQuery, { team: true }),
                  recentPosts: setupQueryPart(Blog.GetBlogRecentQuery, { team: true })
                }
              })
              .segment('blog_archive', {
                controller: 'BlogArchiveController',
                templateUrl: '/src_legacy/app/main/blog/archive.html',
                resolve: {
                  model: setupQueryPart(Blog.GetBlogArchiveQuery, { team: false }),
                  postArchive: setupQueryPart(Blog.GetBlogArchiveSideQuery, { team: false }),
                  recentPosts: setupQueryPart(Blog.GetBlogRecentQuery, { team: false })
                }
              })
              .segment('blog_team_archive', {
                controller: 'BlogArchiveController',
                templateUrl: '/src_legacy/app/main/blog/archive.html',
                resolve: {
                  model: setupQueryPart(Blog.GetBlogArchiveQuery, { team: true }),
                  postArchive: setupQueryPart(Blog.GetBlogArchiveSideQuery, { team: true }),
                  recentPosts: setupQueryPart(Blog.GetBlogRecentQuery, { team: true })
                }
              });

            global
              .segment('blog_show', {
                dependencies: ['slug'],
                templateUrl: '/src_legacy/app/main/blog/show.html',
                controller: 'BlogController',
                resolve: {
                  post: setupQueryPart(Blog.GetBlogQuery),
                  postArchive: setupQueryPart(Blog.GetBlogArchiveSideQuery, { team: false }), // TODO: Hmmm.. Team...
                  recentPosts: setupQueryPart(Blog.GetBlogRecentQuery, { team: false }) // TODO: Hmmm.. Team...
                }
              });
          }
        ]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new MainModule();

  class MainController extends BaseController {
    static $name = 'MainController';

    constructor(public $scope: IBaseScope, public logger, public $q) {
      super($scope, logger, $q);
      var items = [
        { header: "Get started", segment: "static_getting-started", mainSegment: "", isRight: false, icon: null, cls: null, url: null },
        { header: "Download", segment: "static_download", mainSegment: "" },
        { header: "Our Blog", segment: "blog" },
        { header: "Community", segment: "static_community", mainSegment: "" }
      ];
      if (!$scope.w6.userInfo.isPremium)
        items.push({ header: "Go Premium", segment: "premium", isRight: true, icon: "icon withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
      $scope.menuItems = this.getMenuItems(items, "globalMenu");
    }
  }

  registerController(MainController);

  export interface IDownloadScope extends IBaseScope {
    model: { basket: string; redir: string; client: string };
  }

  class DownloadController extends BaseController {
    static $name = 'DownloadController';
    static $inject = ['$scope', 'logger', '$q', '$location'];
    enableBasket = false;

    constructor(public $scope: IDownloadScope, public logger, public $q, public $location: ng.ILocationService) {
      super($scope, logger, $q);
      this.enableBasket = $scope.w6.enableBasket;
      var redirectUri = $location.search()["redirect"];
      $scope.model = {
        basket: this.enableBasket ? "&basket=1" : null,
        redir: redirectUri ? "&redirect=" + encodeURIComponent(redirectUri) : null,
        client: $scope.w6.enableBasket ? "Sync" : "withSIX"
      }
    }
  }

  registerController(DownloadController);

  export interface IDownloadStartScope extends IBaseScope {
    model: { type: string; counter: number; enableBasket: boolean; };
  }


  class DownloadStartController extends BaseController {
    static $name = 'DownloadStartController';
    static $inject = ['$scope', 'logger', '$q', '$location', '$interval'];

    constructor(public $scope: IDownloadStartScope, public logger, public $q, public $location: ng.ILocationService, public $interval: ng.IIntervalService) {
      super($scope, logger, $q);

      var type = $location.search()["type"];
      $scope.model = {
        type: type,
        counter: 8,
        enableBasket: $scope.w6.enableBasket && !$scope.w6.basketUrlDisabled()
      }

      this.initiateDownload();
    }

    downloaded = false;

    private initiateDownload() {
      if (this.$scope.w6.userInfo.isPremium) {
        this.startDownload();
        return;
      }
      this.$interval(() => this.$scope.model.counter--, 1000, this.$scope.model.counter, true)
        .then(x => { if (!this.downloaded) this.startDownload() });
    }

    private startDownload() {
      this.downloaded = true;
      var mini = this.$scope.model.enableBasket ? '/mini' : '';
      var url = document.URL;
      var id_check = /[?&]type=([^&]+)/i;
      var match = id_check.exec(url);
      var final_type;
      if (match != null) final_type = match[1];
      else final_type = "0";

      if (this.$scope.model.enableBasket) this.$scope.w6.updateSettings(x => x.downloadedSync = true)
      else this.$scope.w6.updateSettings(x => x.downloadedPWS = true);

      window.location.href = this.$scope.url.api + '/downloads' + mini + '/latest2?type=' + final_type;

      var redir: string = this.$location.search().redirect;
      if (redir && (redir.includes("withsix.com/") || redir.includes(".withsix.net/"))) // TODO: Proper protect
        var interval = setInterval(() => {
          window.location.href = redir;
          clearInterval(interval);
        }, 3000);
    }
  }

  registerController(DownloadStartController);
}

export module MyApp.Main.Blog {
  export class GetBlogsQuery extends DbQueryBase {
    static $name = "GetBlogsQuery";
    public execute = [
      'team', team => this.context.executeQuery(breeze.EntityQuery.from("Posts")
        .where("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
        .orderByDesc("created")
        .top(12)
        .select(["slug", "title", "summary", "author", "commentsCount", "created", "isPublished", "updated"]))
        .then(r => r.results)
    ];
  }

  registerCQ(GetBlogsQuery);

  export class GetBlogArchiveQuery extends DbQueryBase {
    static $name = "GetBlogArchiveQuery";
    public execute = [
      'team', 'year', 'month', (team, year, month) => this.context.executeQuery(breeze.EntityQuery.from("Posts")
        .where(
        breeze.Predicate.create("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
          .and(breeze.Predicate.create("created", breeze.FilterQueryOp.LessThanOrEqual, new Date(Date.UTC(year, month - 1, 31)))
            .and(breeze.Predicate.create("created", breeze.FilterQueryOp.GreaterThanOrEqual, new Date(Date.UTC(year, month - 1, 1))))))
        .orderByDesc("created")
        .top(12)
        .select(["slug", "title", "summary", "author", "commentsCount", "created", "isPublished", "updated"]))
        .then(r => r.results)
    ];
  }

  registerCQ(GetBlogArchiveQuery);

  export class GetBlogQuery extends DbQueryBase {
    static $name = "GetBlogQuery";
    public execute = ['slug', slug => this.findBySlug("posts", slug, 'getPost')];
  }

  registerCQ(GetBlogQuery);

  export class GetBlogArchiveSideQuery extends DbQueryBase {
    static $name = "GetBlogArchiveSideQuery";
    public execute = [
      'team', team => this.context.getCustom('blog/postmonths', {
        params: {
          category: team ? 'Team' : 'General'
        },
        requestName: 'getPostArchive'
      })
        .then(result => result.data)
    ];
  }

  registerCQ(GetBlogArchiveSideQuery);

  enum BlogCategory {
    General,
    Team
  }

  export class GetBlogRecentQuery extends DbQueryBase {
    static $name = "GetBlogRecentQuery";
    public execute = [
      'team', team => this.context.executeQuery(breeze.EntityQuery.from("posts")
        .where("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
        .orderByDesc("created")
        .top(5)
        .select(["id", "slug", "title"]), 'getRecentPosts')
        .then(result => result.results)
    ];
  }

  registerCQ(GetBlogRecentQuery);

  export class GetPostCommentsQuery extends DbQueryBase {
    static $name = 'GetPostComments';

    public execute = [
      'postId',
      postId => {
        Debug.log("getting postcomments by id: " + postId.toString());
        var query = breeze.EntityQuery.from("PostComments")
          .where("postId", breeze.FilterQueryOp.Equals, postId)
          .orderByDesc("created");
        return this.context.executeQuery(query)
          .then((result) => result);
      }
    ];
  }

  registerCQ(GetPostCommentsQuery);

  export class CreatePostCommentCommand extends DbCommandBase {
    static $name = 'CreatePostComment';

    public execute = [
      'model', model => {
        var entity = BreezeEntityGraph.PostComment.createEntity(this.context.manager, { postId: model.postId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
        if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
        return this.context.saveChanges(undefined, [entity])
          .catch(x => {
            if (model.replyTo) Tools.removeEl(model.replyTo.replies, entity);
            this.context.manager.detachEntity(entity);
            return Promise.reject(x);
          });
      }
    ];
  }

  registerCQ(CreatePostCommentCommand);

  export class DeletePostCommentCommand extends DbCommandBase {
    static $name = 'DeletePostComment';

    public execute = [
      'model', (model: IBreezePostComment) => {
        model.archivedAt = new Date(Date.now());
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  registerCQ(DeletePostCommentCommand);

  export class SavePostCommentCommand extends DbCommandBase {
    static $name = 'SavePostComment';

    public execute = [
      'model', (model: IBreezePostComment) => {
        //model.entityAspect.setDeleted();
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  registerCQ(SavePostCommentCommand);

  export class GetPostCommentLikeStateQuery extends DbQueryBase {
    static $name = 'GetPostCommentLikeState';
    public execute = ['postId', postId => this.context.getCustom('comments/posts/' + postId + "/states")];
  }

  registerCQ(GetPostCommentLikeStateQuery);

  export class LikePostCommentCommand extends DbCommandBase {
    static $name = 'LikePostCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/post/" + id + "/" + "like")];
  }

  registerCQ(LikePostCommentCommand);

  export class UnlikePostCommentCommand extends DbCommandBase {
    static $name = 'UnlikePostCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/post/" + id + "/" + "unlike")];
  }

  registerCQ(UnlikePostCommentCommand);


  export class GetPostLikeStateQuery extends DbQueryBase {
    static $name = 'GetPostLikeState';
    public execute = [() => this.context.getCustom('posts/states')];
  }

  registerCQ(GetPostLikeStateQuery);

  export class LikePostCommand extends DbCommandBase {
    static $name = 'LikePostCommand';
    public execute = ['id', id => this.context.postCustom("posts/" + id + "/" + "like")];
  }

  registerCQ(LikePostCommand);

  export class UnlikePostCommand extends DbCommandBase {
    static $name = 'UnlikePostCommand';
    public execute = ['id', id => this.context.postCustom("posts/" + id + "/" + "unlike")];
  }

  registerCQ(UnlikePostCommand);

  interface IBlogsScope extends IBaseScopeT<IBreezePost[]> {
    blogUrl: string;
    postArchive;
    recentPosts;
  }

  class BlogsController extends BaseQueryController<IBreezePost[]> {
    static $name = "BlogsController";
    static $inject = ['$scope', 'logger', '$q', 'model', 'postArchive', 'recentPosts'];

    constructor(public $scope: IBlogsScope, public logger, $q, model: IBreezePost[], postArchive, recentPosts) {
      super($scope, logger, $q, model);

      $scope.blogUrl = $scope.url.main + '/blog';
      $scope.postArchive = postArchive;
      $scope.recentPosts = recentPosts;
    }
  }

  registerController(BlogsController);

  interface IBlogsArchiveScope extends IBlogsScope {
    year;
    month;
  }

  class BlogArchiveController extends BlogsController {
    static $name = "BlogArchiveController";
    static $inject = ['$scope', 'logger', '$q', '$routeParams', 'model', 'postArchive', 'recentPosts'];

    constructor(public $scope: IBlogsArchiveScope, public logger, $q, $routeParams, model: IBreezePost[], postArchive, recentPosts) {
      super($scope, logger, $q, model, postArchive, recentPosts);

      $scope.year = $routeParams.year;
      $scope.month = $routeParams.month;
    }
  }

  registerController(BlogArchiveController);

  export interface IBlogPostScope extends IContentScope, IHandleCommentsScope<IBreezePostComment> {
    model;
    postArchive;
    recentPosts;
    blogUrl: string;
    postUrl: string;
    trustedContentHtml;
    likedPosts: {};
    like: () => any;
    unlike: () => any;
  }

  export interface IBlogPostContentModel extends IContentModel<IBreezePost> {
  }

  class BlogController extends BaseQueryController<IBreezePost> {
    static $name = "BlogController";
    static $inject = ['$scope', 'logger', '$q', '$timeout', 'post', 'postArchive', 'recentPosts', '$sce'];

    constructor(public $scope: IBlogPostScope, public logger, $q, private $timeout, post: IBreezePost, postArchive, recentPosts, $sce: ng.ISCEService) {
      super($scope, logger, $q, post);
      this.setupComments(post);

      $scope.blogUrl = $scope.url.main + '/blog';
      $scope.postUrl = $scope.blogUrl + '/' + post.slug;
      $scope.postArchive = postArchive;
      $scope.recentPosts = recentPosts;

      if (debug) {
        $(window).data("scope-" + post.slug, $scope);
        $(window).data("scope", $scope);
      }

      if ($scope.environment != Tools.Environment.Production)
        this.setupLikes();

      this.setupTitle("model.title", "{0} - Blog");
      $scope.setMicrodata({
        title: post.title,
        description: post.summary || 'No summary yet',
        image: $('<div>' + post.summary + '</div>').find('img:first').attr('src') || $('<div>' + post.content + '</div>').find('img:first').attr('src')
      });
    }

    setupComments(post: IBreezePost) {
      this.$scope.addComment = (newComment) => {
        this.processCommand(this.$scope.request(CreatePostCommentCommand, {
          model: {
            replyTo: newComment.replyTo,
            postId: this.$scope.model.id,
            message: newComment.message,
            replyToId: newComment.replyTo ? newComment.replyTo.id : undefined
          }
        }).then(x => {
          newComment.message = "";
        }), 'Create comment');
      };
      this.$scope.deleteComment = (comment) => this.processCommand(this.$scope.request(DeletePostCommentCommand, { model: comment }), 'Delete comment');
      this.$scope.saveComment = (comment) => this.processCommand(this.$scope.request(SavePostCommentCommand, { model: comment }), 'Save comment');

      if (this.$scope.environment != Tools.Environment.Production) {
        this.$scope.commentLikeStates = {};
        if (this.$scope.w6.userInfo.id) {
          this.$timeout(() => this.$scope.request(GetPostCommentLikeStateQuery, { postId: this.$scope.model.id })
            .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
            .catch(this.breezeQueryFailed));
        }

        this.$scope.likeComment = comment => {
          this.$scope.request(LikePostCommentCommand, { postId: this.$scope.model.id, id: comment.id })
            .then(() => {
              comment.likesCount += 1;
              this.$scope.commentLikeStates[comment.id] = true;
            });
        };
        this.$scope.unlikeComment = comment => {
          this.$scope.request(UnlikePostCommentCommand, { postId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount -= 1;
            this.$scope.commentLikeStates[comment.id] = false;
          });
        };
      }

      this.$timeout(() => this.$scope.request(GetPostCommentsQuery, { postId: this.$scope.model.id }));
    }

    setupLikes() {
      this.$scope.like = () => this.$scope.request(LikePostCommand, { id: this.$scope.model.id })
        .then(() => {
          this.$scope.model.likesCount += 1;
          this.$scope.likedPosts[this.$scope.model.id] = true;
        });
      this.$scope.unlike = () => this.$scope.request(UnlikePostCommand, { id: this.$scope.model.id })
        .then(() => {
          this.$scope.model.likesCount -= 1;
          delete this.$scope.likedPosts[this.$scope.model.id];
        });

      // TODO: Move to a BlogsController that is parent of current Blogs+BlogController
      this.$scope.likedPosts = {};
      if (this.$scope.w6.userInfo.id) {
        this.$timeout(() => this.$scope.request(GetPostLikeStateQuery)
          .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.likedPosts))
          .catch(this.breezeQueryFailed));
      }
    }
  }

  registerController(BlogController);
}

export module MyApp.Main.Changelog {
  class ChangelogController extends BaseController {
    static $inject = ['$scope', 'logger', '$q', 'model'];
    static $name = 'ChangelogController';

    constructor($scope, logger, $q, model) {
      super($scope, logger, $q);

      $scope.changelog = model;

      $scope.changelogOldShown = false;
      $scope.toggleOlderChangelogs = () => {
        if ($scope.changelogOld) {
          $scope.changelogOldShown = !$scope.changelogOldShown;
        } else if (!$scope.changelogOldShown) {
          $scope.changelogOldShown = true;
          $scope.request(GetChangelogOldQuery)
            .then(result => $scope.changelogOld = result.lastResult);
        }
      };
    }
  }

  registerController(ChangelogController);

  export class GetChangelogQuery extends DbQueryBase {
    static $name = 'GetChangelog';
    public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
  }

  registerCQ(GetChangelogQuery);

  export class GetChangelogOldQuery extends DbQueryBase {
    static $name = 'GetChangelogOld';
    public execute = [() => this.context.getDocMd("CHANGELOG_HISTORY.md", true)];
  }

  registerCQ(GetChangelogOldQuery);

  export class GetMiniChangelogQuery extends DbQueryBase {
    static $name = 'GetMiniChangelog';
    public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
  }

  registerCQ(GetMiniChangelogQuery);
}

export module MyApp.Main.Premium {
  export class OpenPremiumTermsDialogQuery extends DialogQueryBase {
    static $inject = ['$modal', 'dialogs', 'dbContext', 'w6'];

    constructor($modal, public dialogs, context: W6Context, private w6: W6) { super($modal, dialogs, context); }

    static $name = 'OpenPremiumTermsDialog';
    public execute = [
      () => this.openDialog(Components.Dialogs.DefaultDialogWithDataController, {
        templateUrl: '/src_legacy/app/main/premium/premium-terms-dialog.html',
        size: 'lg',
        resolve: {
          data: () => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md").then(result => result.data)
        }
      })
    ];
  }

  export class GetPremiumLegalQuery extends DbQueryBase {
    static $name = 'GetPremumLegal';
    static $inject = ['dbContext', 'w6'];
    constructor(dbContext: W6Context, private w6: W6) {
      super(dbContext);
    }
    public execute = [() => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md").then(result => result.data)];
  }

  export class GetPremiumQuery extends DbQueryBase {
    static $name = 'GetPremium';
    public execute = [() => this.context.getCustom("premium").then(result => result.data)];
  }

  export class CreatePremiumOrderCommand extends DbCommandBase {
    static $name = "CreatePremiumOrder";

    public execute = [
      'data', (data) => {
        return this.context.postCustom('premium', data, { requestName: 'createPremiumOrder' });
      }
    ];
  }

  registerCQ(GetPremiumQuery);
  registerCQ(CreatePremiumOrderCommand);
  registerCQ(OpenPremiumTermsDialogQuery);


  import Moment = moment.Moment;

  export interface IPremiumScope extends IBaseScope {
    completeOrder: () => void;
    getRenewal: () => Moment;
    location;
    openTermsDialog: () => any;
    openPremiumTermsDialog: () => any;
    model: { products; selectedProduct: { name: string; unitAmount: number; unit; articleId; total }; autoRenew: boolean; termsAccepted: boolean; processing: boolean; fee: number; total; email: string; ref: string; overwrite: boolean };
    getPerMonth: (product) => number;
    register: () => any;
    payMethod: PayMethod;
    setPaymethod: (method) => void;
    getBilled: (product) => string;
    switchOverwrite: () => boolean;
    overwrite: boolean;
    userLocation;
    logout: () => any;
  }

  enum Unit {
    Day,
    Week,
    Month,
    Year
  }


  export class PremiumController extends BaseController {
    static $name = 'PremiumController';
    static $inject = ['$scope', 'logger', '$location', '$window', '$q', 'ForwardService', 'model'];

    constructor(public $scope: IPremiumScope, public logger, $location: ng.ILocationService, private $window: ng.IWindowService, $q, private forwardService: Components.ForwardService, model) {
      super($scope, logger, $q);

      model.selectedProduct = model.products[0];
      model.autoRenew = model.countryCode !== 'DE';
      model.termsAccepted = false;
      model.processing = false;

      model.ref = $location.search().ref;
      $scope.model = model;

      $scope.payMethod = PayMethod.Paypal;
      $scope.getPerMonth = product => product.pricing.total / (product.unitAmount * (product.unit == 'Year' ? 12 : 1));
      $scope.getBilled = product => {
        if (!model.autoRenew)
          return "total";
        if (!product.unitAmount)
          return "once";
        if (product.unitAmount == 1) {
          switch (product.unit) {
            case Unit[Unit.Day]:
              return "daily";
            case Unit[Unit.Week]:
              return "weekly";
            case Unit[Unit.Month]:
              return "monthly";
            case Unit[Unit.Year]:
              return "annually";
            default:
              throw new Error("Unsupported product unit");
          }
        } else if (product.unit == Unit[Unit.Month] && product.unitAmount == 3) {
          return "quarterly";
        } else {
          return "each " + product.unitAmount + " " + product.unit.toLowerCaseFirst() + "s";
        }

      };
      $scope.location = $location;
      $scope.openPremiumTermsDialog = () => $scope.request(OpenPremiumTermsDialogQuery);
      $scope.openTermsDialog = () => $scope.request(Components.Dialogs.OpenTermsDialogQuery);
      $scope.getRenewal = () => { return moment().add($scope.model.selectedProduct.unitAmount, $scope.model.selectedProduct.unit.toLowerCase() + 's'); };
      $scope.completeOrder = this.completeOrder;
      $scope.register = () => $scope.request(Components.Dialogs.OpenRegisterDialogWithExistingDataQuery, { model: { email: $scope.model.email } });
      $scope.setPaymethod = this.setPaymethod;
      $scope.switchOverwrite = () => $scope.model.overwrite = true;

      this.setPaymethod(PayMethod.Paypal);
      $scope.$watch("model.selectedProduct", (newVal, oldVal) => this.updateFee(newVal));
    }

    private setPaymethod = (method: PayMethod) => {
      switch (method) {
        case PayMethod.Paypal:
          {
            this.payMethod = new PayPalPayMethod();
            break;
          }
        default:
          {
            throw new Error("Unsupported pay method");
          }
      }
      this.updateFee(this.$scope.model.selectedProduct);
    };
    private completeOrder = () => {
      if (!this.$scope.model.termsAccepted) {
        this.logger.error("Terms are not agreed");
        return;
      }
      var selectedProduct = this.$scope.model.selectedProduct;
      var recurring = this.$scope.model.autoRenew && selectedProduct.unitAmount != null;
      this.$scope.request(CreatePremiumOrderCommand, { data: { articleId: selectedProduct.articleId, isRecurring: recurring, termsAccepted: this.$scope.model.termsAccepted, ref: this.$scope.model.ref, overwrite: this.$scope.model.overwrite } })
        .then((result) => {
          this.forwardService.forwardNaked(this.$scope.url.urlSsl + "/orders/" + result.lastResult.data + "/checkout");
        }).catch(reason => {
          this.httpFailed(reason);
        });
    };
    payMethod: PayMethodT;

    updateFee(product) {
      this.$scope.model.fee = this.payMethod.calculateFee(product.pricing.price);
      this.$scope.model.total = product.pricing.total + this.$scope.model.fee;
    }
  }

  registerController(PremiumController);

  export enum PayMethod {
    Paypal
  }

  export interface ICalcFee {
    calculateFee(amount: number)
  }

  class NullFeeCalculator implements ICalcFee {
    public calculateFee(amount: number) {
      return 0.0;
    }
  }

  class PayPaylFeeCalculator implements ICalcFee {
    static multiplier = 0.05;

    public calculateFee(amount: number) {
      return amount * PayPaylFeeCalculator.multiplier;
    }
  }

  export class PayMethodT {
    constructor(public feeCalculator: ICalcFee) { }

    public calculateFee(amount: number) {
      return this.feeCalculator.calculateFee(amount);
    }
  }

  export class PayPalPayMethod extends PayMethodT {
    constructor() {
      //super(new PayPaylFeeCalculator());
      super(new NullFeeCalculator()); // No fees currently..
    }
  }
}

export module MyApp.Play {
  angular.module('MyAppPlayTemplates', []);

  enum PlayMainModule {
    Default,
    Mods,
    Missions,
    Collections,
    Servers,
    Stream,
    Apps,
    Order,
  }

  class PlayModule extends Tk.Module {
    static $name = "PlayModule";

    constructor() {
      super('MyAppPlay', ['app', 'ngRoute', 'ngDfp', 'commangular', 'route-segment', 'view-segment', 'Components', 'MyAppPlayTemplates']);

      function getModFileResolve(fileType) {
        return {
          model: [
            '$commangular', '$route',
            ($commangular, $route) => $commangular.dispatch(Mods.GetModFileQuery.$name, { fileType: fileType, gameSlug: $route.current.params.gameSlug, modId: $route.current.params.modId })
              .then((result) => result.lastResult)
          ]
        };
      }

      this.app
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2, "/p");
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            $routeProvider.
              when('/', 'games').
              segment('games', {
                controller: 'GamesController',
                templateUrl: '/src_legacy/app/play/games/index.html',
                resolve: setupQuery(Games.GetGamesQuery)
              });

            var game = $routeProvider.
              when('/:gameSlug', 'game').
              when('/:gameSlug/order', 'game.order').
              when('/:gameSlug/stream', 'game.stream').
              //when('/:gameSlug/stream/:streamType?', 'game.stream').
              when('/:gameSlug/servers', 'game.servers').
              when('/:gameSlug/mods', 'game.mods').
              when('/:gameSlug/mods/:modId/:modSlug?/download', 'game.modsShow.download').
              when('/:gameSlug/mods/:modId/:modSlug?/related', 'game.modsShow.related').
              when('/:gameSlug/mods/:modId/:modSlug?/credits', 'game.modsShow.credits').
              when('/:gameSlug/mods/:modId/:modSlug?/readme', 'game.modsShow.readme').
              when('/:gameSlug/mods/:modId/:modSlug?/license', 'game.modsShow.license').
              when('/:gameSlug/mods/:modId/:modSlug?/changelog', 'game.modsShow.changelog').
              when('/:gameSlug/mods/:modId/:modSlug?/settings', 'game.modsShow.settings').
              when('/:gameSlug/mods/:modId/:modSlug?/blog', 'game.modsShow.blog').
              when('/:gameSlug/mods/:modId/:modSlug?', 'game.modsShow').
              when('/:gameSlug/missions', 'game.missions').
              when('/:gameSlug/missions/new', 'game.new_mission').
              when('/:gameSlug/missions/:missionId/:missionSlug?/edit', 'game.edit_mission').
              when('/:gameSlug/missions/:missionId/:missionSlug?/versions/new', 'game.new_mission_version').
              when('/:gameSlug/missions/:missionId/:missionSlug?/versions/:versionSlug/publish', 'game.publish_mission_version').
              when('/:gameSlug/missions/:missionId/:missionSlug?/download', 'game.missionsShow.download').
              when('/:gameSlug/missions/:missionId/:missionSlug?', 'game.missionsShow').
              when('/:gameSlug/collections', 'game.collections').
              when('/:gameSlug/collections/:collectionId/:collectionSlug?', 'game.collectionsShow').
              when('/:gameSlug/collections/:collectionId/:collectionSlug?/comments', 'game.collectionsShow.comments').
              when('/:gameSlug/collections/:collectionId/:collectionSlug?/related', 'game.collectionsShow.related').
              when('/:gameSlug/collections/:collectionId/:collectionSlug?/content', 'game.collectionsShow.content').
              when('/:gameSlug/collections/:collectionId/:collectionSlug?/content/edit', 'game.collectionsShow.content-edit').
              /*                            when('/:gameSlug/test', 'game.test').*/
              segment('game', {
                controller: 'GameController',
                dependencies: ['gameSlug'],
                templateUrl: '/src_legacy/app/play/gameSubLayout.html',
                resolve: setupQuery(Games.GetGameQuery)
              }).within();

            /*
                                    game.segment('test', {
                                            templateUrl: '/src_legacy/app/play/shared/_content-header-new.html'
                                        });
            */
            game.
              segment('stream', {
                default: true
              }).
              segment('servers', {}).
              segment('mods', {}).
              segment('missions', {}).
              segment('collections', {});


            game.
              segment('order', {
                controller: 'OrderController',
                templateUrl: '/src_legacy/app/play/games/order.html',
              });

            // game
            //   .segment('stream', {
            //     controller: 'StreamController',
            //     templateUrl: '/src_legacy/app/play/games/stream/index.html',
            //     dependencies: ['gameSlug', 'streamType'],
            //     resolve: setupQuery(Games.GetStreamQuery, { streamType: 'Content' }),
            //     default: true // TODO: Generally we have some games that have Stream as default, others have Order as default...
            //   }).
            //   segment('stream_personal', {
            //     controller: 'PersonalStreamController',
            //     templateUrl: '/src_legacy/app/play/games/stream/index.html',
            //     dependencies: ['gameSlug', 'streamType'],
            //     resolve: setupQuery(Games.GetPersonalStreamQuery, { streamType: 'Content' })
            //   });

            game.
              segment('modsShow', {
                controller: 'ModController',
                templateUrl: '/src_legacy/app/play/mods/show.html',
                dependencies: ['gameSlug', 'modId', 'modSlug'],
                resolve: setupQuery(Mods.GetModQuery),
              })
              .within()
              .segment('info', {
                default: true,
                controller: 'ModInfoController',
                templateUrl: '/src_legacy/app/play/mods/show/info.html',
              }).segment('related', {
                controller: 'ModRelatedController',
                templateUrl: '/src_legacy/app/play/mods/show/related.html',
                resolve: setupQuery(Mods.GetModRelatedQuery)
              }).segment('download', {
                templateUrl: '/src_legacy/app/play/mods/show/download.html',
              }).segment('credits', {
                controller: 'ModCreditsController',
                templateUrl: '/src_legacy/app/play/mods/show/credits.html',
                resolve: setupQuery(Mods.GetModCreditsQuery)
              }).segment('readme', {
                controller: 'ModFileController',
                templateUrl: '/src_legacy/app/play/mods/show/file.html',
                resolve: getModFileResolve('readme'),
              }).segment('license', {
                controller: 'ModFileController',
                templateUrl: '/src_legacy/app/play/mods/show/file.html',
                resolve: getModFileResolve('license'),
              }).segment('changelog', {
                controller: 'ModFileController',
                templateUrl: '/src_legacy/app/play/mods/show/file.html',
                resolve: getModFileResolve('changelog'),
              }).segment('settings', {
                templateUrl: '/src_legacy/app/play/mods/show/settings.html',
              }).segment('blog', {
                controller: 'ModBlogController',
                templateUrl: '/src_legacy/app/play/mods/show/blog.html',
              });

            game.
              // segment('missions', {
              //   controller: 'MissionsController',
              //   templateUrl: '/src_legacy/app/components/default_index.html',
              //   dependencies: ['gameSlug']
              // }).
              segment('new_mission', {
                controller: 'UploadNewmissionController',
                templateUrl: '/src_legacy/app/play/missions/upload-newmission.html',
                dependencies: ['gameSlug'],
                resolve: setupQuery(Missions.NewMissionQuery),
                role: [Role.user]
              }).
              segment('edit_mission', {
                controller: 'EditMissionController',
                templateUrl: '/src_legacy/app/play/missions/edit-mission.html',
                dependencies: ['gameSlug', 'missionId', 'missionSlug'],
                resolve: setupQuery(Missions.EditMissionQuery),
              }).
              segment('new_mission_version', {
                controller: 'UploadNewversionController',
                templateUrl: '/src_legacy/app/play/missions/upload-newversion.html',
                dependencies: ['gameSlug', 'missionId', 'missionSlug']
              }).
              segment('publish_mission_version', {
                controller: 'PublishVersionController',
                templateUrl: '/src_legacy/app/play/missions/publish-version.html',
                dependencies: ['gameSlug', 'missionId', 'missionSlug', 'versionSlug'],
                resolve: setupQuery(Missions.GetPublishMissionVersionQuery)
              }).
              segment('missionsShow', {
                controller: 'MissionController',
                templateUrl: '/src_legacy/app/play/missions/show.html',
                dependencies: ['gameSlug', 'missionId', 'missionSlug'],
                resolve: setupQuery(Missions.GetMissionQuery),
              })
              .within()
              .segment('info', {
                controller: 'MissionInfoController',
                default: true,
                templateUrl: '/src_legacy/app/play/missions/show/info.html',
              }).segment('download', {
                templateUrl: '/src_legacy/app/play/missions/show/download.html'
              });

            game.
              // segment('collections', {
              //   controller: 'CollectionsController',
              //   templateUrl: '/src_legacy/app/components/default_index.html',
              //   dependencies: ['gameSlug']
              // }).
              segment('collectionsShow', {
                controller: 'CollectionController',
                templateUrl: '/src_legacy/app/play/collections/show.html',
                dependencies: ['gameSlug', 'collectionId', 'collectionSlug'],
                resolve: setupQuery(Collections.GetCollectionQuery)
              })
              .within()
              .segment('info', {
                controller: 'CollectionInfoController',
                default: true,
                templateUrl: '/src_legacy/app/play/collections/show/info.html',
              })
              .segment('content-edit', {
              })
              .segment('content', {
              })
              .segment('related', {
                controller: 'CollectionRelatedController',
                templateUrl: '/src_legacy/app/play/collections/show/related.html',
                resolve: setupQuery(Collections.GetForkedCollectionsQuery)
              });
          }
        ])
    }

    siteConfig() {
      this.app.config([
        'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
          if (w6.enableAds) {
            // TODO: Consider if we can deal with ads more on the fly instead of at app config?
            doubleClickProvider
              .defineSlot('/' + dfp.publisherId + '/play_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["play_rectangle_atf"])
              .defineSlot('/' + dfp.publisherId + '/play_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["play_rectangle_btf"])
              .defineSlot('/' + dfp.publisherId + '/play_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["play_leaderboard_atf"]);
          }
        }
      ]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new PlayModule();


  export class Helper {
    static modToBasket(mod: IBreezeMod, gameId?: string): Components.Basket.IBasketItem {
      var w6 = window.w6Cheat.w6;
      return {
        id: mod.id, name: mod.name, gameId: mod.gameId || gameId, itemType: Components.Basket.BasketItemType.Mod, packageName: mod.packageName,
        image: mod.avatar ? w6.url.getUsercontentUrl2(mod.avatar, mod.avatarUpdatedAt) : ((<any>mod).image ? (<any>mod).image : null),
        author: mod.author && mod.author.id != window.w6Cheat.w6.w6OBot ? mod.author.displayName : mod.authorText, sizePacked: mod.sizePacked
      }
    }

    static collectionToBasket(collection: IBreezeCollection, gameId?: string): Components.Basket.IBasketItem {
      var w6 = window.w6Cheat.w6;
      return {
        id: collection.id,
        itemType: Components.Basket.BasketItemType.Collection,
        gameId: collection.gameId || gameId,
        packageName: collection.slug, // pff
        author: collection.author.displayName,
        image: collection.avatar ? w6.url.getUsercontentUrl2(collection.avatar, collection.avatarUpdatedAt) : null, // item.image ? item.image :
        name: collection.name,
        sizePacked: collection.sizePacked,
        isOnlineCollection: true
      }
    }

    static streamModToBasket(mod: any, gameId?: string): Components.Basket.IBasketItem {
      var w6 = window.w6Cheat.w6;
      return {
        id: mod.id, name: mod.headerName, gameId: mod.gameId || gameId, itemType: Components.Basket.BasketItemType.Mod, packageName: mod.packageName,
        image: mod.image ? w6.url.getUsercontentUrl2(mod.image, mod.imageUpdatedAt) : null, author: mod.author, sizePacked: mod.sizePacked
      }
    }
  }

  app.app.directive("sxEditMenu", [
    '$popover', ($popover) => {
      return {
        link: (scope, element, attr) => {
          var authorEditPopover = $popover(element, {
            template: "/src_legacy/app/play/mods/popovers/change-author-dialog.html",
            placement: "bottom-right",
            target: $(".btn-sx-more"), // TODO: This targets multiple elements atm...
            container: "body",
            trigger: "manual",
            scope: scope // will be used to create child scope that prototipically inherits off our scope..
          });
          scope.openChangeAuthorDialog = () => authorEditPopover.show();
        },
        templateUrl: '/src_legacy/app/play/edit-dropdown-directive.html'
      };
    }
  ]);

  app.app.directive("sxAuthorTop", [
    '$popover', ($popover) => {
      return {
        link: (scope, element, attr) => {
          var authorEditPopoverTop = $popover(element, {
            template: "/src_legacy/app/play/mods/popovers/change-author-dialog.html",
            placement: "bottom",
            target: $(".btn-sx-more"), // TODO: This targets multiple elements atm...
            container: "body",
            trigger: "manual",
            scope: scope // will be used to create child scope that prototipically inherits off our scope..
          });
          scope.openChangeAuthorDialogTop = () => authorEditPopoverTop.show();
        }
      };
    }
  ]);

  export class GetUsersQuery extends DbQueryBase {
    static $name = "GetUsers";

    public execute = [
      'query', (name: string) => {
        Debug.log("getting users, " + name);
        return this.context.executeQuery(breeze.EntityQuery.from("AccountSearch") //.from("Accounts")
          .withParameters({ "name": name.toLowerCase() })
          //.where(this.getPredicate(name.toLowerCase()))
          //.orderBy("userName")
          .take(this.context.defaultTakeTag))
          .then((data) => data.results);
      }
    ];

    getPredicate(lowerCaseName: string) {
      var op = this.context.getOpByKeyLength(lowerCaseName);
      return new breeze.Predicate("toLower(userName)", op, lowerCaseName)
        .or(new breeze.Predicate("toLower(displayName)", op, lowerCaseName));
    }
  }

  registerCQ(GetUsersQuery);

  export class GetUserTagsQuery extends DbQueryBase {
    static $name = "GetUserTags";
    static $inject = ['dbContext', '$commangular'];

    constructor(context: W6Context, private $commangular) {
      super(context);
    }

    public escapeIfNeeded(str) {
      if (str.indexOf(" ") != -1)
        return "\"" + str + "\"";
      return str;
    }

    public execute = [
      'query', (name: string) => {
        return this.$commangular.dispatch(GetUsersQuery.$name, { query: name })
          .then(results => {
            var obj = [];
            angular.forEach(results.lastResult, (user: any) => obj.push({ text: "user:" + this.escapeIfNeeded(user.displayName), key: "user:" + this.escapeIfNeeded(user.displayName) }));
            return obj;
          });
      }
    ];
  }

  registerCQ(GetUserTagsQuery);
}

export module MyApp.Play.Collections {
  export interface ICollectionScope extends IContentScopeT<IBreezeCollection>, IHandleCommentsScope<IBreezeCollectionComment> {
    baskets: any;//GameBaskets;
    isInBasket: (mod: IBreezeMod) => boolean;
    addToBasket: (mod: IBreezeMod) => void;
    toggleSubscribe: () => void;
    versionConstraints: {};
    addTag: (data: any) => boolean;
    getCurrentTags: () => any[];
    removeTag: (data: any) => void;
    scopes: any[];
    uploadingCollectionImage: boolean;
    onFileSelectLogo: (files: any, $event: any) => void;
    onFileSelectGallery: (files: any, $event: any) => void;
    showHelp: () => void;
    fileDropped: ($files: any, $event: any, $rejectedFiles: any) => void;
    accept: any;
    showUploadBanner: () => void;
    newRemoteLogoUploadRequest: (file: string) => void;
    clients: { name: string; number: string }[];
    tryDirectDownloadCollection: any;
    getDependencies: (query: any) => any;
    addModDependency: (data: any, hide: any) => boolean;
  }

  export class CollectionController extends ContentModelController<IBreezeCollection> {
    static $name = 'CollectionController';
    static menuItems = [
      { header: "Info", segment: "info", isDefault: true },
      { header: "Content", segment: "content" }
      //{ header: "Comments", segment: "comments" }
    ];
    static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'localStorageService', 'w6', 'ForwardService', '$timeout', 'UploadService', '$popover', '$rootScope', 'basketService', 'aur.eventBus', 'aur.mediator', 'model'];

    constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q, $sce: ng.ISCEService, private localStorageService, private w6: W6, private forwardService: Components.ForwardService, private $timeout: ng.ITimeoutService, private uploadService: Components.Upload.UploadService, private $popover, $rootScope: IRootScope, basketService: MyApp.Components.Basket.BasketService, eventBus: EventAggregator, private mediator, model: IBreezeCollection) {
      super($scope, logger, $routeParams, $q, $sce, model);

      window.w6Cheat.collection = this;

      $scope.tryDirectDownloadCollection = () => {
        if (model.latestVersion.repositories != null) {
          this.$scope.request(OpenRepoCollectionDialogQuery, { model: this.$scope.model });
        }
        return $scope.directDownloadCollection(this.$scope.model);
      }

      var basket = $scope.game && basketService.getGameBaskets($scope.game.id);
      $scope.addToBasket = (mod: IBreezeMod) => basketService.addToBasket($scope.game.id, Helper.modToBasket(mod));
      $scope.baskets = basket;
      $scope.isInBasket = (mod: IBreezeMod) => {
        return basket && basket.active.content.has(mod.id);
      };

      $scope.versionConstraints = {};
      if (model.latestVersion != null)
        angular.forEach(model.latestVersion.dependencies, d => {
          if (d.constraint)
            $scope.versionConstraints[d.modDependencyId] = d.constraint;
        })

      $scope.toggleSubscribe = () => {
        if (this.$scope.subscribedCollections[model.id])
          this.unsubscribe();
        else
          this.subscribe();
      };

      $scope.clients = [
        { name: "Default", number: "Default" },
        { name: "Sync", number: "Sync" },
        { name: "Play withSIX", number: "PlayWithSix" }
      ];

      $scope.onFileSelectGallery = (files, $event) => $scope.onFileSelectLogo(files, $event);
      $scope.onFileSelectLogo = (files, $event) => {
        this.newLogoUploadRequest(files[0], $event);
      };
      $scope.fileDropped = ($files, $event, $rejectedFiles) => {
        if (typeof $files[0] === "string") {
          this.newRemoteLogoUploadRequest($files[0], $event);
        } else {
          this.newLogoUploadRequest($files[0], $event);
        }
      };
      $scope.newRemoteLogoUploadRequest = (url) => this.newRemoteLogoUploadRequest(url, null);
      $scope.accept = ($files, $event) => {
        return true;
      };
      this.showUploadBanner();
      //$scope.accept = "image/*,audio/*,video/*,text/html";

      this.setupCategoriesAutoComplete();

      this.setupTitle("model.name", "{0} - " + model.game.name);

      this.setupEditing();
      this.setupHelp();

      var handleClient = newValue => {
        let routeParam = $routeParams["preferred_client"];
        if (routeParam) newValue = routeParam;
        if (newValue) newValue = newValue.toLowerCase();

        Debug.log("handlepreferredclient: ", newValue);
        if (newValue == "playwithsix" || this.w6.isClient) this.w6.enableBasket = false;
        else if (newValue == "sync") this.w6.enableBasket = true;
        else eventBus.publish(new window.w6Cheat.containerObjects.restoreBasket());
      }

      handleClient(model.preferredClient);

      $scope.$watch('model.preferredClient', (newValue: string, oldValue: string, scope) => {
        if (newValue === oldValue)
          return;
        // todo; restore existing etc when navigating away?
        handleClient(newValue);
      });


      if (window.location.pathname.endsWith("/content/edit"))
        this.$scope.editConfig.enableEditing();

      var handleEditMode = (newV) => {
        var menuEntry = $scope.header.menuItems.asEnumerable().first(x => x.header == "Content");
        menuEntry.url = newV ? $scope.gameUrl + "/collections/" + model.id.toShortId() + "/" + model.name.sluggifyEntityName() + "/content/edit" : null;
        if (newV) {
          if (window.location.pathname.endsWith("/content"))
            eventBus.publish(new window.w6Cheat.containerObjects.navigate(window.location.pathname + "/edit"));
        } else {
          if (window.location.pathname.endsWith("/edit"))
            eventBus.publish(new window.w6Cheat.containerObjects.navigate(window.location.pathname.replace("/edit", "")));
        }
      }

      var w = $scope.$watch('editConfig.editMode', (newV: boolean, oldV: boolean, scope) => {
        if (newV === oldV) return;
        setTimeout(() => handleEditMode(newV));
      });

      handleEditMode($scope.editConfig.editMode);

      $scope.$on('$destroy', () => {
        window.w6Cheat.collection = null;
        eventBus.publish(new window.w6Cheat.containerObjects.restoreBasket());
        w();
      });
      var hasLanding = $routeParams.hasOwnProperty("landing");
      var hasRepoLanding = $routeParams.hasOwnProperty("landingrepo");
      if ((hasLanding || hasRepoLanding) && (this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
        this.$scope.request(OpenNewCollectionWelcomeDialogQuery, { model: { model: this.$scope.model, repoLanding: hasRepoLanding }, editConfig: this.$scope.editConfig });
    }

    forking = false;

    fork = async () => {
      this.forking = true;
      try {
        let model = this.$scope.model;
        let id = await new window.w6Cheat.containerObjects.forkCollection(model.id).handle(this.mediator);
        window.w6Cheat.navigate("/p/" + model.game.slug + "/collections/" + id.toShortId() + "/" + (model.name + ' [Forked]').sluggifyEntityName());
      } finally {
        this.forking = false;
      }
    }

    // workaround for angular vs aurelia

    public enableEditModeFromAurelia() {
      this.applyIfNeeded(() => {
        this.$scope.editConfig.enableEditing();
      })
    }

    public disableEditModeFromAurelia() {
      this.applyIfNeeded(() => {
        this.$scope.editConfig.closeEditing();
      })
    }

    public saveFromAurelia() {
      return this.$scope.editConfig.hasChanges() ? this.$scope.editConfig.saveChanges() : null;
    }

    public cancelFromAurelia() {
      if (this.$scope.editConfig.hasChanges())
        this.$scope.editConfig.discardChanges();
    }

    public hasChangesFromAurelia() {
      return this.$scope.editConfig.hasChanges();
    }

    private setupCategoriesAutoComplete() {
      var $scope = this.$scope;

      var saveOriginalTags = () => {
        if (!$scope.model.entityAspect.originalValues.hasOwnProperty("tags")) {
          (<any>$scope.model.entityAspect.originalValues).tags = $scope.model.tags.slice(0);
          $scope.model.entityAspect.setModified();
        }
      };

      $scope.addTag = (data) => {
        var index = $scope.model.tags.indexOf(data.key);
        if (index == -1) {
          saveOriginalTags();
          $scope.model.tags.push(data.key);
        }
        $scope.header.tags = $scope.model.tags;
        return true;
      };
      $scope.getCurrentTags = () => {
        var list = [];
        for (var tag in $scope.model.tags) {
          list.push({ key: $scope.model.tags[tag], text: $scope.model.tags[tag] });
        }
        return list;
      };
      $scope.removeTag = (data) => {
        var index = $scope.model.tags.indexOf(data);
        if (index > -1) {
          saveOriginalTags();
          $scope.model.tags.splice(index, 1);
        }
        $scope.header.tags = $scope.model.tags;
      };
      //$scope.getCategories = (query) => this.$scope.request(Mods.GetCategoriesQuery, { query: query })
      //    .then((d) => this.processNames(d.lastResult))
      //    .catch(this.breezeQueryFailed);
    }

    unsubscribe() {
      this.requestAndProcessResponse(UnsubscribeCollectionCommand, { model: this.$scope.model })
        .then(r => {
          delete this.$scope.subscribedCollections[this.$scope.model.id];
          this.$scope.model.subscribersCount -= 1;
          if (window.six_client.unsubscribedFromCollection)
            window.six_client.unsubscribedFromCollection(this.$scope.model.id);
        });
    }

    subscribe() {
      this.requestAndProcessResponse(SubscribeCollectionCommand, { model: this.$scope.model })
        .then(r => {
          this.$scope.subscribedCollections[this.$scope.model.id] = true;
          this.$scope.model.subscribersCount += 1;
          if (window.six_client.subscribedToCollection)
            window.six_client.subscribedToCollection(this.$scope.model.id)

          if (this.w6.client && this.w6.client.clientFound) {
            this.w6.client.openPwsUri("pws://?c=" + this.$scope.toShortId(this.$scope.model.id));
            return;
          }
          if (this.localStorageService.get('clientInstalled') == null
            && !this.$scope.w6.isClient
            && confirm("Before downloading this content, make sure you have \"Play\" our withSIX client installed. To download the client software now, click ok. To proceed with the download, click cancel.")) {
            this.forwardService.forward(this.w6.url.main + "/download" + this.w6.enableBasket ? '' : '?basket=0');
            //localStorageService.set('clientInstalled', true);
          } else {
            this.localStorageService.set('clientInstalled', true);
            //Downloads.startDownload(url);
          }
        });
    }

    setupContentHeader(content: IBreezeCollection): IContentHeader {
      var contentPath = content.game.slug + "/collections";
      var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
      var fullPath = shortPath + "/" + content.slug;
      var menuItems = CollectionController.menuItems;
      if (this.$scope.model.forkedCollectionId != null
        || this.$scope.model.forkedCollectionsCount > 0)
        menuItems = menuItems.concat([{ header: "Related", segment: "related" }]);

      var header = <IContentHeader>{
        title: content.name,
        menuItems: this.getMenuItems(menuItems, "game.collectionsShow"),
        contentType: "collection",
        getAvatar: (width, height) => {
          if (this.tempCollectionImagePath != null)
            return this.tempCollectionImagePath;

          if (this.$scope.model.fileTransferPolicies.length > 0) {
            var policy = this.$scope.model.fileTransferPolicies[0];
            if (policy.uploaded)
              return this.$scope.url.getUsercontentUrl2(policy.path);
          }

          return this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar, content.avatarUpdatedAt), width, height);
        },
        getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
        avatar: content.avatar,
        gameSlug: content.game.slug,
        contentPath: fullPath,
        contentRootUrl: this.$scope.url.play + "/" + contentPath,
        contentUrl: this.$scope.url.play + "/" + fullPath,
        shortContentUrl: this.$scope.url.play + "/" + shortPath,
        tags: content.tags || []
      };

      this.$scope.scopes = [
        { text: "Public" },
        { text: "Unlisted" },
        { text: "Private" }
      ];

      return header;
    }
    private setupDependencyAutoComplete() {
      this.$scope.getDependencies = (query) => this.$scope.request(Mods.GetModTagsQuery, { gameId: this.$scope.game.id, query: query })
        .then((d) => this.processModNames(d.lastResult))
        .catch(this.breezeQueryFailed);
      this.$scope.addModDependency = (data, hide) => {
        var found = false;

        angular.forEach(this.$scope.model.latestVersion.dependencies, item => {
          if (data.id == item.id) {
            found = true;
          }
        });

        // ReSharper disable once ExpressionIsAlwaysConst, ConditionIsAlwaysConst
        if (!found) {
          //ADD ITEM
          //BreezeEntityGraph.ModDependency.createEntity({ id: data.id, modId: this.$scope.model.id, name: data.name, });
        }
        hide();
        return false;
      };
    }
    private processModNames(names) {
      var obj = [];
      for (var i in names) {
        var mod = <any>names[i];
        obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
      }
      return obj;
    }
    private setupEditing = () => {

      this.setupEditConfig({
        canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id,
        discardChanges: () => {
          this.entityManager.getChanges().filter((x, i, arr) => {
            return (x.entityType.shortName == "Collection") ? ((<IBreezeCollection>x).id == this.$scope.model.id) : ((<any>x).collectionId && (<any>x).collectionId == this.$scope.model.id);
          }).forEach(x => x.entityAspect.rejectChanges());
          this.$scope.header.tags = this.$scope.model.tags || [];
        }
      }, null,
        [
          BreezeEntityGraph.Collection.forkedCollection().$name,
          BreezeEntityGraph.Collection.forkedCollections().$name, BreezeEntityGraph.Collection.latestVersion().$name,
          BreezeEntityGraph.Collection.mediaItems().$name, BreezeEntityGraph.Collection.fileTransferPolicies().$name,
          BreezeEntityGraph.Collection.latestVersion().dependencies().$name,
          BreezeEntityGraph.Collection.latestVersion().dependencies().modDependency().$name
        ]); // TODO: Throws errors , BreezeEntityGraph.Collection.versions().$name, BreezeEntityGraph.Collection.dependencies().$name
      this.$scope.$watch("uploadingModImage", (newValue, oldValue, scope) => {
        if (newValue == oldValue) return;

        if (!newValue) {
          this.tempCollectionImagePath = null;
        }
      });
      this.setupDependencyAutoComplete();
    };

    private cancelImageUpload() {
      var $scope = this.$scope;

      this.tempCollectionImagePath = null;
      if ($scope.model.fileTransferPolicies.length > 0) {
        var transferPolicy = $scope.model.fileTransferPolicies[0];

        transferPolicy.entityAspect.setDeleted();
        $scope.editConfig.saveChanges(transferPolicy);
      }
    }

    private newLogoUploadRequest(file: File, $event: any) {
      var $scope = this.$scope;
      //if ($scope.model.imageFileTransferPolicy) {
      //    throw Error("An Upload Request already exists.");
      //}
      if (file == null)
        return;

      if ($scope.uploadingCollectionImage) {
        this.logger.error("You are already uploading an image! Please wait!");
        return;
      }

      if (file.name.endsWithIgnoreCase(".gif")) {
        this.logger.error("You are unable to upload gifs for your mod logo.");
        return;
      }

      $scope.uploadingCollectionImage = true;

      var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
        path: file.name,
        collectionId: $scope.model.id
      });

      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = e => {
        this.$timeout(() => {
          if ($scope.uploadingCollectionImage)
            this.tempCollectionImagePath = (<any>e.target).result;
        });
      };

      var saveChanges = this.entityManager.saveChanges([uploadRequest])
        .then((result) => {
          Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Debug.log("Failure", reason);
          this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
          this.cancelImageUpload();
          $scope.uploadingCollectionImage = false;
          return;
        });
    }

    private newRemoteLogoUploadRequest(file: string, $event: any) {
      var $scope = this.$scope;
      //if ($scope.model.imageFileTransferPolicy) {
      //    throw Error("An Upload Request already exists.");
      //}
      if (file == null)
        return;

      if ($scope.uploadingCollectionImage) {
        this.logger.error("You are already uploading an image! Please wait!");
        return;
      }

      if (file.endsWithIgnoreCase(".gif")) {
        this.logger.error("You are unable to upload gifs for your mod logo.");
        return;
      }

      $scope.uploadingCollectionImage = true;

      var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
        path: file,
        collectionId: $scope.model.id
      });

      this.tempCollectionImagePath = file;

      var saveChanges = this.entityManager.saveChanges([uploadRequest])
        .then((result) => {
          Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadRemoteLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Debug.log("Failure", reason);
          this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
          this.cancelImageUpload();
          $scope.uploadingCollectionImage = false;
          return;
        });
    }

    private uploadLogo(file: File, policy: IBreezeCollectionImageFileTransferPolicy) {
      var $scope = this.$scope;
      this.uploadService.uploadToAmazonWithPolicy(file, policy.uploadPolicy)
        .success((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Debug.log(data, status, headers, config);

          this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
          policy.uploaded = true;
          $scope.uploadingCollectionImage = false;
        }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Debug.log(data, status, headers, config);
          Debug.log("Failure");

          this.cancelImageUpload();
          $scope.uploadingCollectionImage = false;

          if (data.includes("EntityTooLarge")) {
            this.logger.error("Your image can not be larger than 5MB", "Image too large");
          }
          if (data.includes("EntityTooSmall")) {
            this.logger.error("Your image must be at least 10KB", "Image too small");
          }
        });
    }

    private uploadRemoteLogo(file: string, policy: IBreezeCollectionImageFileTransferPolicy) {
      var $scope = this.$scope;
      this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
      policy.uploaded = true;
      $scope.uploadingCollectionImage = false;
    }

    showUploadBanner() {
      var $scope = this.$scope;
      var helpItem = {
        element: "#uploadBanner",
        data: {
          title: 'Upload Banner',
          content: '',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: "/src_legacy/app/play/collections/popovers/banner-upload-popover.html",
          placement: "auto left"
        },
        conditional: () => true,
        popover: null
      };
      this.$scope.showUploadBanner = () => {
        helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

        this.$timeout(() => {
          var helpPopover = helpItem.popover;
          helpPopover.$scope = $scope;
          helpPopover.show();
        });
      };
    }

    tempCollectionImagePath: any;

    setupHelp() {
      var $scope = this.$scope;
      var helpItem = {
        element: "#helpButton",
        data: {
          title: 'Help Section',
          content: 'Click the next button to get started!',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: "/src_legacy/app/play/mods/popovers/help-popover.html"
        },
        conditional: () => true,
        popover: null
      };

      var showSection = (item: HelpItem<ICollectionScope>) => {
        item.popover = this.$popover($(item.element), item.data);
        this.$timeout(() => {
          item.popover.show();
          helpItem.popover.hide();
        });
      };

      var displayCondition = (item: HelpItem<ICollectionScope>, scope: ICollectionScope): boolean => {
        if ($(item.element).length == 0)
          return false;

        return item.conditional(scope);
      };

      this.$scope.showHelp = () => {
        helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

        this.$timeout(() => {
          var helpPopover = helpItem.popover;
          helpPopover.$scope.helpItems = CollectionController.helpItems;
          helpPopover.$scope.showSection = showSection;
          helpPopover.$scope.contentScope = $scope;
          helpPopover.$scope.displayCondition = displayCondition;
          helpPopover.show();
        });
      };
    }

    private static helpItemTemplate: string = "/src_legacy/app/play/mods/popovers/help-item-popover.html";
    private static helpItems: HelpItem<ICollectionScope>[] = [
      {
        element: "#openEditorButton",
        data: {
          title: 'How to get started',
          content: 'Click here to “open editor”. This will allow you to interact with several items directly inside the Page. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: CollectionController.helpItemTemplate
        },
        conditional: ($scope) => !$scope.editConfig.editMode,
        popover: null
      },
      {
        element: ".pagetitle",
        data: {
          title: 'Edit your Title',
          content: 'Simply Click on the Title text in order to change it.<br/><br/><b>Hint:</b> Choose your Mod title carefully as it will show up in the filter and search. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: CollectionController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#addCollectionTag",
        data: {
          title: 'Add/Edit Tags',
          content: 'Click on + you can add the Tag(s) that best fit the type of your.<br/><br/><b>Hint:</b> Don´t use more than four tags if possible, as too many tags will confuse players. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: CollectionController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#collectionDescription",
        data: {
          title: 'Edit your Description',
          content: 'Keybord Shortcuts : <a target="_blank" href="http://imperavi.com/redactor/docs/shortcuts/">http://imperavi.com/redactor/docs/shortcuts/</a><br/><br/><b>Hint:</b> you can also import your BI Forum description. All you need is to set your BI forum thread as homepage and click on “Import Forum post”.',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: CollectionController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#addModDependency",
        data: {
          title: 'How to use dependencies',
          content: 'Click on “+ Add Dependency” to search and select the appropriate depended mod, or click on “x” to remove a dependency. Dependencies are not version specific.<br/><br/><b>Warning:</b> Make sure to select the correct dependencies as your mod will be launched along with the depended content. Selecting wrong or incompatible dependencies can cause crashes and errors!',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: CollectionController.helpItemTemplate,
          placement: "auto left"
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      } /*,
            {
                element: "",
                data: {
                    title: '', content: '',
                    trigger: 'manual', container: 'body', autoClose: true,
                    template: CollectionController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            }*/
    ];
  }

  registerController(CollectionController);

  export class RepoCollectionDialogController extends ModelDialogControllerBase<ICollectionScope> {
    static $name = 'RepoCollectionDialogController';
    static $view = '/src_legacy/app/play/collections/dialogs/repo-collection-warning.html';

    constructor(public $scope, public logger, $modalInstance, $q, model: ICollectionScope) {
      super($scope, logger, $modalInstance, $q, model);

      $scope.model = model.model;
    }
  }

  registerController(RepoCollectionDialogController);

  export class CollectionInfoController extends ContentController {
    static $name = 'CollectionInfoController';

    static $inject = ['$scope', 'logger', '$routeParams', '$q', '$timeout', '$popover'];

    constructor(public $scope: ICollectionScope, logger, $routeParams, $q, public $timeout, public $popover) {
      super($scope, logger, $routeParams, $q);


      this.setupComments($scope.model);
      this.setupTitle("model.name", "Info - {0} - " + $scope.model.game.name);
    }

    private setupComments(collection: IBreezeCollection) {
      this.$scope.addComment = newComment => {
        Debug.log('Add new comment', newComment);

        var r = this.$scope.requestWM<ICreateComment<IBreezeCollectionComment>>(CreateCollectionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
        newComment.message = "";
        newComment.valueOf = false;

        return r;
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteCollectionCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
        this.$scope.saveComment = comment => {
          Debug.log("Saving comment", comment);
          return this.$scope.request(SaveCollectionCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); });
        };
      this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
      if (this.$scope.environment != Tools.Environment.Production) {
        this.$scope.commentLikeStates = {};
        if (this.$scope.w6.userInfo.id) {
          this.$timeout(() => this.$scope.request(GetCollectionCommentLikeStateQuery, { collectionId: this.$scope.model.id })
            .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
            .catch(this.breezeQueryFailed));
        }

        this.$scope.likeComment = comment => {
          this.$scope.request(LikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount += 1;
            this.$scope.commentLikeStates[comment.id] = true;
          });
        };
        this.$scope.unlikeComment = comment => {
          this.$scope.request(UnlikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount -= 1;
            this.$scope.commentLikeStates[comment.id] = false;
          });
        };
      }

      this.$timeout(() => this.$scope.request(GetCollectionCommentsQuery, { collectionId: this.$scope.model.id }));
    }

  }

  registerController(CollectionInfoController);

  export class CollectionContentEditController extends BaseController {
    static $name = 'CollectionContentEditController';
  }

  registerController(CollectionContentEditController);

  export interface ICollectionContentScope extends ICollectionScope, IContentIndexScope {
    items: breeze.Entity[];
    totalServerItems;
    pagingOptions: { currentPage: number };
    totalPages;
    otherOptions: { view: string };
    contentTags;
    addTag(tag);
  }

  export class CollectionRelatedController extends ContentController {
    static $name = 'CollectionRelatedController';

    constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
      super($scope, logger, $routeParams, $q);

      if ($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
      //$scope.model.entityAspect.loadNavigationProperty("forkedCollections");

      this.setupTitle("model.name", "Related - {0} - " + $scope.model.game.name);
    }
  }

  registerController(CollectionRelatedController);

  // Not used right now..
  export class CollectionCommentsController extends ContentController {
    static $name = 'CollectionCommentsController';

    constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
      super($scope, logger, $routeParams, $q);
      this.setupTitle("model.name", "Content - {0} - " + $scope.model.game.name);
    }
  }

  registerController(CollectionCommentsController);

  // DEPRECATED: Convert to Queries/Commands
  export class CollectionDataService extends W6ContextWrapper {
    static $name = 'collectionDataService';
    public filterPrefixes = ["mod:", "user:", "tag:"];

    public getCollectionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by game: " + gameSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections")
        .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

      return this.query(query, options);
    }

    public getCollectionsByIds(ids: string[], options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by ids: " + ids + ", " + options);
      var jsonQuery = {
        from: 'Collections',
        where: {
          'id': { in: ids }
        }
      }
      var query = new breeze.EntityQuery(jsonQuery).expand(["latestVersion"].concat(options.expand || []));
      return this.query(query, options);
    }

    public getCollectionsByAuthor(userSlug, options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by author: " + userSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections")
        .where("author.slug", breeze.FilterQueryOp.Equals, userSlug);
      return this.query(query, options);
    }

    public getCollectionsByMe(options): Promise<IQueryResult<IBreezeCollection>> {
      var userSlug = this.userInfo.slug;
      Debug.log("getting collections by me: " + userSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections").expand(["latestVersion"].concat(options.expand || []))
        .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
        .withParameters({ myPage: true });
      return this.query(query, options);
    }

    public async getCollectionsByMeByGame(gameId, options): Promise<IBreezeCollection[]> {
      var userSlug = this.userInfo.slug;
      Debug.log("getting collections by me: " + userSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections").expand(["latestVersion"].concat(options.expand || []))
        .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
        .where("gameId", breeze.FilterQueryOp.Equals, gameId)
        .withParameters({ myPage: true });
      var r = await this.query(query, options);
      return r.results;
    }

    public async getMySubscribedCollections(gameId, options?) {
      let r = await this.getSubscribedCollectionIdsByGameId(gameId);
      if (r.data.length == 0) return [];
      let r2 = await this.getCollectionsByIds(r.data, options);
      return r2.results;
    }

    // can't be used due to virtual properties
    private getDesiredFields = (query) => query.select(["id", "name", "gameId", "game", "groupId", "group", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "size", "sizePacked", "subscribersCount", "modsCount"]);

    private query(query, options): Promise<IQueryResult<IBreezeCollection>> {
      if (options.filter) {
        var requiresDependencies = options.filter.text && options.filter.text != '' && options.filter.text.containsIgnoreCase('mod:');
        if (requiresDependencies) {
          if (options.sort && options.sort.fields && options.sort.fields.indexOf("author") > -1) {
            // This is currently unsupported either by Breeze, EF, OData, or AutoMapper
            var defer = this.$q.defer();
            defer.reject(new Error("Cannot search for mods while sorted by author, please choose a different sorting option, or don't search for a mod"));
            return <any>defer.promise;
          }
          query = query.expand(["dependencies"]);
        }

        query = this.applyFiltering(query, options.filter, true)
          .orderBy(this.context.generateOrderable(options.sort));
      }

      if (options.pagination)
        query = this.context.applyPaging(query, options.pagination);

      //query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeCollection>(query);
    }

    public getCollectionTagsByGame(gameSlug, name) {
      Debug.log("getting collection names: " + gameSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("Collections")
        .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug)
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getSubscribedCollectionIdsByGameId(gameId: string) {
      Debug.log("getting subscribed collection ids");
      return this.context.get<string[]>('SubscribedCollections', { gameId: gameId });
    }

    public getSubscribedCollectionIds(gameSlug: string) {
      Debug.log("getting subscribed collection ids");
      return this.context.get<string[]>('SubscribedCollections', { gameSlug: gameSlug });
    }

    private getDependenciesQuery(split): breeze.Predicate {
      var pred: breeze.Predicate;
      for (var v in split) {
        var p = this.searchDependencies(breeze, split[v]);
        pred = pred == null ? p : pred.and(p);
      }

      return pred;
    }

    private searchDependencies(breeze, lc): breeze.Predicate {
      return breeze.Predicate.create("dependencies", "any", "dependency", breeze.FilterQueryOp.Contains, lc);
    }

    public queryText(query, filterText, inclAuthor) {
      if (filterText == "")
        return query;

      var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

      var pred = this.context.getNameQuery(info.name);
      var pred2 = this.context.getTagsQuery(info.tag);
      var pred3 = this.context.getAuthorQuery(info.user);
      var pred4 = this.getDependenciesQuery(info.mod);

      return this.context.buildPreds(query, [pred, pred2, pred3, pred4]);
    }

    getCollectionTagsByAuthor(userSlug, name: string) {
      Debug.log("getting collection names: " + userSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("Collections")
        .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(new breeze.Predicate("toLower(name)", op, key)))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }
  }

  registerService(CollectionDataService);

  export class GetCollectionQuery extends DbQueryBase {
    static $name = "GetCollection";

    public execute = [
      'gameSlug', 'collectionId', (gameSlug, collectionId) => this.executeKeyQuery<IBreezeCollection>(
        () => this.getEntityQueryFromShortId("Collection", collectionId)
          .withParameters({ id: Tools.fromShortId(collectionId) })).then(x => {
            if (x.latestVersionId) {
              var query = breeze.EntityQuery.from("CollectionVersions").expand(["dependencies"])
                .where("id", breeze.FilterQueryOp.Equals, x.latestVersionId)
                .withParameters({ myPage: true });
              return this.context.executeQuery<IBreezeCollectionVersion>(query).then(_ => x);
            }
            return x;
          })
    ];
  }

  export class GetCollectionCommentsQuery extends DbQueryBase {
    static $name = 'GetCollectionComments';

    public execute = [
      'collectionId',
      (collectionId) => {
        Debug.log("getting collectioncomments by id: " + collectionId.toString());
        var query = breeze.EntityQuery.from("CollectionComments")
          // TODO: Allow loading 'leafs' on the fly? Or another form of pagination?
          // S.O or endless query?
          //.where("replyToId", breeze.FilterQueryOp.Equals, null)
          //.expand("replies")
          .where("collectionId", breeze.FilterQueryOp.Equals, collectionId)
          .orderByDesc("created");
        return this.context.executeQuery(query)
          .then((result) => result.results);
      }
    ];
  }
  export class OpenRepoCollectionDialogQuery extends DialogQueryBase {
    static $name = 'OpenRepoCollectionDialog';

    public execute = ['model', (model) => this.openDialog(RepoCollectionDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
    //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
    //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
  }

  registerCQ(OpenRepoCollectionDialogQuery);

  export class CreateCollectionCommentCommand extends DbCommandBase implements ICQWM<ICreateComment<IBreezeCollectionComment>> {
    static $name = 'CreateCollectionComment';

    static $ModelType: ICreateComment<IBreezeCollectionComment> = null;
    public $ModelType = null;

    public execute = [
      'model', (model: ICreateComment<IBreezeCollectionComment>) => {
        var entity = <IBreezeCollectionComment>this.context.createEntity("CollectionComment", { collectionId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
        if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
        return this.context.saveChanges(undefined, [entity]);
      }
    ];
  }

  export class OpenNewCollectionWelcomeDialogQuery extends DialogQueryBase {
    static $name = 'OpenNewCollectionWelcomeDialog';

    public execute = ['model', 'editConfig', (model, editConfig) => this.openDialog(CollectionNewCollectionWelcomeDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, editConfig: () => editConfig } })];
  }

  registerCQ(OpenNewCollectionWelcomeDialogQuery);

  export class CollectionNewCollectionWelcomeDialogController extends ModelDialogControllerBase<{ model: IBreezeCollection, repoLanding: boolean }> {
    static $name = 'CollectionNewCollectionWelcomeDialogController';
    static $view = '/src_legacy/app/play/collections/dialogs/new-collection-welcome.html';

    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'editConfig'];

    constructor(public $scope, public logger, $modalInstance, $q, model: { model: IBreezeCollection, repoLanding: boolean }, editConfig: IEditConfiguration<IBreezeMod>) {
      super($scope, logger, $modalInstance, $q, model);

      //$scope.editconfig = editConfig;

      $scope.edit = () => {
        editConfig.enableEditing();
        $scope.$close();
      };
    }
  }

  registerController(CollectionNewCollectionWelcomeDialogController);

  export class DeleteCollectionCommentCommand extends DbCommandBase {
    static $name = 'DeleteCollectionComment';

    public execute = [
      'model', (model: IBreezeCollectionComment) => {
        Debug.log('Delete comment', model);
        model.archivedAt = new Date(Date.now());
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  export class GetForkedCollectionsQuery extends DbQueryBase {
    static $name = 'GetForkedCollections';

    // TOdo: mISSING IS:             if($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
    public execute = [
      'collectionId', 'gameSlug',
      (collectionId, gameSlug) => this.context.executeQuery(breeze.EntityQuery.from("Collections")
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("forkedCollectionId", breeze.FilterQueryOp.Equals, Tools.fromShortId(collectionId)))))
        .then(result => result.results)
    ];
  }


  export class SaveCollectionCommentCommand extends DbCommandBase implements ICQWM<IBreezeCollectionComment> {
    static $name = 'SaveCollectionComment';
    public $ModelType = null;

    public execute = [
      'model', (model: IBreezeCollectionComment) => {
        //model.entityAspect.setDeleted();
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  export class GetCollectionCommentLikeStateQuery extends DbQueryBase {
    static $name = 'GetCollectionCommentLikeState';
    public execute = ['collectionId', collectionId => this.context.getCustom('comments/collections/' + collectionId + "/states")];
  }

  registerCQ(GetCollectionCommentLikeStateQuery);

  export class LikeCollectionCommentCommand extends DbCommandBase {
    static $name = 'LikeCollectionCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "like")];
  }

  registerCQ(LikeCollectionCommentCommand);

  export class UnlikeCollectionCommentCommand extends DbCommandBase {
    static $name = 'UnlikeCollectionCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "unlike")];
  }

  registerCQ(UnlikeCollectionCommentCommand);

  export class SubscribeCollectionCommand extends DbCommandBase {
    static $name = 'SubscribeCollectionCommand';
    public execute = [
      'model', (model: IBreezeCollection) =>
        this.context.postCustom("collections/" + model.id + "/subscribe")
    ];
  }

  registerCQ(SubscribeCollectionCommand);

  export class UnsubscribeCollectionCommand extends DbCommandBase {
    static $name = 'UnsubscribeCollectionCommand';
    public execute = [
      'model', (model: IBreezeCollection) =>
        this.context.postCustom("collections/" + model.id + "/unsubscribe")
    ];
  }

  registerCQ(UnsubscribeCollectionCommand);

  export class GetCollectionContentTagsQuery extends DbQueryBase {
    static $name = 'GetCollectionContentTags';
    public execute = [
      'id', id => this.context.getCustom('collectionversions/' + id + '/contenttags')
        .then(r => r.data)
    ];
  }

  registerCQ(GetCollectionContentTagsQuery);

  registerCQ(GetForkedCollectionsQuery);
  registerCQ(GetCollectionQuery);
  registerCQ(GetCollectionCommentsQuery);
  registerCQ(CreateCollectionCommentCommand);
  registerCQ(DeleteCollectionCommentCommand);
  registerCQ(SaveCollectionCommentCommand);
}

export module MyApp.Play.Games {
  //export interface IMultiPageDialogScope extends IBaseScope {
  //    page: string;
  //}

  export interface IAddCollectionDialogScope extends IMultiPageDialogScope {
    model;
    claimToken: string;
    cancel: Function;
    ok: Function;
    verifyToken: Function;
    verificationFailed: Boolean;
    formatProvider: string;
    error: string;
    hasHomepageUrl: boolean;
    copy: () => void;
    reload: () => void;
    okNew: () => void;
    okImport: () => void;
    quote: string;
    folderPattern: RegExp;
    versionPattern: RegExp;
    openTerms: () => void;
    addDependency: (data) => boolean;
    removeDependency: (data) => void;
    getDependencies: (query) => any;
    gameName: string;
    hints: any;
    checkingPackageName: boolean;
    inlineHints: any;
    branches: { displayName: string; value: string }[];
    getForumPost: () => any;
    checkingDownloadLink: boolean;
    importResult: string[];
  }

  export class AddCollectionDialogController extends DialogControllerBase {
    static $name = 'AddCollectionDialogController';
    static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game'];
    static $viewBaseFolder = '/src_legacy/app/play/games/stream/dialogs/';
    private $viewBaseFolder = AddCollectionDialogController.$viewBaseFolder;
    private $newViewBaseFolder = this.$viewBaseFolder + 'add-collection-new/';
    private $importViewBaseFolder = this.$viewBaseFolder + 'add-collection-import/';
    static $view = AddCollectionDialogController.$viewBaseFolder + 'add-collection-dialog.html';
    private $subViewBaseFolder: string;
    private authorSubmission = false;

    constructor(public $scope: IAddCollectionDialogScope, logger, private $routeParams, private $location: ng.ILocationService, $modalInstance, $q, private $timeout: ng.ITimeoutService, private model: IBreezeGame) {
      super($scope, logger, $modalInstance, $q);
      this.$subViewBaseFolder = this.$viewBaseFolder;
      $scope.cancel = this.cancel;
      $scope.ok = this.ok;
      $scope.okNew = this.okNew;
      $scope.okImport = this.okImport;
      $scope.model = {
        gameId: model.id,
        uri: null
      };

      $scope.gameName = model.name;
      $scope.page = this.$subViewBaseFolder + 'add-collection-1.html';
      $scope.quote = this.getQuote();
      $scope.openTerms = () => {
        $scope.request(Components.Dialogs.OpenTermsDialogQuery);
      };
      $scope.hints = AddModDialogController.hints;
      $scope.inlineHints = AddModDialogController.inlineHints;

    }

    private getQuote = (): string => {
      var arr = [
        "A good mod can be part of a great many"
      ];
      return arr[Math.floor(Math.random() * arr.length)];
    };
    private checkPackageName = (packageName: string) => {
      this.$scope.checkingPackageName = true;
      this.$scope.model.packageNameAvailable = false;
      this.$scope.request(Mods.ModExistsQuery, { packageName: packageName })
        .then((result) => {
          this.$scope.checkingPackageName = false;
          Debug.log(result);
          this.$scope.model.packageNameAvailable = !result.lastResult;
        })
        .catch(this.httpFailed);
    };

    checkDownloadLink(uri: string) {
      this.$scope.checkingDownloadLink = true;
      this.$scope.model.downloadLinkAvailable = false;
      this.$scope.request(GetCheckLinkQuery, { linkToCheck: uri })
        .then((result) => {
          this.$scope.checkingDownloadLink = false;
          Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result.lastResult;
        })
        .catch(this.httpFailed);
    }

    private cancel = () => this.$modalInstance.close();
    private reload = () => window.location.reload();

    private ok = () => {
      var data = this.$scope.model;
      if ((<string>data.uri).endsWithIgnoreCase("config.yml")) {
        this.$scope.request(NewImportedCollectionCommand, { data: data })
          .then(result => {
            if (result.lastResult.data.length == 1) {
              var modId = Tools.toShortId(result.lastResult.data[0]);
              this.$modalInstance.close();
              //var slug = <string>data.name.sluggifyEntityName();
              this.$location.path(Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
            } else {
              this.$scope.importResult = [];
              for (var i = 0; i < result.lastResult.data.length; i++) {
                this.$scope.importResult[i] = Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", Tools.toShortId(result.lastResult.data[i]), "slug"]);
              }
              this.$scope.page = this.$newViewBaseFolder + 'add-collection-3.html';
            }
          })
          .catch(this.httpFailed);
      } else {
        this.$scope.request(NewMultiImportedCollectionCommand, { data: data })
          .then(result => {
            var modId = Tools.toShortId(result.lastResult.data);
            this.$modalInstance.close();
            //var slug = <string>data.name.sluggifyEntityName();
            this.$location.path(Tools.joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
          })
          .catch(this.httpFailed);
      }

    };

    private okNew = () => {
      this.$subViewBaseFolder = this.$newViewBaseFolder;
      this.$scope.page = this.$newViewBaseFolder + 'add-collection-2.html';
    };

    donePre: boolean = false;

    private okImport = () => {
      this.$subViewBaseFolder = this.$importViewBaseFolder;

      this.$scope.page = this.$importViewBaseFolder + 'add-collection-2.html';
    };

    public static hints = {
      example: "exmaple text"
    };

    public static inlineHints = {
      repoLink: "Must not be empty and must start with 'http://'"
    };
  }

  registerController(AddCollectionDialogController);

  export interface IMultiPageDialogScope extends IBaseScope {
    page: string;
  }

  export interface IAddModDialogScope extends IMultiPageDialogScope {
    model: {
      mod: {
        download: string;
        branch: string;
        versionUnknown: boolean;
        packageName: string;
        groupId: string;
        name?: string;
        author?: string;
        description?: string;
        version?: string;
        gameSlug: string;
        homepage?: string;
        tags?: string[];
      },
      info: {
        type: string;
        folder: string;
        userName: string;
        password: string;
      },
      acceptToS: boolean;
      amAuthor: boolean;
      packageNameAvailable: boolean;
      downloadLinkAvailable: boolean;
    }
    claimToken: string;
    cancel: Function;
    ok: Function;
    verifyToken: Function;
    verificationFailed: Boolean;
    formatProvider: string;
    error: string;
    hasHomepageUrl: boolean;
    copy: () => void;
    reload: () => void;
    ok_user: () => void;
    ok_author: () => void;
    quote: string;
    folderPattern: RegExp;
    versionPattern: RegExp;
    openTerms: () => void;
    addDependency: (data) => boolean;
    removeDependency: (data) => void;
    getDependencies: (query) => any;
    gameName: string;
    hints: any;
    checkingPackageName: boolean;
    inlineHints: any;
    branches: { displayName: string; value: string }[];
    getForumPost: () => any;
    checkingDownloadLink: boolean;
    showExtension: boolean;
    installExtension: () => Promise<void>;
  }

  export interface IModVersionInfo {
    name: string;
    author: string;
    version: string;
    branch: string;
    url: string;
    downloadUrl: string;
    description: string;
    tags: string[];
  }

  export class AddModDialogController extends DialogControllerBase {
    static $name = 'AddModDialogController';
    static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game', 'info', 'modInfoService', 'dbContext'];
    static $viewBaseFolder = '/src_legacy/app/play/games/stream/dialogs/';
    private $viewBaseFolder = AddModDialogController.$viewBaseFolder;
    private $userViewBaseFolder = this.$viewBaseFolder + 'add-mod-user/';
    private $authorViewBaseFolder = this.$viewBaseFolder + 'add-mod-author/';
    static $view = AddModDialogController.$viewBaseFolder + 'add-mod-dialog.html';
    private $subViewBaseFolder: string;
    private authorSubmission = false;

    constructor(public $scope: IAddModDialogScope, logger, private $routeParams, private $location: ng.ILocationService, $modalInstance, $q, private $timeout: ng.ITimeoutService, private model: IBreezeGame, private info: { type?: string, folder?: string, groupId?: string }, private modInfoService, private dbContext: W6Context) {
      super($scope, logger, $modalInstance, $q);
      this.$subViewBaseFolder = this.$viewBaseFolder;
      $scope.cancel = this.cancel;
      $scope.ok = this.ok;
      $scope.ok_user = this.ok_user;
      $scope.ok_author = this.ok_author;
      $scope.showExtension = window.w6Cheat.w6.miniClient.clientInfo && !window.w6Cheat.w6.miniClient.clientInfo.extensionInstalled;
      $scope.installExtension = () => {
        $scope.showExtension = false;
        return this.modInfoService.installExplorerExtension();
      }
      $scope.model = {
        mod: {
          download: null,
          branch: "",
          versionUnknown: false,
          packageName: "",
          groupId: info.groupId,
          gameSlug: this.model.slug
        },
        info: {
          type: info.type || "download",
          folder: info.folder || "",
          userName: Tools.Password.generate(128),
          password: Tools.Password.generate(128)
        },
        acceptToS: false,
        amAuthor: false,
        packageNameAvailable: false,
        downloadLinkAvailable: false
      };
      $scope.branches = AddModDialogController.branches;
      $scope.checkingPackageName = false;
      $scope.checkingDownloadLink = false;
      $scope.gameName = this.model.name;
      $scope.page = this.$subViewBaseFolder + 'add-mod-1.html';
      $scope.quote = this.getQuote();
      $scope.folderPattern = AddModDialogController.folderPattern;
      $scope.versionPattern = AddModDialogController.versionPattern;

      this.setupDependencyAutoComplete();
      Debug.log(model);

      $scope.hints = AddModDialogController.hints;

      $scope.inlineHints = AddModDialogController.inlineHints;

      $scope.$watch("model.mod.packageName", (newValue: string, oldValue: string, scope) => {
        if (newValue != oldValue && newValue != null && newValue != "")
          this.checkPackageName(newValue);
      });

      $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
        if (newValue != oldValue && newValue != null && newValue != "")
          this.checkDownloadLink(newValue);
      });

      $scope.getForumPost = () => this.requestAndProcessCommand(Play.Mods.GetForumPostQuery, { forumUrl: $scope.model.mod.homepage }, 'fetch first post') // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
        .then(r => {
          $timeout(() => {
            $scope.model.mod.name = r.lastResult.title;
            $scope.model.mod.author = r.lastResult.author;
            $scope.model.mod.description = r.lastResult.body;
          }, 1000);
        });

      //if (info.folder) {
      if ($scope.w6.userInfo.isAdmin) {
        this.ok_user();
      } else {
        this.ok_author();
      }
      //}
    }
    // todo; make part of commands
    selectFolder() {
      if (!this.$scope.w6.miniClient.isConnected) {
        alert("Please start the Sync client first, and make sure it is uptodate");
        return;
      }
      return this.modInfoService.prepareFolder().then(x => this.applyIfNeeded(() => this.$scope.model.info.folder = x));
    }
    upload(modId) {
      return this.modInfoService.uploadFolder({ folder: this.$scope.model.info.folder, userId: this.getUploadId(), gameId: this.model.id, contentId: modId, userName: this.$scope.model.info.userName, password: this.$scope.model.info.password })
        .then(x => this.dbContext.postCustom("mods/" + modId + "/finished-upload"));
    }

    getUploadId = () => this.$scope.model.mod.groupId || this.$scope.w6.userInfo.id;

    private getQuote = (): string => {
      var arr = [
        "Where all good stories start",
        "No good story survives a few tall tales",
        "The best never comes from one, but many",
        "All great content has humble beginnings"
      ];
      return arr[Math.floor(Math.random() * arr.length)];
    };
    private checkPackageName = (packageName: string) => {
      this.$scope.checkingPackageName = true;
      this.$scope.model.packageNameAvailable = false;
      this.$scope.request(Mods.ModExistsQuery, { packageName: packageName })
        .then((result) => {
          this.$scope.checkingPackageName = false;
          Debug.log(result);
          this.$scope.model.packageNameAvailable = !result.lastResult;
        })
        .catch(this.httpFailed);
    };

    checkDownloadLink(uri: string) {
      this.$scope.checkingDownloadLink = true;
      this.$scope.model.downloadLinkAvailable = false;
      this.$scope.request(GetCheckLinkQuery, { linkToCheck: uri })
        .then((result) => {
          this.$scope.checkingDownloadLink = false;
          Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result.lastResult;
        })
        .catch(this.httpFailed);
    }

    private cancel = () => this.$modalInstance.close();
    private reload = () => window.location.reload();

    get type() {
      if (this.$scope.model.info.type == "upload")
        return 1;
      return 0;
    }

    getLatestInfo() {
      let model = this.$scope.model;
      this.$scope.request(Mods.GetLatestInfo, { data: { downloadUri: model.mod.download } }).then(x => {
        let r = <IModVersionInfo>x.lastResult;
        model.mod.version = r.version;
        model.mod.branch = r.branch;
        if (!model.mod.name) model.mod.name = r.name;
        if (!model.mod.author) model.mod.author = r.author;
        if (!model.mod.homepage) model.mod.homepage = r.url;
        if (!model.mod.description) model.mod.description = r.description;
        if (!model.mod.homepage) model.mod.download;
        model.mod.tags = r.tags;
      });
    }

    private ok = () => {
      // TODO: All or almost all should be validators on the form. The rest should be checked on the server so that people manipulating the Post, are still blocked
      if (!this.$scope.model.acceptToS || !this.$scope.model.packageNameAvailable || this.$scope.checkingPackageName)
        return;
      let shouldUpload = this.type == 1;
      if (shouldUpload) {
        this.$scope.model.mod.download = `rsync://${this.$scope.model.info.userName}:${this.$scope.model.info.password}@staging.sixmirror.com`;
      }

      if (!this.checkData(this.$scope.model.mod))
        return;
      if (!this.authorSubmission && !this.$scope.model.mod.groupId && (!this.$scope.model.mod.author || !this.$scope.model.mod.author.trim()))
        return;
      if (this.authorSubmission && !this.$scope.model.amAuthor)
        return;
      var data = JSON.parse(JSON.stringify(this.$scope.model.mod));
      if (this.$scope.model.mod.versionUnknown) {
        data.version = "0";
        data.branch = "unknown";
      }

      if (this.authorSubmission) data.author = "";
      this.$scope.request(NewModCommand, { data: data })
        .then(result => {
          let modId = result.lastResult;
          let shortId = Tools.toShortId(modId);
          let slug = <string>data.name.sluggifyEntityName();
          this.$modalInstance.close();
          let url = Tools.joinUri([this.$scope.url.play, this.model.slug, "mods", shortId, slug]);
          // workaround page load issue... weird!
          window.w6Cheat.navigate(url + "?landing=1");
          this.$location.path(url).search('landing', 1);
          return modId;
        })
        .then(async (x) => {
          if (shouldUpload) {
            await this.upload(x);
          }
        })
        .catch(this.httpFailed);
    };

    private checkData = (data: any): boolean => {
      if (!data.packageName.startsWith("@"))
        return false;
      return true;
    };
    private ok_user = () => {
      this.$subViewBaseFolder = this.$userViewBaseFolder;
      this.$scope.page = this.$userViewBaseFolder + 'add-mod-2.html';
      this.$scope.openTerms = () => this.$scope.request(Components.Dialogs.OpenTermsDialogQuery);
      this.authorSubmission = false;
    };

    donePre: boolean = false;

    private ok_author = () => {
      this.$subViewBaseFolder = this.$authorViewBaseFolder;

      this.$scope.openTerms = () => this.$scope.request(Components.Dialogs.OpenTermsDialogQuery);
      this.authorSubmission = true;
      this.$scope.model.mod.author = this.$scope.w6.userInfo.displayName;

      if (this.model.id == "be87e190-6fa4-4c96-b604-0d9b08165cc5" && !this.donePre) {
        this.donePre = true;
        this.$scope.page = this.$authorViewBaseFolder + 'add-mod-2-gta-pre.html';
      } else {
        this.$scope.page = this.$authorViewBaseFolder + 'add-mod-2.html';
      }
    };

    private setupDependencyAutoComplete() {
      this.$scope.getDependencies = (query) => this.$scope.request(Mods.GetModTagsQuery, { gameId: this.model.id, query: query })
        .then((d) => this.processModNames(d.lastResult))
        .catch(this.breezeQueryFailed);
    }

    private processModNames(names) {
      var obj = [];
      for (var i in names) {
        var mod = <any>names[i];
        obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
      }
      return obj;
    }

    public static versionPattern = /^[0-9]{1,20}([.][0-9]{1,20}){0,3}$/;
    public static folderPattern = /^@[a-zA-Z0-9]([^ *'\- /><?\\\"|:]{1,219})$/;

    public static branches = [
      { displayName: "Stable", value: "stable" },
      { displayName: "RC", value: "rc" },
      { displayName: "Beta", value: "beta" },
      { displayName: "Alpha", value: "alpha" }
    ];

    public static hints = {
      name: "This is the display name for the mod that will show in the Header.<br /><br/><b>Hint:</b> As the Mod name is a static entity, please do not add any version numbers here.",
      author: "The author is the owner of the mod.<br /><br/><b>Hint:</b> The content is connected to the account and will show up on the profile page too.",
      version: "Versioning supports up to four sequences of numbers, depending on the significance of the changes.<br /><br/><b>Hint:</b> For a calendar based versioning please use a Year.Month.day sequence.",
      dependencies: "These are add-ons required to for this mod to be launched on startup in order for it to work properly.<br /><br/><b>Hint:</b> Dependencies will be downloaded and updated automatically upon selection of the main mod.",
      branch: "Branches are streams that allow mods to be split into different revisions, depending on their state of completion.<br /><br/><b>Hint:</b> Users can select if they want to download only stable versions or development branches (alpha, beta).",
      download: "The link should directly start the download.<br /><br/><b>Hint:</b> If possible please add multiple links at once in order to ensure an uninterrupted processing of the mod.",
      homepage: "The homepage is the source of the download and is required to check for authenticity and origin.<br /><br/><b>Hint:</b> If you add a BI Forum thread as Homepage, the first post can be injected as a description automatically.",
      comments: "Please add any special requests or information that would help us to process your mod faster as a comment.<br /><br/><b>Hint:</b> Let us know if your mod requires dependencies that you couldn´t find on our network.",
      packageName: "The Folder is the physical directory for the modification, it has to be unique in order to prevent conflicts with other mods of the ArmA series.<br /><br/><b>Hint:</b> You can use this to check if the mod is already available.",
      packageNameUnavailable: "Unfortunately the name you have chosen is already taken.<br/>We recommend you confirm that the mod has not already been uploaded, otherwise choose a different name.",
      downloadLinkUnavailable: "We can't seem to determine if the download link you provided is online or a real download, submitting this may increase processing time."
    };

    public static inlineHints = {
      name: "Must have a Name",
      author: "Must have an Author",
      version: "Version incorrect",
      dependencies: "",
      branch: "Must select a branch",
      download: "Must not be empty and must start with 'http://'",
      homepage: "Can be empty but must start with 'http://'",
      comments: "",
      packageName: "Must be at least 3 characters long",
      packageNameUnavailable: "Folder Name already exists",
      packageNameMissingPrefix: "Must start with '@'",
      packageNameEmpty: "Must have a Folder Name",
      downloadLinkUnavailable: "Link Availability Unknown.",
      downloadLinkAvailable: "Link Availabile.",
      checkingDownload: "Checking Availability.",
      badVersion: "Version conflict: New version Number must be higher than previous"
    };
  }

  registerController(AddModDialogController);


  export class OpenAddModDialogQuery extends DbQueryBase {
    static $inject = ['dbContext', '$modal', 'logger'];
    static $name = 'OpenAddModDialog';

    constructor(context: W6Context, private $modal, private logger) { super(context); }

    public execute = [
      'gameSlug', 'info',
      (gameSlug, info: { type?: string, folder?: string, groupId?: string }) => {
        let game = this.context.w6.activeGame;
        Debug.log(this.$modal);
        return DialogQueryBase.openDialog(this.$modal, AddModDialogController, {
          resolve: {
            game: () => Promise.resolve({ id: game.id, slug: game.slug, name: game.slug.replace("-", " ").toUpperCaseFirst() }), // this.findBySlug("Games", gameSlug, "getGame")
            info: () => info
          }
        });
      }
    ];
  }

  registerCQ(OpenAddModDialogQuery);

  export class OpenAddCollectionDialogQuery extends DbQueryBase {
    static $inject = ['dbContext', '$modal', 'logger'];
    static $name = 'OpenAddCollectionDialog';

    constructor(context: W6Context, private $modal, private logger) { super(context); }

    public execute = [
      'gameSlug',
      (gameSlug) => {

        Debug.log(this.$modal);
        return DialogQueryBase.openDialog(this.$modal, AddCollectionDialogController, {
          resolve: {
            game: () => this.findBySlug("Games", gameSlug, "getGame")
          }
        });
      }
    ];
  }

  registerCQ(OpenAddCollectionDialogQuery);

  export class GetGamesQuery extends DbQueryBase {
    static $name = "GetGames";

    public execute = [
      () => this.context.executeQuery(breeze.EntityQuery.from("Games")
        .where("parentId", breeze.FilterQueryOp.Equals, null)
        .where("public", breeze.FilterQueryOp.Equals, true) // ...
        .orderBy("name"))
        .then(data => data.results)
    ];
  }

  registerCQ(GetGamesQuery);

  export class GetGameQuery extends DbQueryBase {
    static $name = "GetGame";
    static $inject = ['dbContext', 'aur.basketService'];

    constructor(context: W6Context, private basketService) {
      super(context);
    }

    public execute = ['gameSlug', async (gameSlug) => {
      let game = await this.findBySlug("Games", gameSlug, "getGame");

      return { game: game, gameInfo: await this.basketService.getGameInfo(game.id) };
    }
    ];
  }

  registerCQ(GetGameQuery);

  export class NewModCommand extends DbCommandBase {
    static $name = 'NewMod';
    public execute = ['data', data => this.context.postCustom<{ result: string }>("mods", data, { requestName: 'postNewMod' }).then(r => r.data.result)];
  }

  registerCQ(NewModCommand);
  export class NewImportedCollectionCommand extends DbCommandBase {
    static $name = 'NewImportedCollection';
    public execute = ['data', data => this.context.postCustom("collections/import-repo", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
  }

  registerCQ(NewImportedCollectionCommand);

  export class NewMultiImportedCollectionCommand extends DbCommandBase {
    static $name = 'NewMultiImportedCollection';
    public execute = ['data', data => this.context.postCustom("collections/import-server", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
  }

  registerCQ(NewMultiImportedCollectionCommand);

  export class GetCheckLinkQuery extends DbCommandBase {
    static $name = 'GetCheckLink';
    public execute = ['linkToCheck', linkToCheck => this.context.getCustom<BooleanResult>("cool/checkLink", { requestName: 'checkLink', params: { linkToCheck: linkToCheck } }).then(result => result.data.result)];
  }

  registerCQ(GetCheckLinkQuery);

  import ClientInfo = MyApp.Components.ModInfo.IClientInfo;
  import ItemState = MyApp.Components.ModInfo.ItemState;
  import BasketService = MyApp.Components.Basket.BasketService;

  interface IGamesScope extends IBaseScopeT<IBreezeGame[]> {

  }

  class GamesController extends BaseQueryController<IBreezeGame[]> {
    static $name = "GamesController";

    constructor(public $scope: IGamesScope, public logger, $q, model: IBreezeGame[]) {
      super($scope, logger, $q, model);
      // TODO: Move to Directive..
      $('#header-row').attr('style', 'background-image: url("' + $scope.url.getAssetUrl('img/play.withSIX/header.jpg') + '");');
      $('body').removeClass('game-profile');
    }
  }

  registerController(GamesController);

  export interface IGameScope extends IBaseScopeT<IBreezeGame>, IBaseGameScope { }

  class GameController extends BaseQueryController<IBreezeGame> {
    static $name = "GameController";

    static $inject = [
      '$scope', 'logger', '$q', 'dbContext', 'model', 'modInfoService',
      '$rootScope', 'basketService', 'aur.eventBus'
    ];

    constructor(public $scope: IGameScope, public logger, $q, dbContext, query: { game: IBreezeGame, gameInfo }, private modInfo,
      $rootScope: IRootScope, basketService: Components.Basket.BasketService, private eventBus: EventAggregator) {
      super($scope, logger, $q, query.game);

      let model = query.game;
      let clientInfo = query.gameInfo.clientInfo;

      $scope.gameUrl = $scope.url.play + "/" + model.slug;
      $scope.game = model;

      $scope.addToCollections = (mod: IBreezeMod) => { this.eventBus.publish(new window.w6Cheat.containerObjects.openAddModsToCollectionsDialog($scope.game.id, [{ id: mod.id, name: mod.name, packageName: mod.packageName, groupId: mod.groupId }])) };

      let getItemProgressClass = (item: Components.Basket.IBasketItem): string => {
        let state = $scope.clientInfo.content[item.id];
        if (!state || !(state.state == ItemState.Updating || state.state == ItemState.Installing))
          return null;
        var percent = Math.round(state.progress);
        if (percent < 1)
          return "content-in-progress content-progress-0";
        if (percent > 100)
          return "content-in-progress content-progress-100";
        return "content-in-progress content-progress-" + percent;
      }

      let getItemBusyClass = (item): string => {
        var clientInfo = <ClientInfo>(<any>$scope).clientInfo;
        var ciItem = clientInfo.content[item.id];
        if (ciItem == null) return "";
        var itemState = ciItem.state;

        switch (itemState) {
          case ItemState.Installing:
          case ItemState.Uninstalling:
          case ItemState.Updating:
          case ItemState.Launching:
            return "busy";
          default:
            return "";
        }
      }

      // TODO: Duplicate in basket-service
      let getItemStateClass = (item: Components.Basket.IBasketItem): string => {
        var clientInfo = <ClientInfo>(<any>$scope).clientInfo;
        var ciItem = clientInfo.content[item.id];
        var postState = "";

        if (!$rootScope.w6.miniClient.isConnected) {
          if (basketService.settings.hasConnected) {
            if ($scope.showBusyState())
              return "busy";
            return "no-client";
          } else {
            return "install";
          }
        }
        //if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
        //    return "busy";
        //}
        if ($scope.showBusyState())
          postState = "-busy";
        let state = window.w6Cheat.api.getContentStateInitial(ciItem, item.constraint);
        switch (state) {
          case ItemState.NotInstalled:
            return "install" + postState;
          case ItemState.Incomplete:
            return "incomplete" + postState;
          case ItemState.UpdateAvailable:
            return "updateavailable" + postState;
          case ItemState.Uptodate:
            return "uptodate" + postState;

          case ItemState.Installing:
            return "installing" + postState;
          case ItemState.Updating:
            return "updating" + postState;
          case ItemState.Uninstalling:
            return "uninstalling" + postState;
          case ItemState.Launching:
            return "launching" + postState;

          default:
            return "install" + postState;
        }
      }

      $scope.getItemClass = (item: Components.Basket.IBasketItem): string => {
        let progress = getItemProgressClass(item);
        return `content-state-${getItemStateClass(item)} ${progress ? progress : ""} ${getItemBusyClass(item)}`
      }

      var items = [];

      if (model.supportsStream)
        items.push({ header: "Stream", segment: "stream", icon: "icon withSIX-icon-Nav-Stream", isDefault: true });

      if (model.supportsMods) {
        items.push({ header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" });
        this.$scope.openAddModDialog = (info = { type: "download", folder: "" }) => this.eventBus.publish(new window.w6Cheat.containerObjects.openAddModDialog(model, info));
        this.$scope.openAddCollectionDialog = () => this.eventBus.publish(new window.w6Cheat.containerObjects.openCreateCollectionDialog(model));
      }

      if (model.supportsMissions)
        items.push({ header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" });

      if (model.supportsCollections)
        items.push({ header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection" });

      if (model.supportsServers && $scope.environment != Tools.Environment.Production)
        items.push({ header: "Servers", segment: "servers", icon: "icon withSIX-icon-Nav-Server" });

      if ($scope.w6.enableBasket)
        items.push({ header: "My Library", segment: "library", icon: "icon withSIX-icon-Folder", url: "/me/library/" + model.slug, isRight: true });

      // TODO: if owns game (get from client, then hide this)
      items.push({ header: "Buy " + model.name, segment: "order", icon: "icon withSIX-icon-Card-Purchase", isRight: true });

      $scope.menuItems = this.getMenuItems(items, "game");

      $scope.followedMods = {};
      $scope.followedMissions = {};
      $scope.subscribedCollections = {};

      if ($scope.w6.userInfo.id) {
        dbContext.get('FollowedMods', { gameSlug: model.slug })
          .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMods))
          .catch(this.breezeQueryFailed);
        dbContext.get('FollowedMissions', { gameSlug: model.slug })
          .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMissions))
          .catch(this.breezeQueryFailed);
        dbContext.get('SubscribedCollections', { gameSlug: model.slug })
          .then(results => this.subscriptionQuerySucceeded(results, $scope.subscribedCollections))
          .catch(this.breezeQueryFailed);
      }

      $scope.clientInfo = clientInfo;

      $scope.showBusyState = (): boolean => {
        //isInitBusy ||
        return $scope.clientInfo.gameLock || $scope.clientInfo.globalLock;
      };

      $scope.isActive = (mod: IBreezeMod) => $scope.showBusyState() && basketService.lastActiveItem == mod.id;

      $scope.abort = (mod: IBreezeMod) => basketService.abort(mod.gameId)

      $scope.directDownload = async (item: any) => {
        if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
          logger.error("Client is currently busy");
          return;
        }
        basketService.lastActiveItem = item.id;
        await basketService.getGameBaskets($scope.game.id).handleAction(Helper.modToBasket(item, $scope.game.id), $scope.clientInfo, 1);
      };
      $scope.canAddToBasket = (): boolean => true;
      // {
      //   return !basketService.getGameBaskets($scope.game.id).active.model.isTemporary;
      // };

      $scope.directDownloadCollection = async (item: IBreezeCollection) => {
        if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
          logger.error("Client is currently busy");
          return null;
        }
        basketService.lastActiveItem = item.id;
        await basketService.getGameBaskets($scope.game.id).handleAction(Helper.collectionToBasket(item, $scope.game.id), $scope.clientInfo, 2)
      };
      var s = this.eventBus.subscribe("basketChanged", () => this.applyIfNeeded());

      // TODO: Move to Directive..
      $scope.$on('$destroy', () => {
        s.dispose();
        $('#wrapper').removeClass('play-game');
      });
      $('#header-row').attr('style', 'background-image:url("' + $scope.url.getAssetUrl('img/play.withSIX/games/' + model.slug + '/headers/header.png') + '");');
      $('#wrapper').removeClass('play-game');
      $('#wrapper').addClass('play-game');
    }

    subscriptionQuerySucceeded = (result, d) => {
      for (var v in result.data)
        d[result.data[v]] = true;
    };
  }

  registerController(GameController);

  class OrderController extends BaseController {
    static $name = "OrderController";

    constructor(public $scope: IGameScope, public logger, public $q) {
      super($scope, logger, $q);
      // TODO: Move to Directive..
      $('body').removeClass('game-profile');
      $scope.setMicrodata({ title: "Order" + $scope.model.fullName, description: "Order the game " + $scope.model.fullName, keywords: "order, " + $scope.model.name + ", " + $scope.model.fullName });
    }
  }

  registerController(OrderController);

  interface IStreamScope extends IBaseGameScope, IBaseScopeT<any> {
    streamPath: string;
    addToBasket: (mod: any) => void;
    baskets: any; //GameBaskets;
    isInBasket: (mod: IBreezeMod) => boolean;
  }

  class StreamController extends BaseQueryController<any> {
    static $name = "StreamController";
    static $inject = ['$scope', 'logger', '$q', '$rootScope', 'basketService', 'model'];

    constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: Components.Basket.BasketService, model: any) {
      super($scope, logger, $q, model);

      var basket = basketService.getGameBaskets($scope.game.id);

      $scope.addToBasket = mod => basketService.addToBasket($scope.game.id, Helper.streamModToBasket(mod, $scope.game.id));
      $scope.streamPath = 'stream';

      $scope.baskets = basket;
      $scope.isInBasket = (mod: IBreezeMod) => basket.active.content.has(mod.id);

      // TODO: Move to Directive..
      $('body').removeClass('game-profile');
    }
  }

  registerController(StreamController);

  class PersonalStreamController extends StreamController {
    static $name = "PersonalStreamController";

    constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: Components.Basket.BasketService, model: any) {
      super($scope, logger, $q, $rootScope, basketService, model);

      $scope.streamPath = 'stream/personal';
    }
  }

  registerController(PersonalStreamController);
}

export module MyApp.Play.Missions {

  export class GetMissionQuery extends DbQueryBase {
    static $name = 'GetMission';

    public execute = [
      'missionId', missionId => this.executeKeyQuery<IBreezeMission>(
        () => this.getEntityQueryFromShortId("Mission", missionId)
          .withParameters({ id: Tools.fromShortId(missionId) })
          .expand(['features', 'mediaItems']))
      /*
                      .then(r => {
                          // currently loading asynchronously and without error handling...
                          r.entityAspect.loadNavigationProperty("latestVersion");
                          return r;
                      })
      */
    ];
  }

  export class GetMissionVersionQuery extends DbQueryBase {
    static $name = 'GetMissionVersion';

    public execute = [
      'model',
      (model) => this.executeKeyQuery<IBreezeMissionVersion>(
        () => this.getEntityQuery("MissionVersion", model)
          .withParameters({ id: model }))
    ];
  }

  export class GetMissionCommentsQuery extends DbQueryBase {
    static $name = 'GetMissionComments';

    public execute = [
      'missionId',
      (missionId) => {
        Debug.log("getting missioncomments by id: " + missionId.toString());
        var query = breeze.EntityQuery.from("MissionComments")
          .where("missionId", breeze.FilterQueryOp.Equals, missionId)
          .orderByDesc("created");
        return this.context.executeQuery(query)
          .then((result) => result.results);
      }
    ];
  }

  export class CreateMissionCommentCommand extends DbCommandBase {
    static $name = 'CreateMissionComment';

    public execute = [
      'model', (model: ICreateComment<IBreezeMissionComment>) => {
        Debug.log(model);
        var entity = <IBreezeMissionComment>this.context.createEntity("MissionComment", { missionId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
        if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
        return this.context.saveChanges(undefined, [entity]);
      }
    ];

  }

  export class EditMissionQuery extends DbQueryBase {
    static $name = 'EditMission';

    public execute = [
      'missionId',
      (missionid) => {
        Debug.log("getting edit mission by id: " + missionid.toString());
        return this.context.getCustom("missions/" + Tools.fromShortId(missionid) + "/edit", {})
          .then((result) => result.data);
      }
    ];
  }

  export class GetPublishMissionVersionQuery extends DbQueryBase {
    static $name = 'GetPublishMissionVersion';

    public execute = [
      'missionId', 'versionSlug',
      (missionId, versionSlug) => {
        Debug.log("getting publish mission version by id: " + missionId + ", and versionSlug: " + versionSlug);
        return this.context.getCustom("missions/" + Tools.fromShortId(missionId) + "/versions/" + versionSlug, {})
          .then((result) => result.data);
      }
    ];
  }

  export class NewMissionQuery extends DbQueryBase {
    static $name = 'NewMission';
    static $inject = ['dbContext', 'userInfo'];

    // tODO: more flexible if we don't inject userInfo in the constructor, but from the router??
    constructor(context: W6Context, private userInfo) {
      super(context);
    }

    public execute = [
      () => {
        Debug.log("getting missions by author: " + this.userInfo.slug);
        var query = breeze.EntityQuery.from("Missions")
          .where("author.slug", breeze.FilterQueryOp.Equals, this.userInfo.slug)
          .select(["name", "slug", "id"]);
        return this.context.executeQuery(query)
          .then((data) => data.results);
      }
    ];
  }

  export class UpdateMissionCommand extends DbCommandBase {
    static $name = "UpdateMission";

    public execute = [
      'missionId', 'data', 'files', (missionId, data, files) => {
        var path = "missions/" + missionId;
        return this.context.postCustom(path, data, { requestName: 'editMission' })
          .then((response) => {
            if (files && files.length > 0)
              return this.context.postCustomFormData(path + "/images",
                this.context.getFormDataFromFiles(files));
            else
              return response;
          })
          .then(result => this.respondSuccess("Mission edited"))
          .catch(this.respondError);;
      }
    ];
  }

  export class PublishMissionCommand extends DbCommandBase {
    static $name = "PublishMission";

    public execute = [
      'missionId', 'versionSlug', 'data', (missionId, versionSlug, data) =>
        this.context.postCustom("missions/" + missionId + "/versions/" + versionSlug, data, { requestName: 'publishMission' })
          .then(result => this.respondSuccess("Mission published"))
          .catch(this.respondError)
    ];
  }

  export class UploadNewMissionVersionCommand extends DbCommandBase {
    static $name = "UploadNewMissionVersion";

    public execute = [
      'missionId', 'files', (missionId, files) => this.context.postCustomFormData("missions/" + missionId + "/versions", this.context.getFormDataFromFiles(files), { requestName: 'uploadNewVersion' })
        .then(result => this.respondSuccess("Mission uploaded"))
        .catch(this.respondError)
    ];
  }

  export class UploadNewMissionCommand extends DbCommandBase {
    static $name = "UploadNewMission";

    public execute = [
      'missionName', 'gameSlug', 'files', (missionName, gameSlug, files) => {
        var fd = this.context.getFormDataFromFiles(files);
        fd.append('name', missionName);
        fd.append('type', gameSlug);
        return this.context.postCustomFormData("missions", fd, { requestName: 'uploadNewMission' })
          .then(result => this.respondSuccess("Mission uploaded"))
          .catch(this.respondError);
      }
    ];
  }

  export class GetMissionCommentLikeStateQuery extends DbQueryBase {
    static $name = 'GetMissionCommentLikeState';
    public execute = ['missionId', missionId => this.context.getCustom('comments/missions/' + missionId + "/states")];
  }

  registerCQ(GetMissionCommentLikeStateQuery);

  export class LikeMissionCommentCommand extends DbCommandBase {
    static $name = 'LikeMissionCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/mission/" + id + "/" + "like")];
  }

  registerCQ(LikeMissionCommentCommand);

  export class UnlikeMissionCommentCommand extends DbCommandBase {
    static $name = 'UnlikeMissionCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/mission/" + id + "/" + "unlike")];
  }

  registerCQ(UnlikeMissionCommentCommand);

  export class FollowMissionCommand extends DbCommandBase {
    static $name = 'FollowMissionCommand';
    public execute = [
      'model', (model: IBreezeMission) =>
        this.context.postCustom("missions/" + model.id + "/follow")
    ];
  }

  registerCQ(FollowMissionCommand);

  export class UnfollowMissionCommand extends DbCommandBase {
    static $name = 'UnfollowMissionCommand';
    public execute = [
      'model', (model: IBreezeMission) =>
        this.context.postCustom("missions/" + model.id + "/unfollow")
    ];
  }

  registerCQ(UnfollowMissionCommand);

  registerCQ(GetMissionQuery);
  registerCQ(GetMissionVersionQuery);
  registerCQ(GetMissionCommentsQuery);
  registerCQ(CreateMissionCommentCommand);
  registerCQ(EditMissionQuery);
  registerCQ(UpdateMissionCommand);
  registerCQ(PublishMissionCommand);
  registerCQ(UploadNewMissionVersionCommand);
  registerCQ(UploadNewMissionCommand);
  registerCQ(GetPublishMissionVersionQuery);
  registerCQ(NewMissionQuery);


  export class DeleteMissionCommentCommand extends DbCommandBase {
    static $name = 'DeleteMissionComment';

    public execute = [
      'model', (model: IBreezeMissionComment) => {
        model.archivedAt = new Date(Date.now());
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  registerCQ(DeleteMissionCommentCommand);

  export class SaveMissionCommentCommand extends DbCommandBase {
    static $name = 'SaveMissionComment';

    public execute = [
      'model', (model: IBreezeMissionComment) => {
        //model.entityAspect.setDeleted();
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  registerCQ(SaveMissionCommentCommand);

  export interface IEditMissionScope extends IBaseScope {
    model;
    submit: (form) => void;
    routeParams;
    addFeature: () => void;
    removeFeature: (feature) => void;
    updateFileInfo: (files) => void;
    files;
    addVideo: () => void;
    removeVideo: (video) => void;
    reloadPage: () => any;
  }

  export class EditMissionController extends BaseController {
    static $name = 'EditMissionController';
    static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q', '$routeSegment', 'w6', 'model'];

    constructor(public $scope: IEditMissionScope, public logger, private $timeout, private $routeParams, $q, $routeSegment, w6: W6, model) {
      super($scope, logger, $q);
      $scope.routeParams = $routeParams;
      $scope.submit = this.submit;
      $scope.addFeature = this.addFeature;
      $scope.removeFeature = this.removeFeature;
      $scope.addVideo = this.addVideo;
      $scope.removeVideo = this.removeVideo;
      $scope.updateFileInfo = this.updateFileInfo;
      $scope.reloadPage = () => $routeSegment.chain[$routeSegment.chain.length - 1].reload();

      this.$scope.model = model;
      this.$timeout(() => w6.slider.init());
    }

    public updateFileInfo = (files) => {
      Debug.log("updateFileInfo", files);
      this.$scope.files = files;
    };
    private addFeature = () => {
      this.$scope.model.features.push({ Name: "", Content: "" });
    };
    private addVideo = () => {
      this.$scope.model.videos.push({ Path: "" });
    };
    private removeFeature = (feature) => {
      var array = this.$scope.model.features;
      array.splice(array.indexOf(feature), 1);
    };
    private removeVideo = (video) => {
      var array = this.$scope.model.videos;
      array.splice(array.indexOf(video), 1);
    };
    private submit = () => this.requestAndProcessResponse(UpdateMissionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), data: this.$scope.model, files: this.$scope.files });
  }

  registerController(EditMissionController);

  interface IMissionScope extends IContentScopeT<IBreezeMission>, IHandleCommentsScope<IBreezeMissionComment> {
    download: () => any;
    toggleFollow: () => void;
  }

  class MissionController extends ContentModelController<IBreezeMission> {
    static $name = 'MissionController';
    static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'ForwardService', '$timeout', '$location', 'localStorageService', 'w6', 'model'];

    constructor(public $scope: IMissionScope, logger, $routeParams, $q, $sce, forwardService: Components.ForwardService, private $timeout, $location: ng.ILocationService, localStorageService, w6, model: IBreezeMission) {
      super($scope, logger, $routeParams, $q, $sce, model);

      if (model.latestVersionId != null)
        model.entityAspect.loadNavigationProperty("latestVersion")
          .catch(r => this.breezeQueryFailed(r));

      $scope.download = () => ContentDownloads.downloadInclClientCheck("pws://?game=" + model.game.id.toUpperCase() + "&mission_package=" + model.packageName,
        forwardService, localStorageService, w6);

      $scope.callToAction = () => {
        if ($scope.w6.userInfo.isPremium)
          $scope.download();
        else
          $location.url(this.$scope.header.contentUrl + "/download#download");
      };

      $scope.toggleFollow = () => {
        if (this.$scope.followedMissions[model.id])
          this.unfollow();
        else
          this.follow();
      };
      this.setupComments();

      this.setupTitle("model.name", "{0} - " + model.game.name);

      this.setupEditing();

      if (debug) {
        $(window).data("scope-" + this.$scope.toShortId(model.id), this.$scope);
        $(window).data("scope", this.$scope);
      }
    }


    unfollow() {
      this.requestAndProcessResponse(UnfollowMissionCommand, { model: this.$scope.model })
        .then(r => {
          delete this.$scope.followedMissions[this.$scope.model.id];
          this.$scope.model.followersCount -= 1;
        });
    }

    follow() {
      this.requestAndProcessResponse(FollowMissionCommand, { model: this.$scope.model })
        .then(r => {
          this.$scope.followedMissions[this.$scope.model.id] = true;
          this.$scope.model.followersCount += 1;
        });
    }

    static menuItems: Array<{ header: string; segment: string; isDefault?: boolean }> = [
      { header: "Info", segment: "info", isDefault: true }
    ];

    setupContentHeader(content: IBreezeMission): IContentHeader {
      var contentPath = content.game.slug + "/missions";
      var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
      var fullPath = shortPath + "/" + content.slug;

      var header = <IContentHeader>{
        title: content.name,
        menuItems: this.getMissionMenuItems(content, false),
        contentType: "mission",
        avatar: content.avatar,
        getAvatar: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
        getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
        contentUrl: this.$scope.url.play + "/" + fullPath,
        shortContentUrl: this.$scope.url.play + "/" + shortPath,
        contentRootUrl: this.$scope.url.play + "/" + contentPath,
        contentPath: fullPath,
        tags: content.tags || []
      };

      return header;
    }

    getMissionMenuItems(content: IBreezeMission, editing: boolean): IMenuItem[] {
      var menuItems = angular.copy(MissionController.menuItems);
      //if (content.hasReadme)
      //    menuItems.push({ header: "Readme", segment: "readme" });
      //if (content.hasLicense)
      //    menuItems.push({ header: "License", segment: "license" });
      //if (content.hasLicense)
      //    menuItems.push({ header: "Changelog", segment: "changelog" });
      if (editing)
        menuItems.push({ header: "Settings", segment: "settings" });

      return this.getMenuItems(menuItems, "game.missionsShow");
    }

    private setupComments = () => {
      var $scope = this.$scope;
      this.$scope.addComment = newComment => {
        Debug.log('Add new comment', newComment);
        $scope.request(CreateMissionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: $scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } });
        //WM<ICreateComment<IBreezeMissionComment>>
        newComment.message = "";
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteMissionCommentCommand, { model: comment });
      this.$scope.saveComment = comment => {
        Debug.log("Saving comment", comment);
        this.$scope.request(SaveMissionCommentCommand, { model: comment });
      };
      this.$scope.reportComment = (comment) => { };

      if (this.$scope.environment != Tools.Environment.Production) {
        this.$scope.commentLikeStates = {};
        if (this.$scope.w6.userInfo.id) {
          this.$timeout(() => this.$scope.request(GetMissionCommentLikeStateQuery, { missionId: this.$scope.model.id })
            .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
            .catch(this.breezeQueryFailed));
        }

        this.$scope.likeComment = comment => {
          this.$scope.request(LikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount += 1;
            this.$scope.commentLikeStates[comment.id] = true;
          });
        };
        this.$scope.unlikeComment = comment => {
          this.$scope.request(UnlikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount -= 1;
            this.$scope.commentLikeStates[comment.id] = false;
          });
        };
      }

      this.$timeout(() => this.$scope.request(GetMissionCommentsQuery, { missionId: this.$scope.model.id }));
    };
    private setupEditing = () => {
      this.setupEditConfig({
        canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id,
        discardChanges: () => {
          this.$scope.model.entityAspect.entityManager.getChanges().filter((x, i, arr) => {
            return (x.entityType.shortName == "Mission") ? ((<IBreezeMission>x).id == this.$scope.model.id) : ((<any>x).missionId && (<any>x).missionId == this.$scope.model.id);
          }).forEach(x => x.entityAspect.rejectChanges());
        }
      }, null,
        [
          BreezeEntityGraph.Mission.features().$name, BreezeEntityGraph.Mission.latestVersion().$name,
          BreezeEntityGraph.Mission.mediaItems().$name, BreezeEntityGraph.Mission.versions().$name
        ]);
    };
  }

  registerController(MissionController);


  interface IMissionInfoScope extends IMissionScope {
  }

  class MissionInfoController extends ContentController {
    static $name = 'MissionInfoController';

    constructor(public $scope: IMissionScope, logger, $routeParams, $q) {
      super($scope, logger, $routeParams, $q);

      this.setupTitle("model.name", "Info - {0} - " + $scope.model.game.name);
    }
  }

  registerController(MissionInfoController);

  // DEPRECATED: Convert to Queries/Commands
  export class MissionDataService extends W6ContextWrapper {
    static $name = 'missionDataService';

    public queryText(query, filterText, inclAuthor) {
      if (filterText == "")
        return query;

      var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

      var pred = this.context.getNameQuery(info.name);
      var pred2 = this.context.getTagsQuery(info.tag);
      var pred3 = this.context.getAuthorQuery(info.user);

      return this.context.buildPreds(query, [pred, pred2, pred3]);
    }

    public getMissionsByGame(gameSlug, name) {
      Debug.log("getting missions by game: " + gameSlug + ", " + name);
      var query = breeze.EntityQuery.from("Missions")
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", breeze.FilterQueryOp.Contains, name.toLowerCase())))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getMissionTagsByGame(gameSlug, name) {
      Debug.log("getting mission names: " + gameSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("Missions")
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getMissionTagsByAuthor(authorSlug, name) {
      Debug.log("getting mission names: " + authorSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("MissionsByAuthor")
        .withParameters({ authorSlug: authorSlug })
        .where(new breeze.Predicate("toLower(name)", op, key))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getAllMissionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeMission>> {
      Debug.log("getting missions by game: " + gameSlug, options);
      var query = breeze.EntityQuery.from("Missions")
        .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

      query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any>this.$q.reject("invalid query");

      query = query.orderBy(this.context.generateOrderable(options.sort));

      query = this.context.applyPaging(query, options.pagination);

      //query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMission>(query);
    }

    public getAllMissionsByAuthor(authorSlug, options): Promise<IQueryResult<IBreezeMission>> {
      Debug.log("getting missions by author: " + authorSlug);
      var query = breeze.EntityQuery.from("Missions")
        .where("author.slug", breeze.FilterQueryOp.Equals, authorSlug);

      query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any>this.$q.reject("invalid query");

      query = query.orderBy(this.context.generateOrderable(options.sort));

      query = this.context.applyPaging(query, options.pagination);
      //query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMission>(query);
    }

    // can't be used due to virtual properties
    private getDesiredFields(query) {
      return query.select(["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "authorId", "author", "gameId", "game", "size", "sizePacked", "followersCount", "modsCount"]);
    }

    public getFollowedMissionIds(gameSlug: string) {
      Debug.log("getting followed mission ids");
      return this.context.get('FollowedMissions', { gameSlug: gameSlug });
    }
  }

  registerService(MissionDataService);

  export interface IPublishVersionScope extends IBaseScope {
    mission;
    submit: (form) => void;
    routeParams;
  }

  export class PublishVersionController extends BaseController {
    static $name = 'PublishVersionController';
    static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q', 'model'];

    constructor(public $scope: IPublishVersionScope, public logger, private $timeout, private $routeParams, $q, model) {
      super($scope, logger, $q);
      $scope.routeParams = $routeParams;
      $scope.mission = model;
      $scope.submit = this.submit;
    }

    private submit = () => this.requestAndProcessResponse(PublishMissionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), versionSlug: this.$routeParams.versionSlug, data: this.$scope.mission });
  }

  registerController(PublishVersionController);

  export interface IUploadNewmissionScope extends IBaseScope {
    existingMissions: Object[];
    routeParams;
    submit: (form) => void;
    mission: { files?; name?};
    updateFileInfo: (files) => void;
  }

  export class UploadNewmissionController extends BaseController {
    static $name = 'UploadNewmissionController';
    static $inject = ['$scope', 'logger', '$routeParams', '$timeout', 'userInfo', '$q', 'model'];

    constructor(public $scope: IUploadNewmissionScope, public logger, private $routeParams, private $timeout, userInfo, $q, model) {
      super($scope, logger, $q);

      $scope.routeParams = $routeParams;
      $scope.existingMissions = [];
      $scope.submit = this.submit;
      $scope.mission = {};
      $scope.updateFileInfo = this.updateFileInfo;

      $scope.existingMissions = model;

      // TODO: Fully convert to angular...
      $timeout(() => {
        if (model.length == 0)
          $('#w6-mission-upload-new').show().removeClass('hidden');

        $(document).on('change', 'select#missionSelect', function() {
          switch ($(this).val()) {
            case '---':
              break;
            default:
              window.location = $(this).val();
          }
        });

        $('#w6-mission-upload-choice').find('input:radio').on('change', function(e) {
          if ($(this).is(":checked")) {
            if ($(this).val() == 'new') {
              $('#w6-mission-upload-update').hide().removeClass('hidden');
              $('#w6-mission-upload-new').show().removeClass('hidden');
            } else {
              $('#w6-mission-upload-new').hide().removeClass('hidden');
              $('#w6-mission-upload-update').show().removeClass('hidden');
            }
          }
        });
      }, 0);
    }

    public updateFileInfo = (files) => {
      Debug.log("updateFileInfo", files);
      this.$scope.mission.files = files;
    };
    public submit = () => this.requestAndProcessResponse(UploadNewMissionCommand, { missionName: this.$scope.mission.name, gameSlug: this.$routeParams.gameSlug, files: this.$scope.mission.files });
  }

  registerController(UploadNewmissionController);

  export interface IUploadNewversionScope extends IBaseScope {
    routeParams;
    submit: (form) => void;
    mission: { files?; };
    updateFileInfo: (files) => void;
  }

  export class UploadNewversionController extends BaseController {
    static $name = 'UploadNewversionController';
    static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q'];

    constructor(public $scope: IUploadNewversionScope, public logger, $timeout, private $routeParams, $q) {
      super($scope, logger, $q);

      $scope.routeParams = $routeParams;
      $scope.submit = this.submit;
      $scope.mission = {};
      $scope.updateFileInfo = this.updateFileInfo;
    }

    public updateFileInfo = (files) => {
      Debug.log("updateFileInfo", files);
      this.$scope.mission.files = files;
    };
    public submit = () => {
      this.requestAndProcessResponse(UploadNewMissionVersionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), files: this.$scope.mission.files });
    };
  }

  registerController(UploadNewversionController);
}
export module MyApp.Play.Mods {
  export interface IClaimDialogScope extends IBaseScope {
    model;
    page: string;
    claimToken: string;
    cancel: Function;
    ok: Function;
    verifyToken: Function;
    verificationFailed: Boolean;
    formatProvider: string;
    ctModel;
    error: string;
    hasHomepageUrl: boolean;
    copy: () => void;
    reload: () => void;
    stepOneInfo: boolean;
    stepOneShowInfo: () => void;
  }

  export class ClaimDialogController extends DialogControllerBase {
    static $name = 'ClaimDialogController';
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'mod', 'supportsClaiming'];
    static $view = '/src_legacy/app/play/mods/dialogs/claim-dialog.html';

    constructor(public $scope: IClaimDialogScope, logger, $modalInstance, $q, private model, supportsClaiming: boolean) {
      super($scope, logger, $modalInstance, $q);

      $scope.cancel = this.cancel;
      $scope.ok = this.ok;
      $scope.verifyToken = this.verifyToken;
      $scope.reload = this.reload;
      $scope.model = model;
      $scope.ctModel = {};
      $scope.stepOneInfo = false;
      $scope.stepOneShowInfo = this.showInformation;
      if (supportsClaiming) {
        $scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page1.html';
      } else {
        $scope.hasHomepageUrl = !(model.homepageUrl == null || model.homepageUrl == '');
        $scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page-not-supported.html';
      }
    }

    private cancel = () => { this.$modalInstance.close(); };
    private reload = () => { window.location.reload(); };
    private showInformation = () => { this.$scope.stepOneInfo = true; };

    private ok = () => {
      this.$scope.request(GetClaimQuery, { modId: this.$scope.model.id })
        .then((result) => {
          this.$scope.claimToken = result.lastResult.data.token;
          this.$scope.formatProvider = result.lastResult.data.formatProvider;
          this.$scope.ctModel = result.lastResult.data;
          this.$scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page2.html';
        })
        .catch(this.httpFailed);
    };

    private verifyToken = () => {
      this.$scope.verificationFailed = false;
      this.$scope.request(VerifyClaimCommand, { modId: this.$scope.model.id })
        .then((result) => {
          this.$scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page3.html';
          this.$scope.error = undefined;
        })
        .catch((reason) => {
          this.httpFailed(reason);
          this.$scope.error = reason.data.message;
        });
    };
  }

  registerController(ClaimDialogController);

  export class OpenClaimDialogQuery extends DbQueryBase {
    static $inject = ['dbContext', '$modal', 'logger'];
    static $name = 'OpenClaimDialog';

    constructor(context: W6Context, private $modal, private logger) { super(context); }

    public execute = [
      'gameSlug', 'modId',
      (gameSlug, modId) => {
        Debug.log("getting mod by id: " + modId);
        var id = Tools.fromShortId(modId).toString();
        // TODO: Convert to entityKeyQuery
        var query = breeze.EntityQuery.from("Mods")
          .where("id", breeze.FilterQueryOp.Equals, id)
          .top(1);

        return DialogQueryBase.openDialog(this.$modal, ClaimDialogController, {
          resolve: {
            mod: () => this.context.executeQuery(query, "loadClaimDialog").then(result => result.results[0]),
            supportsClaiming: () => this.context.getCustom<BooleanResult>("mods/" + id + "/supportsClaiming", { requestName: 'loadClaimDialog' })
              .then(result => result.data.result)
          }
        });
      }
    ];
  }

  export class GetForumPostQuery extends DbQueryBase {
    static $name = 'GetForumPost';
    public execute = ['forumUrl', forumUrl => this.context.getCustom('cool/forumPost', { params: { forumUrl: forumUrl }, requestName: 'getForumPost' }).then(r => r.data)];
  }

  registerCQ(GetForumPostQuery);

  export class GetModQuery extends DbQueryBase {
    static $name = 'GetMod';
    //this.$q.reject(rejection)
    public execute = [
      'modId', modId => this.executeKeyQuery<IBreezeMod>(
        () => this.getEntityQueryFromShortId("Mod", modId)
          .withParameters({ id: Tools.fromShortId(modId) })
          .expand(["dependencies", "mediaItems"])) //.then((result) => {
      //    debugger;
      //    return result;
      //}, (result) => {
      //    debugger;
      //}, (result) => {
      //            debugger;
      //})
    ];
  }

  export class GetModRelatedQuery extends DbQueryBase {
    static $name = 'GetModRelated';

    // CollectionInMod and DependentMod have no actual endpoints
    // CollectionInMod is also harder to query from the other direction
    // So we use a workaround - we actually re-get the mod but this time with collections+dependents, breeze will take care of merging with the existing object
    // and we only have slight overhead of grabbing the basic mod info again..
    public execute = [
      'modId', modId => this.executeKeyQuery<IBreezeMod>(
        () => this.getEntityQueryFromShortId("Mod", modId)
          .withParameters({ id: Tools.fromShortId(modId) })
          .expand(["collections", "dependents"]))
    ];
  }

  registerCQ(GetModRelatedQuery);

  export class GetModCreditsQuery extends DbQueryBase {
    static $name = 'GetModCredits';

    public execute = [
      'modId', modId => {
        var query = breeze.EntityQuery.from(BreezeEntityGraph.ModUserGroup.$name + "s")
          .where("modId", breeze.FilterQueryOp.Equals, Tools.fromShortId(modId));
        return this.context.executeQuery(query);
      }
    ];
  }

  registerCQ(GetModCreditsQuery);

  export class GetEditModQuery extends DbQueryBase {
    static $name = 'GetEditMod';

    public execute = [
      'modId', modId => this.executeKeyQuery<IBreezeMod>(
        () => this.getEntityQueryFromShortId("Mod", modId)
          .withParameters({ id: Tools.fromShortId(modId) })
          .expand(["collections", "dependencies", "dependents", "info"]))
        .then(m => {
          if (!m.info) m.info = <IBreezeModInfo>this.context.createEntity("ModInfo", { modId: m.id });
          return m;
        })
    ];
  }

  registerCQ(GetEditModQuery);

  export class GetModCommentsQuery extends DbQueryBase {
    static $name = 'GetModComments';

    public execute = [
      'modId',
      (modId) => {
        Debug.log("getting modcomments by id: " + modId.toString());
        var query = breeze.EntityQuery.from("ModComments")
          .where("modId", breeze.FilterQueryOp.Equals, modId)
          .orderByDesc("created");
        return this.context.executeQuery(query)
          .then((result) => result);
      }
    ];
  }

  export class GetModFileQuery extends DbQueryBase {
    static $name = 'GetModFile';
    public execute = [
      'gameSlug', 'modId', 'fileType', (gameSlug, modId, fileType) => this.executeKeyQuery<IBreezeMod>(
        () => this.getEntityQueryFromShortId("ModInfo", modId)
          .withParameters({ modId: Tools.fromShortId(modId) })
          .select(fileType))
        .then(info => {
          Debug.log("info", info);
          return {
            fileTitle: fileType,
            fileContent: info[fileType]
          };
        })
    ];
  }

  export class GetModUpdatesQuery extends DbQueryBase {
    static $name = 'GetModUpdates';

    public execute = [
      'modId',
      (modId) => {
        Debug.log("getting modupdates by id: " + modId.toString());
        var query = breeze.EntityQuery.from("ModUpdates")
          .where("modId", breeze.FilterQueryOp.Equals, modId)
          .orderByDesc("created");
        return this.context.executeQuery(query)
          .then((result) => result);
      }
    ];
  }


  export class GetClaimQuery extends DbQueryBase {
    static $name = 'GetClaim';
    public execute = ['modId', (modId) => { return this.context.getCustom("mods/" + modId + "/claim", { requestName: 'getClaim' }); }];
  }

  export class VerifyClaimCommand extends DbCommandBase {
    static $name = 'VerifyClaim';
    public execute = ['modId', (modId) => { return this.context.postCustom("mods/" + modId + "/claim", undefined, { requestName: 'verifyToken' }); }];
  }

  export class SaveModCommand extends DbCommandBase {
    static $name = 'SaveMod';
    static $inject = ['dbContext', '$q', 'UploadService'];

    constructor(context: W6Context, $q, private uploadService: Components.Upload.UploadService) {
      super(context);
    }

    public execute = [
      'modId', 'data', 'editData', (modId, data, editData) => {
        if (debug) Debug.log(data, editData);
        data.dependencies.forEach(x => {
          var found = false;
          for (var i in editData.editDependencies) {
            var d = editData.editDependencies[i];
            if (d.key == x.name) {
              found = true;
              break;
            }
          }
          if (!found)
            x.entityAspect.setDeleted();
        });

        editData.editDependencies.forEach(x => {
          var found = false;
          for (var i in data.dependencies) {
            var d = data.dependencies[i];
            if (d.name == x.key) {
              found = true;
              break;
            }
          }
          if (!found) // data.dependencies.add(
            this.context.createEntity("ModDependency", { id: x.id, modId: data.id, mod: data, name: x.key });
        });

        var tags = [];
        for (var i in editData.editCategories) {
          var t = editData.editCategories[i];
          tags.push(t.key);
        }

        data.tags = tags;

        var aliases = [];
        for (var i in editData.editAliases) {
          var a = editData.editAliases[i];
          aliases.push(a.key);
        }
        data.aliases = aliases.length == 0 ? null : aliases.join(";");

        // todo: Progresses for logo and gallery

        var promises = [];
        if (editData.logoToUpload)
          promises.push(this.uploadLogo(modId, editData.logoToUpload));

        if (editData.galleryToUpload)
          promises.push(this.uploadGallery(modId, editData.galleryToUpload));

        return this.context.$q.all(promises)
          .then((result) => this.context.saveChanges('saveMod'));
      }
    ];

    private uploadLogo(modId, logo) {
      return this.uploadService.uploadToAmazon(logo, "mods/" + modId + "/logoupload", "ModLogo");
    }

    private uploadGallery(modId, gallery) {
      //this.$scope.upload = [];
      var promises = [];
      for (var i in gallery) {
        var file = gallery[i];
        promises.push(this.uploadService.uploadToAmazon(file, "mods/" + modId + "/galleryupload", "ModMediaItem"));
      }

      return this.context.$q.all(promises);
    }
  }

  //export class OpenDependenciesDialogQuery extends DialogQueryBase {
  //    static $name = 'OpenDependenciesDialog';
  //    public execute = ['mod', mod => this.openDialog(DependenciesDialogController, { size: "md", windowTemplateUrl: "app/components/dialogs/window-center-template.html", resolve: { model: () => mod } })]
  //}

  //export class OpenSetAuthorDialogQuery extends DialogQueryBase {
  //    static $name = 'OpenSetAuthorDialog';
  //    public execute = ['mod', mod => this.createDialog(SetAuthorDialogController, mod, { size: "" })]
  //}

  export class CreateModCommentCommand extends DbCommandBase implements ICQWM<ICreateComment<IBreezeModComment>> {
    static $name = 'CreateModComment';

    static $ModelType = null;
    public $ModelType: ICreateComment<IBreezeModComment> = null;

    public execute = [
      'model', (model: ICreateComment<IBreezeModComment>) => {
        var entity = <IBreezeModComment>this.context.createEntity("ModComment", { modId: model.contentId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
        if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
        return this.context.saveChanges(undefined, [entity]);
      }
    ];
  }

  export class DeleteModCommentCommand extends DbCommandBase {
    static $name = 'DeleteModComment';

    public execute = [
      'model', (model: IBreezeModComment) => {
        Debug.log('Delete comment', model);
        model.archivedAt = new Date(Date.now());
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  export class SaveModCommentCommand extends DbCommandBase {
    static $name = 'SaveModComment';

    public execute = [
      'model', (model: IBreezeModComment) => {
        //model.entityAspect.setDeleted();
        return this.context.saveChanges(undefined, [model]);
      }
    ];
  }

  export class GetModCommentLikeStateQuery extends DbQueryBase {
    static $name = 'GetModCommentLikeState';
    public execute = ['modId', modId => this.context.getCustom('comments/mods/' + modId + "/states")];
  }

  registerCQ(GetModCommentLikeStateQuery);

  export class LikeModCommentCommand extends DbCommandBase {
    static $name = 'LikeModCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/mod/" + id + "/" + "like")];
  }

  registerCQ(LikeModCommentCommand);

  export class UnlikeModCommentCommand extends DbCommandBase {
    static $name = 'UnlikeModCommentCommand';
    public execute = ['id', id => this.context.postCustom("comments/mod/" + id + "/" + "unlike")];
  }

  registerCQ(UnlikeModCommentCommand);

  export class FollowModCommand extends DbCommandBase {
    static $name = 'FollowModCommand';
    public execute = [
      'model', (model: IBreezeMod) =>
        this.context.postCustom("mods/" + model.id + "/follow")
    ];
  }

  registerCQ(FollowModCommand);

  export class UnfollowModCommand extends DbCommandBase {
    static $name = 'UnfollowModCommand';
    public execute = [
      'model', (model: IBreezeMod) =>
        this.context.postCustom("mods/" + model.id + "/unfollow")
    ];
  }

  export class CancelUploadRequestQuery extends DbCommandBase {
    static $name = 'CancelUploadRequest';
    public execute = ['requestId', 'force', (requestId, force) => this.context.getCustom<BooleanResult>("cool/cancelUploadRequest", { requestName: 'cancelUploadRequest', params: { requestId: requestId, force: force } }).then(result => result.data.result)];
  }

  registerCQ(CancelUploadRequestQuery);

  export class ApproveUploadRequestQuery extends DbCommandBase {
    static $name = 'ApproveUploadRequest';
    public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/approveUpload", { requestName: 'approveUpload', params: { requestId: requestId } }).then(result => result.data.result)];
  }

  registerCQ(ApproveUploadRequestQuery);

  export class DenyUploadRequestQuery extends DbCommandBase {
    static $name = 'DenyUploadRequest';
    public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/denyUpload", { requestName: 'denyUpload', params: { requestId: requestId } }).then(result => result.data.result)];
  }

  registerCQ(DenyUploadRequestQuery);

  registerCQ(UnfollowModCommand);

  registerCQ(GetModQuery);
  registerCQ(GetModCommentsQuery);
  registerCQ(GetModUpdatesQuery);
  registerCQ(GetModFileQuery);
  registerCQ(CreateModCommentCommand);
  registerCQ(DeleteModCommentCommand);
  registerCQ(SaveModCommentCommand);
  registerCQ(GetClaimQuery);
  registerCQ(OpenClaimDialogQuery);
  registerCQ(VerifyClaimCommand);
  registerCQ(SaveModCommand);

  //registerCQ(OpenDependenciesDialogQuery);
  //registerCQ(OpenSetAuthorDialogQuery);


  export class OpenModDeleteRequestDialogQuery extends DialogQueryBase {
    static $name = 'OpenModDeleteRequestDialog';

    public execute = ['model', (model) => this.openDialog(ModDeleteRequestDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })];
  }

  registerCQ(OpenModDeleteRequestDialogQuery);

  export class OpenModUploadDialogQuery extends DialogQueryBase {
    static $name = 'ModUploadDialog';

    public execute = ['model', 'info', (model, info) => this.openDialog(UploadVersionDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, info: () => info } })];
  }

  registerCQ(OpenModUploadDialogQuery);

  export class ModVersionHistoryDialogQuery extends DialogQueryBase {
    static $name = 'ModVersionHistoryDialog';

    public execute = ['model', (model) => this.openDialog(ModVersionHistoryDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })];
  }

  registerCQ(ModVersionHistoryDialogQuery);

  export class NewModVersionCommand extends DbCommandBase {
    static $name = 'NewModVersion';
    public execute = ['data', data => this.context.postCustom("mods/" + data.modId + "/versions", data, { requestName: 'postNewModUpload' })];
  }

  registerCQ(NewModVersionCommand);

  export class GetLatestInfo extends DbQueryBase {
    static $name = 'GetLatestInfo';
    public execute = ['data', data => this.context.getCustom<{}>("mods/get-mod-info?downloadUri=" + data.downloadUri).then(x => x.data)]
  }

  registerCQ(GetLatestInfo);

  export class OpenNewModWelcomeDialogQuery extends DialogQueryBase {
    static $name = 'OpenNewModWelcomeDialog';

    public execute = ['model', 'editConfig', (model, editConfig) => this.openDialog(ModNewModWelcomeDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, editConfig: () => editConfig } })];
  }

  registerCQ(OpenNewModWelcomeDialogQuery);

  export class OpenArchiveModDialogQuery extends DialogQueryBase {
    static $name = 'ArchiveModDialog';

    public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
    //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
    //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
  }

  registerCQ(OpenArchiveModDialogQuery);


  export class ModExistsQuery extends DbQueryBase {
    static $name = "ModExists";
    public execute = [
      'packageName', packageName => {
        if (!packageName || packageName.length == 0) return false;
        //var cache = this.context.getModExistsCache(mod);
        //if (cache === false || cache === true) return cache;

        return <any>this.context.getCustom("mods/package-name-exists", { params: { packageName: packageName } })
          .then(result => (<any>result.data).result);
      }
    ];
  }

  registerCQ(ModExistsQuery);

  export class GetModTagsQuery extends DbQueryBase {
    static $name = "GetModTags";

    public execute = [
      'gameId', 'query', (gameId, name) => {
        Debug.log("getting mods by game: " + gameId + ", " + name);

        var gameIds = ModsHelper.getGameIds(gameId);

        var op = this.context.getOpByKeyLength(name);
        var key = name.toLowerCase();

        var jsonQuery = {
          from: 'Mods',
          where: {
            'gameId': { in: gameIds }
          }
        }
        var query = new breeze.EntityQuery(jsonQuery)
        var query = query.where(new breeze.Predicate("toLower(packageName)", op, key)
          .or(new breeze.Predicate("toLower(name)", op, key)))
          .orderBy("packageName")
          .select(["packageName", "name", "id"])
          .take(this.context.defaultTakeTag);

        return this.context.executeQuery(query)
          .then((data) => data.results);
      }
    ];
  }

  registerCQ(GetModTagsQuery);

  export class GetModTagsQueryByUser extends DbQueryBase {
    static $name = "GetModTagsByUser";

    public execute = [
      'userSlug', 'query', (userSlug, name) => {
        Debug.log("getting mods by user: " + userSlug + ", " + name);

        var op = this.context.getOpByKeyLength(name);
        var key = name.toLowerCase();

        var query = breeze.EntityQuery.from("Mods")
          .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(
            new breeze.Predicate("toLower(packageName)", op, key)
              .or(new breeze.Predicate("toLower(name)", op, key))))
          .orderBy("packageName")
          .select(["packageName", "name", "id"])
          .take(this.context.defaultTakeTag);

        return this.context.executeQuery(query)
          .then((data) => data.results);
      }
    ];
  }

  registerCQ(GetModTagsQueryByUser);

  export class GetCategoriesQuery extends DbQueryBase {
    static $name = "GetCategories";

    public execute = [
      'query', (name) => {
        Debug.log("getting mod tags, " + name);
        var query = breeze.EntityQuery.from("ModTags")
          .where(new breeze.Predicate("toLower(name)", breeze.FilterQueryOp.Contains, name.toLowerCase()))
          .orderBy("name")
          .select(["name"])
          .take(24);
        return this.context.executeQuery(query)
          .then((data) => data.results);
      }
    ];
  }

  registerCQ(GetCategoriesQuery);

  export class GetModUserTagsQuery extends DbQueryBase {
    static $name = "GetModUserTags";
    static $inject = ['dbContext', '$commangular'];

    constructor(context: W6Context, private $commangular) {
      super(context);
    }

    public escapeIfNeeded(str) {
      return str.indexOf(" ") != -1 ? "\"" + str + "\"" : str;
    }

    public execute = [
      'query', 'gameSlug', (name: string, gameSlug: string) => {
        if (gameSlug == null) return this.$commangular.dispatch(GetUserTagsQuery.$name, { query: name }).then(r => r.lastResult);

        return this.context.$q.all([
          this.$commangular.dispatch(GetUsersQuery.$name, { query: name }).then(r => r.lastResult), this.context.executeQuery(breeze.EntityQuery.from("ModsByGame")
            .withParameters({ gameSlug: gameSlug })
            .where(new breeze.Predicate("toLower(authorText)", this.context.getOpByKeyLength(name), name.toLowerCase()))
            .orderBy("authorText")
            .select("authorText")
            // TODO: Distinct
            .take(this.context.defaultTakeTag))
            .then((data) => data.results)
        ])
          .then(results => {
            var obj = [];
            var values = [];
            angular.forEach(results[0], (user: any) => {
              var val = this.escapeIfNeeded(user.displayName);
              values.push(val);
              obj.push({ text: "user:" + val, key: "user:" + val });
            });
            angular.forEach(results[1], (mod: IBreezeMod) => {
              var val = this.escapeIfNeeded(mod.authorText);
              if (values.indexOf(val) > -1) return;
              values.push(val);
              obj.push({ text: "user:" + val, key: "user:" + val });
            });
            return obj;
          });
      }
    ];
  }

  registerCQ(GetModUserTagsQuery);

  export interface IModScope extends IContentScopeT<IBreezeMod> {
    addTag: (data) => boolean;
    removeTag: (data) => void;
    getCategories: (query) => any;
    types;
    getCurrentTags: () => Array<ITagKey>;
    openDependenciesDialog: () => void;
    openSetAuthorDialog: () => void;
    openLoginDialog: () => any;
    onFileSelectGallery: (files, $event) => void;
    onFileSelectLogo: (files, $event) => void;
    getPendingLinkDeletions: () => IBreezeModMediaItem[];
    uploadingModImage: boolean;
    openRequestModDeletion: () => void;
    openModUploadDialog: (type?: string) => void;
    openArchivalStatusDialog: () => any;

    getAuthor: (query) => any;
    setAuthor: (newAuthor: IBreezeUser) => void;
    changeAuthorCheck: (scope) => boolean;
    download: () => void;
    toggleFollow: () => void;
    getForumPost: (descriptionEditor) => void;
    formatVersion: () => string;
    openAddModDialog: () => any;

    openHelpFlow: (item: number) => void;
    nextHelpFlow: (item: number) => void;
    closeHelpFlow: () => void;
    showHelp: () => void;
    helpPopover: any;

    isUploading: () => boolean;
    getCurrentChange: () => IBreezeModUpdate;
    canCancel: (update: IBreezeModUpdate) => boolean;
    openUploadVersionDialog: () => any;
    cancelUpload: (force: boolean) => void;
    confirmCancel: boolean;
    getUploadText: () => string;
    cancelling: boolean;
    openVersionHistoryDialog: () => void;
    requiresApproval: (update: IBreezeModUpdate) => boolean;
    approving: boolean;
    approveUpload: (update: IBreezeModUpdate) => void;
    abandoning: boolean;
    confirmAbandon: boolean;
    denyUpload: (update: IBreezeModUpdate) => void;
    addToBasket: (mod: any) => void;
    mini: { downloading: boolean; downloadPercentage: number; clientDetected: boolean };
    fileDropped: ($files: any, $event: any, $rejectedFiles: any) => void;
    newRemoteLogoUploadRequest: (url: any) => void;
    showUploadBanner: () => void;
    isInBasket: () => boolean;
  }

  enum ProcessingState {
    //General,
    RequiresApprovalUploadFinished = -5,
    ManagerAbandoned = -4,
    RequiresApproval = -3,
    UserCancelled = -2,
    UnknownFailure = -1,
    Uninitialized = 0,
    Initializing = 1,
    Finished = 2,
    Yanked = 3,

    //ProcessingQueue
    QueuedForProcessing = 50,

    //Downloading
    AddingToDownloadService = 100,
    DownloadServiceUnavailible = 101,
    LinkUnavailible = 102,
    WaitingForDownloadStart = 110,
    Downloading = 120,
    DownloadingFailed = 121,
    Downloaded = 199,

    //Extraction
    Extracting = 200,
    ExtractFailed = 201,
    Extracted = 299,

    //RestructureTool
    Restructuring = 300,
    RestructureFailed = 301,
    RestructureWaitingOnAdmin = 310,

    //Network
    PreparingNetwork = 400,
    PreparingNetworkFailed = 401,
    Syncing = 410,
    SyncFailed = 411,
    SignalFailed = 420
  }

  export function getEnum<TEnum>(enu: TEnum, name: string): number {
    return enu[name];
  }

  export function getState(name: string): number {
    return getEnum<ProcessingState>(<any>ProcessingState, name);
  }

  export class ModController extends ContentModelController<IBreezeMod> {
    isForActiveGame: boolean;
    static $name = 'ModController';
    static $inject = ['$scope', 'logger', '$routeParams', '$q', '$parse', 'ForwardService', '$sce', '$timeout',
      'UploadService', '$location', 'localStorageService', 'w6', '$popover', '$rootScope', 'basketService', 'model', 'aur.eventBus'];

    constructor(public $scope: IModScope, logger, $routeParams, $q, private $parse: ng.IParseService, forwardService: Components.ForwardService,
      private $sce: ng.ISCEService, private $timeout: ng.ITimeoutService,
      private uploadService: Components.Upload.UploadService, $location: ng.ILocationService,
      localStorageService, w6, private $popover, $rootScope,
      basketService: Components.Basket.BasketService, model: IBreezeMod, private eventBus: EventAggregator) {
      super($scope, logger, $routeParams, $q, $sce, model);
      let routeGameSlug = $routeParams.gameSlug.toLowerCase();
      let modGameSlug = model.game.slug.toLowerCase();
      if (routeGameSlug != modGameSlug && !(routeGameSlug == 'arma-3' && modGameSlug == 'arma-2')) {
        forwardService.forward(Tools.joinUri([$scope.url.play, model.game.slug, "mods", Tools.toShortId(model.id), model.slug]));
        return;
      }

      this.isForActiveGame = $scope.model.gameId == $scope.game.id;

      var basket = basketService.getGameBaskets($scope.game.id);
      $scope.formatVersion = () => {
        var version = model.latestStableVersion || model.modVersion;
        return !version || version.startsWith('v') ? version : 'v' + version;
      }
      $scope.isInBasket = () => basket.active.content.has(model.id);
      $scope.addToBasket = () => basketService.addToBasket($scope.game.id, Helper.modToBasket($scope.model));
      $scope.mini = { downloading: false, downloadPercentage: 55, clientDetected: true }; // TODO: Get this info from the signalRService etc

      //$scope.openLoginDialog = () => $scope.request(MyApp.Components.Dialogs.OpenLoginDialogQuery);
      $scope.toggleFollow = () => {
        if ($scope.followedMods[model.id])
          this.unfollow();
        else
          this.follow();
      };
      $scope.types = [];
      this.setupEditing();
      this.setupCategoriesAutoComplete();
      this.setupHelp();
      this.showUploadBanner();
      $scope.getForumPost = (descriptionEditor) => this.requestAndProcessCommand(GetForumPostQuery, { forumUrl: model.homepageUrl }, "fetch first post") // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
        .then(r => {
          // grr jquery in controller
          descriptionEditor.$show();
          $timeout(() => {
            var redactor = $("textarea[redactor]").first().redactor("core.getObject");
            // import in editor:
            redactor.selection.selectAll();
            redactor.insert.html(r.lastResult.body, false);
            //model.descriptionFull = r.lastResult.body;
          }, 1000);
        });

      $scope.download = () => ContentDownloads.downloadInclClientCheck("pws://?game=" + model.game.id.toUpperCase() + "&mod=" + model.id,
        forwardService, localStorageService, w6);
      $scope.callToAction = () => {
        if ($scope.w6.userInfo.isPremium)
          $scope.download();
        else
          $location.url($scope.header.contentUrl + "/download#download");
      };

      //$scope.onFileSelectGallery = (files) => $scope.onFileSelectLogo(files);
      //$scope.onFileSelectLogo = (files) => this.newLogoUploadRequest(files[0]);

      $scope.onFileSelectGallery = (files, $event) => $scope.onFileSelectLogo(files, $event);
      $scope.onFileSelectLogo = (files, $event) => {
        this.newLogoUploadRequest(files[0], $event);
      };
      $scope.fileDropped = ($files, $event, $rejectedFiles) => {
        if (typeof $files[0] === "string") {
          this.newRemoteLogoUploadRequest($files[0], $event);
        } else {
          this.newLogoUploadRequest($files[0], $event);
        }
      };
      $scope.newRemoteLogoUploadRequest = (url) => this.newRemoteLogoUploadRequest(url, null);

      this.setupTitle("model.name", "{0} (" + model.packageName + ") - " + model.game.name);

      if ($routeParams.hasOwnProperty("landing") && (this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
        this.$scope.request(OpenNewModWelcomeDialogQuery, { model: this.$scope.model, editConfig: this.$scope.editConfig });

      if ($routeParams.hasOwnProperty("upload")) {
        this.$scope.openModUploadDialog("upload");
      }
    }

    private modImageFile: File;
    private tempModImagePath: string;

    private setupEditing() {
      var currentQuery = null;
      var $scope = this.$scope;
      var authors = [];
      this.$scope.getAuthor = (query) => {
        if (!query || query == "") {
          return [];
        }

        var newQuery = this.$scope.request(GetUsersQuery, { query: (typeof query == 'string' || <any>query instanceof String) ? query : query.displayName })
          .catch(this.breezeQueryFailed).then(r => {
            // breeze objects cause deep reference stackoverflow because of circular references, so we shape the objects
            // into just the vm properties we need fr the view. Which is a good practice in general..
            // UPDATE: Even shaped objects have problems when they are extended off EntityExtends.User... So now just building the objectg manually ;S
            authors = r.lastResult;
            var authorVms = [];
            authors.forEach(x => {
              let user = { displayName: x.displayName, id: x.id, avatarURL: x.avatarURL, hasAvatar: x.hasAvatar, avatarUpdatedAt: x.avatarUpdatedAt, getAvatarUrl: null, _avatars: [] };
              user.
                getAvatarUrl = (size) => user._avatars[size] || (user._avatars[size] = window.w6Cheat.w6.url.calculateAvatarUrl(<any>this, size));
              authorVms.push(user);
            });
            return authorVms;
          });

        currentQuery = newQuery;

        return currentQuery;
      };

      this.$scope.setAuthor = (newAuthor: IBreezeUser) => {
        var author = authors.find(x => x.id === newAuthor.id);
        this.$scope.model.author = author;
        if (!this.$scope.editConfig.isEditing && !this.$scope.editConfig.isManaging)
          this.$scope.editConfig.saveChanges();
      };

      this.$scope.changeAuthorCheck = (scope: any): boolean => {
        if (!scope.newAuthor)
          return true;
        if ((typeof scope.newAuthor == 'string' || scope.newAuthor instanceof String))
          return true;
        return false;
      };

      var inManageGroup = ((): boolean => {
        var allowed = false;
        $scope.model.userGroups.forEach((val, i, arr) => {
          if (allowed)
            return;
          if (val.canManage) {
            val.users.forEach((user, i2, arr2) => {
              if (user.accountId == $scope.w6.userInfo.id) {
                allowed = true;
                return;
              }
            });
          }
        });
        return allowed;
      })();


      this.setupEditConfig({
        canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id || inManageGroup,
        discardChanges: () => {
          this.$scope.model.entityAspect.entityManager.getChanges().filter((x, i, arr) => {
            return (x.entityType.shortName == "Mod") ? ((<IBreezeMod>x).id == this.$scope.model.id) : ((<any>x).modId && (<any>x).modId == this.$scope.model.id);
          }).forEach(x => x.entityAspect.rejectChanges());
          this.$scope.header.tags = this.$scope.model.tags || [];
        }
      }, null,
        [
          BreezeEntityGraph.Mod.mediaItems().$name, BreezeEntityGraph.Mod.categories().$name,
          BreezeEntityGraph.Mod.dependencies().$name, BreezeEntityGraph.Mod.fileTransferPolicies().$name,
          BreezeEntityGraph.Mod.info().$name, BreezeEntityGraph.Mod.userGroups().$name,
          BreezeEntityGraph.Mod.userGroups().users().$name, BreezeEntityGraph.Mod.updates().$name
        ]);

      this.$scope.openRequestModDeletion = () => this.$scope.request(OpenModDeleteRequestDialogQuery, { model: this.$scope.model });
      this.$scope.openModUploadDialog = (type = "download") => this.$scope.request(OpenModUploadDialogQuery, { model: this.$scope.model, info: type });
      this.$scope.openArchivalStatusDialog = () => this.$scope.request(OpenArchiveModDialogQuery, { model: this.$scope });
      this.$scope.openUploadVersionDialog = () => {
        this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.id });

        if (isUploading(getCurrentChange())) {
          this.logger.error("The mod is currently processing a change, please wait until it finishes.");
          return;
        }

        this.$scope.request(OpenModUploadDialogQuery, { model: this.$scope.model, info: "download" });
      };
      this.$scope.openVersionHistoryDialog = () => {
        this.$scope.request(ModVersionHistoryDialogQuery, { model: this.$scope.model });
      };
      this.$scope.openAddModDialog = (info = { type: "download", folder: "" }) => this.eventBus.publish(new window.w6Cheat.containerObjects.openAddModDialog(this.$scope.model.game, info));

      this.$scope.$watch("uploadingModImage", (newValue, oldValue, scope) => {
        if (newValue == oldValue) return;

        if (!newValue) {
          this.tempModImagePath = null;
        }
      });
      var isUploading = (update: IBreezeModUpdate): boolean => {
        if (update == null)
          return false;
        switch (getState(update.currentState)) {
          case ProcessingState.DownloadServiceUnavailible:
          case ProcessingState.LinkUnavailible:
          case ProcessingState.DownloadingFailed:
          case ProcessingState.ExtractFailed:
          case ProcessingState.RestructureFailed:
          case ProcessingState.PreparingNetworkFailed:
          case ProcessingState.SyncFailed:
          case ProcessingState.UnknownFailure:
          case ProcessingState.Finished:
          case ProcessingState.Yanked:
          case ProcessingState.UserCancelled:
          case ProcessingState.ManagerAbandoned:
          case ProcessingState.SignalFailed:
            return false;
          default:
            return true;
        }
      };

      var timeout = 0;
      var _updating = false;

      var getCurrentChange = () => {
        var result = this.getLatestChange();
        var updating = result != null && isUploading(result);

        if (timeout === 0 || (updating && !_updating)) {

          timeout = setTimeout(() => {
            this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.id });
            timeout = 0;
          }, updating ? 5000 : 1000 * 20);
        }
        _updating = updating;
        return result;
      };

      this.$scope.getCurrentChange = getCurrentChange;

      this.$scope.isUploading = () => {
        return isUploading(getCurrentChange());
      };

      this.$scope.requiresApproval = (update: IBreezeModUpdate): boolean => {
        if (update == null)
          return false;
        let state = getState(update.currentState);
        return this.requiresApproval(state);
      };

      $scope.approving = false;

      this.$scope.approveUpload = (update: IBreezeModUpdate): void => {
        $scope.approving = true;
        if (!$scope.editConfig.canManage()) {
          this.logger.error("Only management can approve an upload.");
          $scope.approving = false;
          return;
        }
        $scope.request(ApproveUploadRequestQuery, { requestId: getCurrentChange().id })
          .then((result) => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            setTimeout(() => {
              $scope.approving = false;
            }, 1000 * 2);
          }).catch(reason => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            this.httpFailed(reason);
            $scope.approving = false;
          });
      };
      this.$scope.denyUpload = (update: IBreezeModUpdate): void => {
        $scope.approving = true;
        if (!$scope.editConfig.canManage()) {
          this.logger.error("Only management can deny an upload.");
          $scope.approving = false;
          return;
        }
        $scope.request(DenyUploadRequestQuery, { requestId: getCurrentChange().id })
          .then((result) => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            setTimeout(() => {
              $scope.approving = false;
            }, 1000 * 2);
          }).catch(reason => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            this.httpFailed(reason);
            $scope.approving = false;
          });
      };
      this.$scope.confirmCancel = false;
      this.$scope.confirmAbandon = false;
      this.$scope.cancelling = false;
      this.$scope.abandoning = false;

      this.$scope.canCancel = (update: IBreezeModUpdate) => {
        if ($scope.cancelling || $scope.abandoning)
          return false;
        var change = getCurrentChange();
        if (change == null)
          return false;
        var state = getState(change.currentState);

        switch (state) {
          case ProcessingState.Uninitialized:
          case ProcessingState.Initializing:
          case ProcessingState.QueuedForProcessing:
            return true;
        }

        if (state >= 100 && state < 200) //Any downloading state
          return true;
        return false;
      };

      this.$scope.getUploadText = (): string => {
        var update = getCurrentChange();
        if (update == null)
          return null;
        var state = getState(update.currentState);

        if ($scope.cancelling || $scope.abandoning)
          return "Cancelling " + update.version + "-" + update.branch;
        if (this.requiresApproval(state)) {
          let info = state == ProcessingState.RequiresApprovalUploadFinished ? ' [F]' : '';
          return "Waiting for Approval" + info + " " + update.version + "-" + update.branch;
        }
        if (state == ProcessingState.SignalFailed)
          return "Waiting for Admin " + update.version + "-" + update.branch;
        if (state == ProcessingState.Uninitialized)
          return "Preparing " + update.version + "-" + update.branch;
        if (state == ProcessingState.RestructureWaitingOnAdmin)
          return "Waiting on Processing " + update.version + "-" + update.branch;
        if (state >= 100 && state < 200)
          return "Uploading " + update.version + "-" + update.branch;
        if (state >= 200 && state < 400)
          return "Processing " + update.version + "-" + update.branch;
        if (state >= 400 && state < 500)
          return "Syncing " + update.version + "-" + update.branch;
        if (state >= 50 && state < 100)
          return "Queued " + update.version + "-" + update.branch;

        return "Processing " + update.version + "-" + update.branch;
      };
      var setCancelState = (state: boolean, force: boolean = false): void => {
        if (force)
          $scope.abandoning = state;
        else
          $scope.cancelling = state;
      };
      var setCancelConfirmState = (state: boolean, force: boolean = false): void => {
        if (force)
          $scope.confirmAbandon = state;
        else
          $scope.confirmCancel = state;
      };

      this.$scope.cancelUpload = (force: boolean = false) => {
        if ($scope.confirmCancel || $scope.confirmAbandon) {
          setCancelState(true, force);
          setCancelConfirmState(false, force);
          $scope.request(CancelUploadRequestQuery, { requestId: getCurrentChange().id, force: force })
            .then((result) => {
              $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
              setTimeout(() => {
                setCancelConfirmState(false, force);
                setCancelState(false, force);
              }, 1000 * 2);
            }).catch(reason => {
              $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
              setTimeout(() => {
                setCancelConfirmState(false, force);
                setCancelState(false, force);
              }, 1000 * 2);
              this.httpFailed(reason);
            });
          return;
        } else {
          setCancelConfirmState(true, force);
          setTimeout(() => {
            setCancelConfirmState(false, force);
          }, 5000);
        }
      };
      this.$scope.getPendingLinkDeletions = () => <IBreezeModMediaItem[]>this.$scope.model.entityAspect.entityManager.getChanges(BreezeEntityGraph.Mod.mediaItems().$name).filter((x: any, index, array) => x.type == "Link" && x.modId == this.$scope.model.id && x.entityAspect.entityState.isDeleted());
    }

    requiresApproval = (state: ProcessingState) => state === ProcessingState.RequiresApproval || state === ProcessingState.RequiresApprovalUploadFinished;

    getLatestChange = () => this.$scope.model.updates.asEnumerable().orderByDescending(x => x.created).firstOrDefault()

    showUploadBanner() {
      var $scope = this.$scope;
      var helpItem = {
        element: "#uploadBanner",
        data: {
          title: 'Upload Banner',
          content: '',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: "/src_legacy/app/play/collections/popovers/banner-upload-popover.html",
          placement: "auto left"
        },
        conditional: () => true,
        popover: null
      };
      this.$scope.showUploadBanner = () => {
        helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

        this.$timeout(() => {
          var helpPopover = helpItem.popover;
          helpPopover.$scope = $scope;
          helpPopover.show();
        });
      };
    }

    private cancelImageUpload() {
      var $scope = <IModScope>this.$scope;

      this.tempModImagePath = null;
      if ($scope.model.fileTransferPolicies.length > 0) {
        var transferPolicy = $scope.model.fileTransferPolicies[0];

        transferPolicy.entityAspect.setDeleted();
        $scope.editConfig.saveChanges(transferPolicy);
      }
    }

    setupContentHeader(content: IBreezeMod): IContentHeader {
      var contentPath = content.game.slug + "/mods";
      var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
      var fullPath = shortPath + "/" + content.slug;
      var header = <IContentHeader>{
        title: content.name + " (" + content.packageName + ")",
        menuItems: this.getModMenuItems(content, false),
        contentType: "mod",
        getAvatar: (width, height) => {
          if (this.tempModImagePath != null)
            return this.tempModImagePath;

          if (this.$scope.model.fileTransferPolicies.length > 0) {
            var policy = this.$scope.model.fileTransferPolicies[0];
            if (policy.uploaded)
              return this.$scope.url.getUsercontentUrl2(policy.path);
          }

          return this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar, content.avatarUpdatedAt), width, height);
        },
        getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.bannerPath, content.bannerUpdatedAt), width, height),
        avatar: content.avatar,
        gameSlug: content.game.slug,
        contentPath: fullPath,
        contentUrl: this.$scope.url.play + "/" + fullPath,
        contentRootUrl: this.$scope.url.play + "/" + contentPath,
        shortContentUrl: this.$scope.url.play + "/" + shortPath,
        tags: content.tags || []
      };

      return header;
    }

    private getModMenuItems(mod: IBreezeMod, editing) {
      var menuItems = angular.copy(ModController.menuItems);

      if (this.$scope.model.dependentsCount > 0 || this.$scope.model.collectionsCount > 0)
        menuItems.push({ header: "Related", segment: "related" });

      if (this.$scope.environment != Environment.Production) {
        menuItems.push({ header: "Blog", segment: "blog" });
        menuItems.push({ header: "Credits", segment: "credits" });
      }

      if (mod.hasReadme)
        menuItems.push({ header: "Readme", segment: "readme" });
      if (mod.hasLicense)
        menuItems.push({ header: "License", segment: "license" });
      if (mod.hasChangelog)
        menuItems.push({ header: "Changelog", segment: "changelog" });
      if (editing)
        menuItems.push({ header: "Settings", segment: "settings" });

      return this.getMenuItems(menuItems, "game.modsShow");
    }

    static menuItems: Array<{ header: string; segment: string; isDefault?: boolean }> = [
      { header: "Info", segment: "info", isDefault: true }
    ];

    private setupCategoriesAutoComplete() {
      var $scope = <IModScope>this.$scope;

      var saveOriginalTags = () => {
        if (!$scope.model.entityAspect.originalValues.hasOwnProperty("tags")) {
          (<any>$scope.model.entityAspect.originalValues).tags = $scope.model.tags.slice(0);
          $scope.model.entityAspect.setModified();
        }
      };

      $scope.addTag = (data) => {
        var index = $scope.model.tags.indexOf(data.key);
        if (index == -1) {
          saveOriginalTags();
          $scope.model.tags.push(data.key);
        }
        $scope.header.tags = $scope.model.tags;
        return true;
      };
      $scope.getCurrentTags = () => {
        var list = [];
        for (var tag in $scope.model.tags) {
          list.push({ key: $scope.model.tags[tag], text: $scope.model.tags[tag] });
        }
        return list;
      };
      $scope.removeTag = (data) => {
        var index = $scope.model.tags.indexOf(data);
        if (index > -1) {
          saveOriginalTags();
          $scope.model.tags.splice(index, 1);
        }
        $scope.header.tags = $scope.model.tags;
      };
      $scope.getCategories = (query) => this.$scope.request(Mods.GetCategoriesQuery, { query: query })
        .then((d) => this.processNames(d.lastResult))
        .catch(this.breezeQueryFailed);
    }

    private newLogoUploadRequest(file: File, $event: any) {
      var $scope = <IModScope>this.$scope;

      //if ($scope.model.imageFileTransferPolicy) {
      //    throw Error("An Upload Request already exists.");
      //}
      if (file == null)
        return;

      if ($scope.uploadingModImage) {
        this.logger.error("You are already uploading an image! Please wait!");
        return;
      }

      if (file.name.endsWithIgnoreCase(".gif")) {
        this.logger.error("You are unable to upload gifs for your mod logo.");
        return;
      }

      $scope.uploadingModImage = true;

      var uploadRequest = BreezeEntityGraph.ModImageFileTransferPolicy.createEntity({
        path: file.name,
        modId: $scope.model.id
      });

      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = e => {
        this.$timeout(() => {
          if ($scope.uploadingModImage)
            this.tempModImagePath = (<any>e.target).result;
        });
      };

      var saveChanges = this.entityManager.saveChanges([uploadRequest])
        .then((result) => {
          Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Debug.log("Failure", reason);
          this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
          this.cancelImageUpload();
          $scope.uploadingModImage = false;
          return;
        });
    }

    private newRemoteLogoUploadRequest(file: string, $event: any) {
      var $scope = this.$scope;
      //if ($scope.model.imageFileTransferPolicy) {
      //    throw Error("An Upload Request already exists.");
      //}
      if (file == null)
        return;

      if ($scope.uploadingModImage) {
        this.logger.error("You are already uploading an image! Please wait!");
        return;
      }

      if (file.endsWithIgnoreCase(".gif")) {
        this.logger.error("You are unable to upload gifs for your mod logo.");
        return;
      }

      $scope.uploadingModImage = true;

      var uploadRequest = BreezeEntityGraph.ModImageFileTransferPolicy.createEntity({
        path: file,
        modId: $scope.model.id
      });

      this.tempModImagePath = file;

      var saveChanges = this.entityManager.saveChanges([uploadRequest])
        .then((result) => {
          Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadRemoteLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Debug.log("Failure", reason);
          this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
          this.cancelImageUpload();
          $scope.uploadingModImage = false;
          return;
        });
    }

    private uploadLogo(file: File, policy: IBreezeModImageFileTransferPolicy) {
      var $scope = <IModScope>this.$scope;
      this.uploadService.uploadToAmazonWithPolicy(file, policy.uploadPolicy)
        .success((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Debug.log(data, status, headers, config);

          this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
          policy.uploaded = true;
          $scope.uploadingModImage = false;
        }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Debug.log(data, status, headers, config);
          Debug.log("Failure");

          this.cancelImageUpload();
          $scope.uploadingModImage = false;

          if (data.includes("EntityTooLarge")) {
            this.logger.error("Your image can not be larger than 5MB", "Image too large");
          }
          if (data.includes("EntityTooSmall")) {
            this.logger.error("Your image must be at least 10KB", "Image too small");
          }
        });
    }

    private uploadRemoteLogo(file: string, policy: IBreezeModImageFileTransferPolicy) {
      var $scope = this.$scope;
      this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
      policy.uploaded = true;
      $scope.uploadingModImage = false;
    }

    unfollow() {
      this.requestAndProcessResponse(UnfollowModCommand, { model: this.$scope.model })
        .then(r => {
          delete this.$scope.followedMods[this.$scope.model.id];
          this.$scope.model.followersCount -= 1;
        });
    }

    follow() {
      this.requestAndProcessResponse(FollowModCommand, { model: this.$scope.model })
        .then(r => {
          this.$scope.followedMods[this.$scope.model.id] = true;
          this.$scope.model.followersCount += 1;
        });
    }

    setupHelp() {
      var $scope = this.$scope;
      var helpItem = {
        element: "#helpButton",
        data: {
          title: 'Help Section',
          content: 'Click the next button to get started!',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: "/src_legacy/app/play/mods/popovers/help-popover.html"
        },
        conditional: () => true,
        popover: null
      };

      var showSection = (item: HelpItem<IModScope>) => {
        item.popover = this.$popover($(item.element), item.data);
        this.$timeout(() => {
          item.popover.show();
          helpItem.popover.hide();
        });
      };

      var displayCondition = (item: HelpItem<IModScope>, scope: IModScope): boolean => {
        if ($(item.element).length == 0)
          return false;

        return item.conditional(scope);
      };

      this.$scope.showHelp = () => {
        helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

        this.$timeout(() => {
          var helpPopover = helpItem.popover;
          helpPopover.$scope.helpItems = ModController.helpItems;
          helpPopover.$scope.showSection = showSection;
          helpPopover.$scope.contentScope = $scope;
          helpPopover.$scope.displayCondition = displayCondition;
          helpPopover.show();
        });
      };
    }

    private static helpItemTemplate: string = "/src_legacy/app/play/mods/popovers/help-item-popover.html";
    private static helpItems: HelpItem<IModScope>[] = [
      {
        element: "#openEditorButton",
        data: {
          title: 'How to get started',
          content: 'Click here to “open editor”. This will allow you to interact with several items directly inside the Page. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: ModController.helpItemTemplate
        },
        conditional: ($scope) => !$scope.editConfig.editMode,
        popover: null
      },
      {
        element: ".pagetitle",
        data: {
          title: 'Edit your Title',
          content: 'Simply Click on the Title text in order to change it.<br/><br/><b>Hint:</b> Choose your Mod title carefully as it will show up in the filter and search. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: ModController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#addModTag",
        data: {
          title: 'Add/Edit Tags',
          content: 'Click on + you can add the Tag(s) that best fit the type of your.<br/><br/><b>Hint:</b> Don´t use more than four tags if possible, as too many tags will confuse players. ',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: ModController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#modDescription",
        data: {
          title: 'Edit your Description',
          content: 'Keybord Shortcuts : <a target="_blank" href="http://imperavi.com/redactor/docs/shortcuts/">http://imperavi.com/redactor/docs/shortcuts/</a><br/><br/><b>Hint:</b> you can also import your BI Forum description. All you need is to set your BI forum thread as homepage and click on “Import Forum post”.',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: ModController.helpItemTemplate
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      },
      {
        element: "#addModDependency",
        data: {
          title: 'How to use dependencies',
          content: 'Click on “+ Add Dependency” to search and select the appropriate depended mod, or click on “x” to remove a dependency. Dependencies are not version specific.<br/><br/><b>Warning:</b> Make sure to select the correct dependencies as your mod will be launched along with the depended content. Selecting wrong or incompatible dependencies can cause crashes and errors!',
          trigger: 'manual',
          container: 'body',
          autoClose: true,
          template: ModController.helpItemTemplate,
          placement: "auto left"
        },
        conditional: ($scope) => $scope.editConfig.editMode,
        popover: null
      } /*,
            {
                element: "",
                data: {
                    title: '', content: '',
                    trigger: 'manual', container: 'body', autoClose: true,
                    template: ModController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            }*/
    ];
  }


  registerController(ModController);

  export class ModFileController extends BaseController {
    static $name = "ModFileController";

    static $inject = ['$scope', 'logger', '$q', 'model'];

    constructor($scope, logger, $q, model) {
      super($scope, logger, $q);

      $scope.model = model;
    }
  }

  registerController(ModFileController);


  // Inherits the scope from the parent controller...
  export interface IEditableModScope extends IModScope {
    authorDropdown: any[];
    dropdown: Object[];
  }

  export interface IModInfoScope extends IEditableModScope, IHandleCommentsScope<IBreezeModComment> {
    openClaimDialog: () => any;
    exampleData: { key: string; values: number[][] }[];
    xAxisTickFormat: () => (d) => string;
    addDependency: (data, hide) => boolean;
    removeDependency: (data) => void;
    getCurrentDependencies: () => Array<ITagKey>;
    getDependencies: (query) => any;
    addLink: (link) => void;
    newLink: { title: string; path: string };
  }

  export class ModEditBaseController extends BaseController {
    constructor(public $scope: IEditableModScope, logger, $q, public $timeout) {
      super($scope, logger, $q);

      this.setupInlineEditingDropdown();
    }

    // TODO: Consider if this should actually go into the edit-menu directive or not..
    private setupInlineEditingDropdown() {
      this.$scope.dropdown = [
        //{
        //    "text": "Upload New Version",
        //    "click": "openUploadVersionDialog()"
        //}
      ];

      //if (this.$scope.w6.userInfo.hasPermission('mods', 'create')) {
      //    this.$scope.dropdown.push(
      //        {
      //            "text": "Upload New Mod",
      //            "click": "openAddModDialog()"
      //        }
      //        );
      //}

      this.$scope.dropdown.push(
        {
          "divider": true
        },
        {
          "text": "<span class=\"red\">Request Mod Deletion</span>",
          "click": "openRequestModDeletion()"
        }
      );

      if (this.$scope.editConfig.canManage()) {
        this.$scope.dropdown.push(
          {
            "divider": true
          },
          {
            "text": "<stong>Management</strong>",
            "href": "#"
          },
          {
            "text": "Change Author",
            "click": "openChangeAuthorDialog()"
          } //,
          //{
          //    "text": "<span class=\"red\">Delete Mod</span>",
          //    "href": "#anotherAction"
          //}
        );
      }

      if (this.$scope.editConfig.canManage() || this.$scope.editConfig.canEdit()) {
        this.$scope.dropdown.push({
          "text": "Archival Status",
          "click": "openArchivalStatusDialog()"
        }
        )
      }

      this.$scope.authorDropdown = [
        {
          "text": "Edit Author Settings",
          "click": "openEditAuthorSettings()"
        }
      ];
      //openChangeAuthorDialog()
      if (this.$scope.editConfig.canManage()) {
        this.$scope.authorDropdown.push(
          {
            "divider": true
          },
          {
            "text": "<stong>Management</strong>",
            "href": "#anotherAction"
          },
          {
            "text": "Change Author",
            "click": "openChangeAuthorDialog()"
          }
        );
      }
    }
  }

  export class ModInfoController extends ModEditBaseController {
    static $name = "ModInfoController";
    static $inject = ['$scope', 'logger', '$q', '$timeout', '$routeParams'];

    constructor(public $scope: IModInfoScope, logger, $q, public $timeout: ng.ITimeoutService, private $routeParams) {
      super($scope, logger, $q, $timeout);

      this.entityManager = $scope.model.entityAspect.entityManager;
      this.setupComments($scope.model);

      $scope.addLink = () => {
        BreezeEntityGraph.ModMediaItem.createEntity({
          title: $scope.newLink.title,
          path: $scope.newLink.path,
          type: 'Link',
          modId: '' + $scope.model.id + '',
          mod: $scope.model
        });
        $scope.newLink.title = "";
        $scope.newLink.path = "";
      };
      $scope.newLink = {
        title: "",
        path: ""
      };
      this.setupClaiming();
      this.setupStatistics();
      this.setupDependencyAutoComplete();

      this.setupTitle("model.name", "Info - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
    }

    private setupComments(mod: IBreezeMod) {
      this.$scope.addComment = newComment => {
        Debug.log('Add new comment', newComment);
        var r = this.$scope.requestWM<ICreateComment<IBreezeModComment>>(CreateModCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
        newComment.message = "";
        newComment.valueOf = false;
        return r;
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteModCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
        this.$scope.saveComment = comment => {
          Debug.log("Saving comment", comment);
          return this.$scope.request(SaveModCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); });
        };
      this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
      if (this.$scope.environment != Tools.Environment.Production) {
        this.$scope.commentLikeStates = {};
        if (this.$scope.w6.userInfo.id) {
          this.$timeout(() => this.$scope.request(GetModCommentLikeStateQuery, { modId: this.$scope.model.id })
            .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
            .catch(this.breezeQueryFailed));
        }

        this.$scope.likeComment = comment => {
          this.$scope.request(LikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount += 1;
            this.$scope.commentLikeStates[comment.id] = true;
          });
        };
        this.$scope.unlikeComment = comment => {
          this.$scope.request(UnlikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
            comment.likesCount -= 1;
            this.$scope.commentLikeStates[comment.id] = false;
          });
        };
      }

      this.$timeout(() => this.$scope.request(GetModCommentsQuery, { modId: this.$scope.model.id }));
    }

    private setupClaiming() {
      this.$scope.openClaimDialog = () => this.$scope.request(OpenClaimDialogQuery, { gameSlug: this.$routeParams.gameSlug, modId: this.$routeParams.modId });
    }

    private setupStatistics() {
      //[x,y], [day, amount]
      this.$scope.exampleData = [
        {
          "key": "Downloads",
          "values": [[1409741388470, 0], [1409741389470, 10], [1409741390470, 50], [1409741391470, 150], [1409741392470, 300], [1409741393470, 450], [1409741394470, 525], [1409741395470, 600], [1409741396470, 675], [1409741397470, 780], [1409741398470, 850]]
        },
        {
          "key": "Followers",
          "values": [[1409741388470, 1], [1409741389470, 3], [1409741390470, 10], [1409741391470, 15], [1409741392470, 35], [1409741393470, 65], [1409741394470, 70], [1409741395470, 73], [1409741396470, 70], [1409741397470, 65], [1409741398470, 75]]
        }
      ];
      this.$scope.xAxisTickFormat = () => d => new Date(d).toLocaleString(); //uncomment for date format
    }

    private setupDependencyAutoComplete() {
      this.$scope.addDependency = (data, hide) => {
        var found = false;

        angular.forEach(this.$scope.model.dependencies, item => {
          if (data.id == item.id) {
            found = true;
          }
        });

        // ReSharper disable once ExpressionIsAlwaysConst, ConditionIsAlwaysConst
        if (!found)
          BreezeEntityGraph.ModDependency.createEntity({ id: data.id, modId: this.$scope.model.id, name: data.name, gameSlug: this.$scope.model.game.slug });
        hide();
        return false;
      };
      this.$scope.removeDependency = (data) => {
        var found = false;
        var dependency = null;

        angular.forEach(this.$scope.model.dependencies, item => {
          if (data.id == item.id) {
            found = true;
            dependency = data;
          }
        });

        // ReSharper disable HeuristicallyUnreachableCode, QualifiedExpressionIsNull, ConditionIsAlwaysConst
        if (found)
          dependency.entityAspect.setDeleted();
        // ReSharper restore HeuristicallyUnreachableCode, QualifiedExpressionIsNull, ConditionIsAlwaysConst
      };
      this.$scope.getCurrentDependencies = () => {
        var list = [];
        angular.forEach(this.$scope.model.dependencies, item => list.push({ key: item.id, text: item.name, id: item.modId }));

        return list;
      };
      this.$scope.getDependencies = (query) => this.$scope.request(Mods.GetModTagsQuery, { gameId: this.$scope.game.id, query: query })
        .then((d) => this.processModNames(d.lastResult))
        .catch(this.breezeQueryFailed);
    }

    private processModNames(names) {
      var obj = [];
      for (var i in names) {
        var mod = <any>names[i];
        obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
      }
      return obj;
    }

    private entityManager: breeze.EntityManager;
  }

  registerController(ModInfoController);

  export interface IModCreditsScope extends IEditableModScope {
    newUser: IBreezeUser;

    addGroup: (name: string) => void;
    addUserToGroup: (group: IBreezeModUserGroup, $hide: any) => void;
    userCheck: (user: any) => boolean;
    logger;
  }

  export class ModCreditsController extends ModEditBaseController {
    static $inject = ['$scope', 'logger', '$q', '$timeout'];
    static $name = "ModCreditsController";

    entityManager: breeze.EntityManager;

    constructor(public $scope: IModCreditsScope, logger, public $q: ng.IQService, $timeout) {
      super($scope, logger, $q, $timeout);
      // TODO: This should retrieve the Credits info
      this.entityManager = $scope.model.entityAspect.entityManager;

      $scope.addGroup = this.addGroup;
      $scope.addUserToGroup = this.addUserToGroup;
      $scope.userCheck = this.userCheck;
      $scope.logger = this.logger;

      this.setupTitle("model.name", "Credits - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
      Debug.log("SCOPE: ", $scope);
      //this.$timeout(() => this.$scope.request(GetModCreditsQuery, { modId: this.$scope.model.id }));
    }

    addGroup = (name: string): void => {
      var group = BreezeEntityGraph.ModUserGroup.createEntity(this.entityManager, {
        name: name
      });
      this.$scope.model.userGroups.push(group);
      this.$timeout(() => {
        (<any>$("#" + group.id)[0]).scrollIntoViewIfNeeded();
        Debug.log($("#" + group.id + "-title"));
        $("#" + group.id + "-title").click(); //this.$timeout(() => $("#" + group.id + "-title").click(),100);
      });
    };

    addUserToGroup(group: IBreezeModUserGroup, $hide): void {
      var $scope = <any>this;
      if (!$scope.userCheck($scope.newUser)) {
        return;
      }
      if ($scope.addingUser)
        return;
      $scope.addingUser = true;
      var user = <IBreezeUser>$scope.newUser;
      var hasUser = false;
      group.users.forEach((val, i, arr) => {
        if (val.accountId == user.id) {
          hasUser = true;
          return;
        }
      });

      // ReSharper disable once ConditionIsAlwaysConst
      if (hasUser) {
        $scope.logger.error("A User can only be in a group once.", "User already in group");
        $scope.addingUser = false;
        return;
      }
      group.users.push(BreezeEntityGraph.ModGroupUser.createEntity(group.entityAspect.entityManager, {
        account: user
      }));
      $hide();
    }

    userCheck = (user: any): boolean => {
      if (!user)
        return false;
      if ((typeof user == 'string' || user instanceof String))
        return false;
      return true;
    };
  }

  registerController(ModCreditsController);

  export interface IModBlogScope extends IEditableModScope {
    createBlogPost: boolean;
    createBlogSection: () => void;
    newBlogPost: _IntDefs.__opt_WallPost;
    save: (any) => void;
  }

  export class ModBlogController extends ModEditBaseController {
    static $inject = ['$scope', 'logger', '$q', '$timeout'];
    static $name = "ModBlogController";

    constructor($scope: IModBlogScope, logger, $q, $timeout) {
      super($scope, logger, $q, $timeout);
      Debug.log("Scope: ", $scope);
      $scope.createBlogPost = false;
      /*
      Debug.log(<any>BreezeEntityGraph.AccountWall.$name);

      */
      $scope.model.entityModule = BreezeEntityGraph.ModEntityModule.createEntity();
      //$scope.model.entityModule.entityAspect.loadNavigationProperty(BreezeEntityGraph.EntityModule.wall().$name);

      $scope.createBlogSection = () => {
        if ($scope.model.entityModule.wall != null)
          return;

        $scope.model.entityModule.wall = BreezeEntityGraph.Wall.createEntity({
          entityModule: $scope.model.entityModule
        });
        $scope.editConfig.saveChanges($scope.model.entityModule.wall);
      };

      $scope.save = (a) => {
        Debug.log(a);
        $scope.model.entityModule.wall.posts.push(BreezeEntityGraph.WallPost.createEntity({
          //title: a.title.$modelValue,
          content: a.content.$modelValue
        }));
        $scope.createBlogPost = false;
        $scope.$apply();
      };
      this.setupTitle("model.name", "Blog - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
    }
  }

  registerController(ModBlogController);

  export class ModRelatedController extends BaseController {
    static $name = "ModRelatedController";

    constructor($scope, logger, $q) {
      super($scope, logger, $q);
      this.setupTitle("model.name", "Related - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
      //$scope.model.entityAspect.loadNavigationProperty("dependents");
      //$scope.model.entityAspect.loadNavigationProperty("collections");
    }
  }

  registerController(ModRelatedController);

  export class ModDeleteRequestDialogController extends ModelDialogControllerBase<IBreezeMod> {
    static $name = 'ModDeleteRequestDialogController';
    static $view = '/src_legacy/app/play/mods/dialogs/delete-request.html';

    constructor(public $scope, public logger, $modalInstance, $q, model: IBreezeMod) {
      super($scope, logger, $modalInstance, $q, model);

      $scope.sendReport = () => this.processCommand($scope.request(MyApp.Components.Dialogs.SendReportCommand, { data: $scope.model }, "Report sent!")
        .then((data) => $scope.sent = true));
    }
  }

  registerController(ModDeleteRequestDialogController);

  export class ModNewModWelcomeDialogController extends ModelDialogControllerBase<IBreezeMod> {
    static $name = 'ModNewModWelcomeDialogController';
    static $view = '/src_legacy/app/play/mods/dialogs/new-mod-welcome.html';

    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'editConfig'];

    constructor(public $scope, public logger, $modalInstance, $q, model: IBreezeMod, editConfig: IEditConfiguration<IBreezeMod>) {
      super($scope, logger, $modalInstance, $q, model);

      //$scope.editconfig = editConfig;

      $scope.edit = () => {
        editConfig.enableEditing();
        $scope.$close();
      };
    }
  }

  registerController(ModNewModWelcomeDialogController);

  export class ArchiveModDialogController extends ModelDialogControllerBase<IModScope> {
    static $name = 'ArchiveModDialogController';
    static $view = '/src_legacy/app/play/mods/dialogs/archive-mod.html';

    constructor(public $scope, public logger, $modalInstance, $q, model: IModScope) {
      super($scope, logger, $modalInstance, $q, model);

      $scope.model = model.model;
      $scope.setArchivedStatus = (archive: boolean) => {
        var shouldSave = !model.editConfig.isEditing && !model.editConfig.isManaging;
        if (archive) {
          model.model.archivedAt = new Date();
        } else {
          model.model.archivedAt = null;
        }
        if (shouldSave) {
          model.editConfig.saveChanges();
          this.$modalInstance.close();
        }
      };
    }
  }

  registerController(ArchiveModDialogController);

  export interface IUploadVersionDialogScope extends IContentScope {
    model: {
      cmod: IBreezeMod;
      mod: {
        modId: string;
        branch?: string;
        version?: string;
        download?: string;
        isIncremental?: boolean;
      };
      downloadLinkAvailable?: boolean;
      info: {
        type: string;
        folder: string;
        userName: string;
        password: string;
      }
    };
    checkingDownloadLink: boolean;
    ok: () => void;
    cancel: () => any;
    branches: { displayName: string; value }[];
    hints: { name: string; author: string; version: string; dependencies: string; branch: string; download: string; homepage: string; comments: string; packageName: string; packageNameUnavailable: string; downloadLinkUnavailable: string };
    inlineHints: { name: string; author: string; version: string; dependencies: string; branch: string; download: string; homepage: string; comments: string; packageName: string; packageNameUnavailable: string; packageNameMissingPrefix: string; packageNameEmpty: string; downloadLinkUnavailable: string; downloadLinkAvailable: string; checkingDownload: string };
    versionPattern: RegExp;
    validateVersion: (v1: string, v2: string, options?: any) => number;
  }

  export class UploadVersionDialogController extends ModelDialogControllerBase<IBreezeMod> {
    static $name = 'UploadVersionDialogController';
    static $view = '/src_legacy/app/play/mods/dialogs/upload-new-version.html';
    static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'info', 'modInfoService', 'dbContext'];

    constructor(public $scope: IUploadVersionDialogScope, public logger: Components.Logger.ToastLogger, $modalInstance, $q, model: IBreezeMod, info: string, private modInfoService, private dbContext: W6Context) {
      super($scope, logger, $modalInstance, $q, model);

      $scope.cancel = this.cancel;
      $scope.ok = this.ok;
      this.$scope.checkingDownloadLink = false;
      this.$scope.model.downloadLinkAvailable = false;

      let latest = this.getLatestChange(model);
      let dlUrl = latest && latest.downloadUri && !latest.downloadUri.includes("@") ? latest.downloadUri : null;

      $scope.model = {
        cmod: model,
        mod: {
          modId: model.id,
          download: dlUrl,
          isIncremental: null
        },
        info: {
          type: info,
          folder: "",
          userName: Tools.Password.generate(128),
          password: Tools.Password.generate(128)
        }
      };

      $scope.branches = Games.AddModDialogController.branches;
      $scope.hints = Games.AddModDialogController.hints;
      $scope.inlineHints = Games.AddModDialogController.inlineHints;
      $scope.versionPattern = Games.AddModDialogController.versionPattern;
      $scope.validateVersion = this.validateVersion;

      $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
        if (newValue != oldValue && newValue != null && newValue != "")
          this.checkDownloadLink(newValue);
      });

      // TODO: Handle not connected handler??
      if (this.$scope.w6.miniClient.isConnected) {
        this.modInfoService.getUploadFolder(model.id)
          .then(x => $scope.model.info.folder = x)
          .catch(x => Tools.Debug.log("failed to retrieve existing folder", x));
      }

      let downloadUri = this.$scope.model.mod.download;
      if (downloadUri &&
        (downloadUri.includes("armaholic.com") || downloadUri.includes("steamcommunity.com")))
        this.getLatestInfo();
    }

    getLatestChange = (mod: IBreezeMod) => mod.updates.asEnumerable().orderByDescending(x => x.created).firstOrDefault()

    getLatestInfo() {
      let model = this.$scope.model;
      this.$scope.request(GetLatestInfo, { data: { downloadUri: model.mod.download } }).then(x => {
        let r = <Play.Games.IModVersionInfo>x.lastResult;
        model.mod.version = r.version;
        model.mod.branch = r.branch;
      });
    }

    checkDownloadLink(uri: string) {
      this.$scope.checkingDownloadLink = true;
      this.$scope.model.downloadLinkAvailable = false;
      this.$scope.request(Games.GetCheckLinkQuery, { linkToCheck: uri })
        .then((result) => {
          this.$scope.checkingDownloadLink = false;
          Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result.lastResult;
        })
        .catch(this.httpFailed);
    }

    get type() {
      if (this.$scope.model.info.type == "upload")
        return 1;
      return 0;
    }

    // todo; make part of commands
    selectFolder() {
      if (!this.$scope.w6.miniClient.isConnected) {
        alert("Please start the Sync client first, and make sure it is uptodate");
        return;
      }
      return this.modInfoService.prepareFolder().then(x => this.applyIfNeeded(() => this.$scope.model.info.folder = x));
    }
    upload() {
      return this.modInfoService.uploadFolder({
        folder: this.$scope.model.info.folder, userId: this.getUploadId(),
        gameId: this.$scope.model.cmod.gameId, contentId: this.$scope.model.cmod.id, userName: this.$scope.model.info.userName, password: this.$scope.model.info.password
      })
        .then(x => this.dbContext.postCustom("mods/" + this.$scope.model.cmod.id + "/finished-upload"));
    }

    getUploadId = () => this.$scope.model.cmod.groupId || this.$scope.w6.userInfo.id;

    private cancel = () => this.$modalInstance.close();
    private ok = () => {
      if (this.$scope.model.cmod.modVersion != null && this.validateVersion(this.$scope.model.mod.version, this.$scope.model.cmod.modVersion) <= 0) {
        this.logger.error("The new mod version must be greater than the current version", "Bad Version");
        return;
      }

      let shouldUpload = this.type == 1;
      if (shouldUpload) {
        this.$scope.model.mod.download = `rsync://${this.$scope.model.info.userName}:${this.$scope.model.info.password}@staging.sixmirror.com`;
      }

      this.$scope.request(NewModVersionCommand, { data: this.$scope.model.mod })
        .then(async (result) => {
          this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.cmod.id });
          this.$modalInstance.close();
          if (shouldUpload) {
            await this.upload();
          }
        })
        .catch(this.httpFailed);
    };
    private validateVersion = (v1: string, v2: string, options?: any): number => {
      var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts: any = v1.split('.'),
        v2parts: any = v2.split('.');

      function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
      }

      if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
      }

      if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
      }

      if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
      }

      for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
          return 1;
        }

        if (v1parts[i] == v2parts[i]) {
          continue;
        } else if (v1parts[i] > v2parts[i]) {
          return 1;
        } else {
          return -1;
        }
      }

      if (v1parts.length != v2parts.length) {
        return -1;
      }

      return 0;
    };
  }

  registerController(UploadVersionDialogController);

  export interface IModVersionHistoryDialogScope extends IContentScope {

    ok: () => void;
    cancel: () => any;
    model: IBreezeMod;
    updates: IBreezeModUpdate[];
  }

  export class ModVersionHistoryDialogController extends ModelDialogControllerBase<IBreezeMod> {
    static $name = 'ModVersionHistoryDialogController';
    static $view = '/src_legacy/app/play/mods/dialogs/version-history.html';

    constructor(public $scope: IModVersionHistoryDialogScope, public logger: Components.Logger.ToastLogger, $modalInstance, $q, model: IBreezeMod) {
      super($scope, logger, $modalInstance, $q, model);

      $scope.cancel = this.cancel;
      $scope.ok = this.ok;
      $scope.model = model;
      $scope.updates = model.updates.asEnumerable().orderByDescending(x => x, Mods.ModsHelper.versionCompare).toArray();
    }

    private cancel = () => this.$modalInstance.close();
    private ok = () => this.$modalInstance.close();
  }

  registerController(ModVersionHistoryDialogController);

  export class ModsHelper {
    static arma2Id = "1947DE55-44ED-4D92-A62F-26CFBE48258B";
    static arma3Id = "9DE199E3-7342-4495-AD18-195CF264BA5B";
    static a3MpCategories = ["Island", "Objects (Buildings, Foliage, Trees etc)"];
    static objectCategories = ["Objects (Buildings, Foliage, Trees etc)"];
    static getGameIds(id: string) {
      if (id.toUpperCase() == this.arma3Id)
        return [id, this.arma2Id];
      return [id];
    }

    static getCompatibilityModsFor(id: string, otherId: string, tags: string[] = []) {
      if (id.toUpperCase() == this.arma3Id) {
        if (tags.asEnumerable().any(x => this.objectCategories.asEnumerable().contains(x))) return [];
        if (tags.asEnumerable().any(x => this.a3MpCategories.asEnumerable().contains(x))) return ["@cup_terrains_core"];
        return ["@AllInArmaStandaloneLite"];
      }
      return [];
    }
    static getFullVersion = (x: IBreezeModUpdate, cutStable = true) => x.version + (cutStable && x.branch == 'stable' ? '' : ('-' + x.branch));
    static versionCompare = (x: IBreezeModUpdate, y: IBreezeModUpdate) => Tools.versionCompare(ModsHelper.getFullVersion(x, false), ModsHelper.getFullVersion(y, false))
  }

  // DEPRECATED: Convert to Queries/Commands
  export class ModDataService extends W6ContextWrapper {
    static $name = 'modDataService';

    public getModsInCollection(collectionId, options): Promise<IQueryResult<IBreezeMod>> {
      Debug.log("getting mods in collection: " + collectionId);
      var query = breeze.EntityQuery.from("ModsInCollection")
        .withParameters({ collectionId: collectionId })
        .expand(["categories"]);

      if (options.filter)
        query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any>this.$q.reject("invalid query");

      query = query.orderBy(this.context.generateOrderable(options.sort));

      query = this.context.applyPaging(query, options.pagination);
      query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMod>(query);
    }

    public getModsInCollectionByName(collectionId, name) {
      Debug.log("getting mods in collection: " + collectionId);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("ModsInCollection")
        .withParameters({ collectionId: collectionId })
        .expand(["categories"])
        .where(new breeze.Predicate("toLower(packageName)", op, key)
          .or(new breeze.Predicate("toLower(name)", op, key)))
        .orderBy("packageName")
        .select(["packageName", "name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getAllModsByGame(gameIds: string[], options) {
      Debug.log("getting mods by game: " + gameIds.join(", "), options);
      var jsonQuery = {
        from: 'Mods',
        where: {
          'gameId': { in: gameIds }
        }
      }
      var query = new breeze.EntityQuery(jsonQuery).expand(["categories"]);

      if (options.filter)
        query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any>this.$q.reject("invalid query");

      if (options.sort && options.sort.fields.length > 0)
        query = query.orderBy(this.context.generateOrderable(options.sort));

      if (options.pagination)
        query = this.context.applyPaging(query, options.pagination);
      query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMod>(query);
    }

    private getDesiredFields = query => query.select(["id", "name", "packageName", "group", "groupId", "gameId", "game", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "authorText", "size", "sizePacked", "followersCount", "modVersion", "stat", "latestStableVersion"]);

    public getAllModsByAuthor(authorSlug: string, options): Promise<IQueryResult<IBreezeMod>> {
      Debug.log("getting mods by author: " + authorSlug);
      var query = breeze.EntityQuery.from("Mods")
        .where("author.slug", breeze.FilterQueryOp.Equals, authorSlug);

      if (options.filter)
        query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any>this.$q.reject("invalid query");

      if (options.sort && options.sort.fields.length > 0)
        query = query.orderBy(this.context.generateOrderable(options.sort));

      if (options.pagination)
        query = this.context.applyPaging(query, options.pagination);
      query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMod>(query);
    }

    public getTagsQuery(split): breeze.Predicate {
      var pred: breeze.Predicate;
      for (var v in split) {
        var p = this.searchTags(breeze, split[v]);
        pred = pred == null ? p : pred.and(p);
      }

      return pred;
    }

    public queryText(query, filterText, inclAuthor) {
      if (filterText == "")
        return query;

      var info = <any>W6Context.searchInfo(filterText, false, this.context.filterPrefixes);
      var pred = this.getNameQuery(info.name);
      var pred2 = this.getTagsQuery(info.tag);
      var pred3 = this.getAuthorQuery(info.user);

      return this.context.buildPreds(query, [pred, pred2, pred3]);
    }

    public getNameQuery(split: string[]): breeze.Predicate {
      return this.context.findInField(split, ["packageName", "name"], undefined);
    }

    public getAuthorQuery(split): breeze.Predicate {
      var pred: breeze.Predicate;
      for (var v in split) {
        var p = new breeze.Predicate("toLower(author.userName)", breeze.FilterQueryOp.Contains, split[v])
          .or(new breeze.Predicate("toLower(author.displayName)", breeze.FilterQueryOp.Contains, split[v]))
          .or(new breeze.Predicate("toLower(authorText)", breeze.FilterQueryOp.Contains, split[v]));
        pred = pred == null ? p : pred.and(p);
      }
      return pred;
    }

    public getFollowedModIds(gameSlug: string) {
      Debug.log("getting followed mod ids");
      return this.context.get('FollowedMods', { gameSlug: gameSlug });
    }

    private searchTags(breeze, lc): breeze.Predicate {
      return breeze.Predicate.create("categories", "any", "name", breeze.FilterQueryOp.Contains, lc);
    }
  }

  registerService(ModDataService);
}
