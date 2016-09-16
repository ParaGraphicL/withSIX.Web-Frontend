import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {FeatureToggles} from '../services/features';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {ITagKey, ICreateComment, ICQWM, IModel, IMenuItem} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';
import {HttpClient} from 'aurelia-fetch-client';
import {ToastLogger, GlobalErrorHandler} from '../services/legacy/logger';
import { ErrorHandler } from '../services/error-handler';
import {Container} from 'aurelia-framework';
import breeze from 'breeze-client';

import {BasketService} from '../services/basket-service';

import {SpeedValueConverter, SizeValueConverter, AmountValueConverter} from '../resources/converters';
import {CollectionDataService, ModDataService, MissionDataService} from '../services/legacy/data-services';
import {LegacyMediator, Mediator} from '../services/mediator';
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

export interface IRootScope extends ng.IRootScopeService {
  vm;
  canceler: ng.IDeferred<{}>;
  dispatch<T>(evt: string, pars?: Object): Promise<T>;
  request<T>(evt, pars?: Object): Promise<T>;
  features: FeatureToggles;
  environment; //: Tools.Environment;
  loading: boolean;
  w6: W6;
  url: W6Urls;
  toShortId: (id) => string;
  sluggify: (str) => string;
  Modernizr;
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
  microdata: IMicrodata;
  setMicrodata: (microdata: IMicrodata) => void;
  setPageInfo: (pageInfo: IPageInfo) => void;
  defaultImage: string;
  breadcrumbs: Object[];
  pageInfo: { title: string };
  openLoginDialog: (evt?: any) => void;
  logout: () => any;
  downloadsHandled: boolean;
  handleDownloads: () => any;
  initialLoad: boolean;
}


export interface IBaseScope extends IRootScope {
  title: string;
  subtitle: string;
  first: boolean;
  destroyed: boolean;
  menuItems: IMenuItem[];
  response;
}



export class DbQueryBase extends Tk.QueryBase {
  static $inject = ['dbContext'];

  constructor(public context: W6Context) {
    super();
  }

  public findBySlug = <T extends breeze.Entity>(type: string, slug: string, requestName: string) => this.processSingleResult<T>(this.context.executeQuery<T>(breeze.EntityQuery.from(type)
    .where("slug", breeze.FilterQueryOp.Equals, slug)
    .top(1), requestName));

  public executeKeyQuery = <T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> => this.processSingleResult<T>(this.context.executeKeyQuery<T>(query));

  processSingleResult = async <T extends breeze.Entity>(promise: Promise<IQueryResult<T>>) => {
    let result: IQueryResult<T>;
    try {
      result = await promise;
    } catch (failure) {
      if (failure.status === 404) throw new Tools.NotFoundException("The server responded with 404", { status: 404, statusText: 'NotFound', body: {} });
      else throw failure;
    }
    if (result.results.length === 0) throw new Tools.NotFoundException("There were no results returned from the server", { status: 404, statusText: 'NotFound', body: {} });
    return result.results[0];
  }

  public getEntityQueryFromShortId(type: string, id: string): breeze.EntityQuery {
    Tools.Debug.log("getting " + type + " by shortId: " + id);
    return breeze.EntityQuery
      .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
  }

