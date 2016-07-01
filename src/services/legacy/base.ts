import {Tk} from './tk';
import {W6Context, IQueryResult} from '../w6context';
import breeze from 'breeze-client';
import {Tools} from '../tools';
import {W6, W6Urls} from '../withSIX';
import {Mediator} from 'aurelia-mediator';

export interface _Indexer<TModel> {
  [name: string]: TModel;
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

export interface Result<T> {
  result: T;
}

export interface IModel<TModel> {
  model: TModel;
}


export interface BooleanResult extends Result<boolean> {
}


export interface ICQWM<T> {
  //execute: any;
  $ModelType: T;
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

  public findBySlug = <T extends breeze.Entity>(type: string, slug: string, requestName: string) => this.processSingleResult<T>(this.context.executeQuery<T>(breeze.EntityQuery.from(type)
    .where("slug", breeze.FilterQueryOp.Equals, slug)
    .top(1), requestName));

  public executeKeyQuery = <T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> => this.processSingleResult<T>(this.context.executeKeyQuery<T>(query));

  processSingleResult = async <T extends breeze.Entity>(promise: Promise<IQueryResult<T>>) => {
    let result: IQueryResult<T>;
    try {
      result = await promise;
    } catch (failure) {
      let t = new Tools.NotFoundException("The server responded with 404", { status: 404, statusText: 'NotFound', body: {} });
      if (failure.status == 404) throw t;
      else throw failure;
    }
    if (result.results.length == 0) throw new Tools.NotFoundException("There were no results returned from the server", { status: 404, statusText: 'NotFound', body: {} });
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

export interface ITagKey {
  text: string;
  key: string;
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

  constructor(public $scope: IBaseScope, public logger /*: Components.Logger.ToastLogger */, public $q: ng.IQService) {
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
    Tools.Debug.log("success response");
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
    Tools.Debug.log("Reason:", reason);
    var msg = this.$scope.w6.api.errorMsg(reason);
    this.logger.error(msg[0], msg[1]);
  };

  public forward(url, $window: ng.IWindowService, $location: ng.ILocationService) {
    this.forwardFull($location.protocol() + ":" + url, $window, $location);
  }

  public forwardFull(fullUrl, $window: ng.IWindowService, $location: ng.ILocationService) {
    Tools.Debug.log("changing URL: " + fullUrl);
    this.$scope.w6.navigate(fullUrl);
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