  public getEntityQuery(type: string, id: string): breeze.EntityQuery {
    Tools.Debug.log("getting " + type + " by id: " + id);
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
        httpFailed: this.context.w6.api.errorMsg(reason)
      };
    }
    return {
      message: !reason.data ? "Unknown error" : reason.data.message,
      errors: reason.data.modelState,
      httpFailed: this.context.w6.api.errorMsg(reason)
    };
  };
  public respondSuccess = message => {
    return { success: true, message: message };
  };
  public respondError = <T>(reason) => {
    var response = this.buildErrorResponse(reason);
    /*
    if (reason.data && reason.data.modelState) {
        if (reason.data.modelState["activation"]) {
            response.notActivated = true;
        }
    }
    */
    return Promise.reject<T>(response);
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

    Tools.Debug.log('createDialog', { controller: controller, template: template, data: data }, opts);

    var dialog = dialogs.create(template || controller.$view, controller, data, opts);

    Tools.Debug.log(dialog);

    return dialog;
  }

  static openDialog($modal, controller, config?) {
    var cfg = Object.assign(this.getConfig(controller), config);
    Tools.Debug.log('openDialog', cfg);

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

export class BaseController extends Tk.Controller {
  static $inject = ['$scope', 'logger', '$q'];

  constructor(public $scope: IBaseScope, public logger /*: Components.Logger.ToastLogger */, public $q: ng.IQService) {
    super($scope);
    $scope.$on('$destroy', () => $scope.destroyed = true);
  }

  get w6() { return this.$scope.w6 }

  applyIfNeeded = <T>(func?: () => T) => this.applyIfNeededOnScope<T>(func, this.$scope);
  applyIfNeededOnScope = <T>(func: () => T, scope: ng.IScope) => new Promise<T>((res, rej) => {
    scope.$evalAsync(() => {
      try {
        func ? res(func()) : res();
      } catch (err) {
        rej(err);
      }
    })
  });

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
  }

  public requestAndProcessResponse = async <T>(command, data?) => {
    this.$scope.response = undefined;
    try {
      let r = await this.$scope.request<T>(command, data);
      await this.applyIfNeeded(() => this.successResponse(r));
      return r;
    } catch (err) {
      await this.applyIfNeeded(() => this.errorResponse(err));
      err.__wsprocessed = true;
      throw err;
    }
  }

  private successResponse = (r) => {
    Tools.Debug.log("success response");
    this.$scope.response = r;
    this.logger.success(r.message, "Action completed");
    return r;
  }

  private errorResponse = (result) => {
    this.$scope.response = result;
    var httpFailed = result.httpFailed;
    this.logger.error(httpFailed[1], httpFailed[0]);
  }
  // TODO: Make this available on the root $scope ??
  public requestAndProcessCommand = <T>(command, pars?, message?) => this.processCommand<T>(() => this.$scope.request<T>(command, pars), message);
  private processCommand = async <T>(q: () => Promise<T>, message?): Promise<T> => {
    try {
      let result = await q();
      this.logger.success(message || "Saved", "Action completed");
      return result;
    } catch (reason) {
      this.httpFailed(reason);
      reason.__wsprocessed = true;
      throw reason;
    }
  }
  public breezeQueryFailed2 = (reason) => {
    this.logger.error(reason.message, "Query failed");
    this.$scope.first = true;
  };
  public breezeQueryFailed = (reason) => {
    this.breezeQueryFailed2(reason);
    return <any>null;
  }
  protected httpFailed = (reason) => {
    this.$scope.first = true;
    Tools.Debug.log("Reason:", reason);
    var msg = this.$scope.w6.api.errorMsg(reason);
    this.logger.error(msg[0], msg[1]);
  };

  public forward = (url, $window: ng.IWindowService, $location: ng.ILocationService) => this.forwardFull($location.protocol() + ":" + url);
  public forwardFull(fullUrl) {
    Tools.Debug.log("changing URL: " + fullUrl);
    return this.$scope.w6.navigate(fullUrl);
  }

  public processNames = (results: { name: string }[]) => results.map(x => { return { text: x.name, key: x.name } });
  public processNamesWithPrefix = (results: { name: string }[], prefix: string) => results.map(x => { return { text: prefix + x.name, key: prefix + x.name } });

  public getMenuItems(items: IMenuItem[], mainSegment: string, parentIsDefault?: boolean): IMenuItem[] {
    var menuItems = [];
    items.forEach(item => {
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

export interface IHaveModel<TModel> {
  model: TModel;
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



class AppModule extends Tk.Module {
  static $name = "AppModule";
  static $modules = [
    'constants', 'Components',
    'LocalStorageModule', 'ui.bootstrap',
    'ngCookies', 'ngAnimate', 'ngRoute', 'ngSanitize', 'remoteValidation',
    /* 'breeze.angular',  */
    'angularMoment', 'angularSpinner', 'ngTagsInput', 'infinite-scroll', 'ngDfp', 'angularFileUpload',
    'ui.bootstrap.tpls', 'ui.bootstrap.tabs', 'dialogs.main', 'ui', 'xeditable', 'commangular', //'ngClipboard',
    'ui-rangeSlider', 'ngFileUpload2', 'checklist-model', 'route-segment', 'view-segment', 'mgcrea.ngStrap.datepicker', 'angular-redactor',
    'Components.BytesFilter', 'Components.Debounce', 'Components.Pagedown',
    'Components.ReallyClick', 'Components.BackImg', 'Components.Comments', 'Components.AccountCard', 'nvd3ChartDirectives',
    'mgcrea.ngStrap.typeahead', 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.dropdown', 'mgcrea.ngStrap.popover', 'ui.bootstrap.collapse', 'mgcrea.ngStrap.affix',
    'ngPasswordStrength', 'mgcrea.ngStrap.helpers.debounce', 'truncate'
  ];

  static getModules() {
    if (Tools.env !== Tools.Environment.Production)
      return AppModule.$modules;

    return AppModule.$modules.concat(['angulartics', 'angulartics.google.analytics']);
  }

  constructor() {
    super('app', AppModule.getModules());

    this.app
      .factory('dbContext', () => Container.instance.get(W6Context))
      .factory('errorHandler', () => Container.instance.get(ErrorHandler))
      .factory('globalErrorHandler', () => Container.instance.get(GlobalErrorHandler))
      .factory('logger', () => Container.instance.get(ToastLogger))
      .factory('basketService', () => Container.instance.get(BasketService))
      .factory('aur.amountConverter', () => Container.instance.get(AmountValueConverter))
      .factory('aur.speedConverter', () => Container.instance.get(SpeedValueConverter))
      .factory('aur.sizeConverter', () => Container.instance.get(SizeValueConverter))
      .factory('aur.mediator', () => Container.instance.get(Mediator))
      .factory('aur.legacyMediator', () => Container.instance.get(LegacyMediator))
      .factory('aur.eventBus', () => Container.instance.get(EventAggregator))
      .factory('aur.client', () => Container.instance.get(Client))
      .factory('aur.features', () => Container.instance.get(FeatureToggles))
      .factory("$exceptionHandler", ['globalErrorHandler', (eh: GlobalErrorHandler) => (exception, cause) => eh.handleAngularError(exception, cause)])
      .config(['redactorOptions', redactorOptions => angular.copy(globalRedactorOptions, redactorOptions)])
      .config([
        '$httpProvider', $httpProvider => {
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
      .config(['$provide', function($provide) {
        $provide.decorator('ngClickDirective', ['$delegate', '$parse', 'errorHandler', function($delegate, $parse, errorHandler: ErrorHandler) {
          $delegate[0].compile = function($element, attr) {
            var fn = $parse(attr.ngClick, null, true);

            return function(scope: ng.IScope, element) {
              element.on('click', function(event) {
                let el = element[0];
                if (el.disabled) return;
                var result, d;
                try {
                  result = fn(scope, { $event: event });
                } catch (err) {
                  if (!err.__wsprocessed) errorHandler.handleError(err);
                  return;
                } finally {
                  scope.$evalAsync();
                }

                let isPromise = result != null && typeof result.then == 'function';
                if (!isPromise) return;

                el.disabled = true;

                let p: Promise<any> = result;
                function enable() { el.disabled = false; }
                p.then(enable, x => {
                  enable();
                  if (!x.__wsprocessed) errorHandler.handleError(x);
                }).then(_ => scope.$evalAsync());
              });
            };
          };
          return $delegate;
        }]);
      }])
      .run([
        'editableOptions', editableOptions => {
          editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        }
      ])
      .run([
        '$rootScope', 'w6', '$timeout', 'aur.legacyMediator', 'aur.features', ($rootScope: IRootScope, w6: W6, $timeout, legacyMediator: LegacyMediator, features: FeatureToggles) => {


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
          $rootScope.features = features;

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
          $rootScope.environment = w6.url.environment;
          $rootScope.toShortId = (id: string) => id.toShortId();
          $rootScope.sluggify = (str: string) => str.sluggify();
          $rootScope.sluggifyEntityName = (str: string) => str.sluggifyEntityName();
          $rootScope.dispatch = <T>(cq: string, data?) => legacyMediator.legacyRequest<T>(cq, data);
          $rootScope.request = <T>(cq, data?) => $rootScope.dispatch<T>(cq.$name, data);
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
            w6.url.cdn + '/**',
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

    if (Tools.env === Tools.Environment.Production) {
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
