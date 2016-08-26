import { register } from './binder';

import breeze from 'breeze-client';

import {IBreezeMod, IBreezeUser, IBreezeCollection, IBreezeMission, IBreezeCollectionVersionDependency, IBreezePost, IBreezeModUpdate, IBreezeCollectionVersion, IBreezeGame, IBreezeAWSUploadPolicy,
  IBreezeMissionComment, IBreezeMissionVersion, IBreezeCollectionImageFileTransferPolicy, IBreezeModInfo,
  IBreezeCollectionComment, IBreezePostComment, AbstractDefs, BreezeInitialzation, IBreezeModUserGroup, IBreezeModComment, IBreezeModImageFileTransferPolicy,
  IBreezeModMediaItem, IUserInfo, Resource, Permission, Role,
  EntityExtends, BreezeEntityGraph, _IntDefs} from '../services/dtos';

import {LegacyMediator} from '../services/mediator';
import {ModHelper, CollectionHelper, MissionHelper} from '../services/helpers';

import {RestoreBasket, OpenCreateCollectionDialog, OpenAddModDialog, OpenAddModsToCollectionsDialog} from '../services/api';
import {ForkCollection} from '../features/profile/content/collection';
import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult, BooleanResult, Result} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {IRootScope, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, DbCommandBase, DbQueryBase, BaseController, BaseQueryController, DialogControllerBase, ModelDialogControllerBase } from './app-base'
import {ITagKey, ICreateComment, ICQWM, IModel, IMenuItem, IHandleCommentsScope} from '../services/legacy/base'
import { Publisher } from '../services/apis/lib';
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client, IClientInfo, ItemState} from 'withsix-sync-api';

import {IBasketItem, BasketItemType} from '../services/legacy/baskets';
import {BasketService} from '../services/basket-service';
import {ModsHelper, Helper} from '../services/legacy/misc';
import {ToastLogger} from '../services/legacy/logger';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';
import {joinUri} from '../helpers/utils/url'

import { OpenReportDialogQuery } from './components';

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
      this.startDownload(url, w6);
    }
  }

  static startDownload(url: string, w6: W6) {
    if (window.six_client == null || window.six_client.open_pws_uri == null) w6.navigate(url);
    else window.six_client.open_pws_uri(url);
  }
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

export interface IBaseGameScope extends IBaseScope {
  gameUrl: string;
  game: IBreezeGame;
  followedMods: {};
  followedMissions: {};
  subscribedCollections: {};
  openAddModDialog: (info?: { type?: string, folder?: string }) => void;
  clientInfo: IClientInfo;
  directDownload: (item: { id: string; }) => Promise<void>;
  directDownloadCollection: (item: IBreezeCollection) => Promise<void>; // { id: string; }
  getItemClass: (item: IBasketItem) => string;
  canAddToBasket: () => boolean;
  showBusyState: () => boolean;
  openAddCollectionDialog: () => any;
  addToCollections: (mod: IBreezeMod) => void;
  isActive: (mod: IBreezeMod) => boolean;
  abort: (mod: IBreezeMod) => void;
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

export interface IContentScope extends IBaseGameScope {
}

export interface IContentScopeT<TModel> extends IContentScope, IHaveModel<TModel> {
  header: IContentHeader;
  reportContent: () => void;
  editConfig?: IEditConfiguration<TModel>;
  trustedDescriptionFullHtml: string;
  callToAction: () => void;
  auModel;
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
    Tools.Debug.r.staging(() => {
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

    $scope.reportContent = async () => {
      // TODO: Tell to login if not logged in...
      if (this.$scope.w6.userInfo.id) {
        await this.$scope.request(OpenReportDialogQuery);
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
    this.updateAuModel();
  }

  protected updateAuModel() { }

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

    var saveChanges = async (...entities: breeze.Entity[]): Promise<boolean> => {
      var changedEntites: breeze.Entity[] = [];
      if (!entities || entities.length === 0) entities = (<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);
      entities.forEach((v, i, arr) => { if (!v.entityAspect.entityState.isUnchanged()) changedEntites.push(v) });
      try {
        await this.saveChanges(changedEntites);
        return true;
      } catch (reason) {
        var reasons = (<string>(<any>breeze).saveErrorMessageService.getErrorMessage(reason)).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "").replace(/[ ]\(\)[ ][-][ ]/g, ": ");
        this.breezeQueryFailed({ message: 'Save failed, See Validation Errors Below:<br/><br/>' + reasons });
        return false;
      }
    }

    var hasChanges = () => {
      var graph = <breeze.Entity[]>(<any>this.entityManager).getEntityGraph(this.$scope.model, graphExpands);
      return graph.some(v => v.entityAspect.entityState.isAddedModifiedOrDeleted())
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

    if (watchForChanges != null) watchForChanges.forEach((value, index, array) => normalChangeWatch.push(value));

    this.$scope.$watchGroup(normalChangeWatch, (newValue, oldValue, scope) =>
      this.$scope.editConfig.isEditing = ((this.$scope.editConfig.isManaging || this.$scope.editConfig.hasChanges()) && this.$scope.editConfig.canManage()) || (this.$scope.editConfig.canEdit() && this.$scope.editConfig.editMode)
    );

    this.$scope.$watch("editConfig.hasChanges()", (newValue: boolean, oldValue, scope) => {
      if (newValue == oldValue) return;

      this.$scope.editConfig.hasChangesProperty = newValue;

      if (newValue && !(this.$scope.editConfig.isEditing || this.$scope.editConfig.isManaging)) this.$scope.editConfig.enableEditing();
    });

    return _editConfig;
  };
  public editConfigDefaults: IEditConfiguration<TModel> = null;

  public setupContentHeader(model: TModel): IContentHeader { throw new Error("setupContentHeader not implemented!"); }

  async saveChanges(changedEntities?) {
    try {
      return await this.entityManager.saveChanges(changedEntities);
    } finally {
      this.applyIfNeeded();
    }
  }

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

    this.app
      .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
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

export const app = new PlayModule();
export function registerCQ(command) { register(() => app.registerCommand(command)); }
export function registerService(service) { register(() => app.app.service(service.$name, service)); }
export function registerController(controller) { register(() => app.app.controller(controller.$name, controller)); }

register(() => {
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
});

export class GetUsersQuery extends DbQueryBase {
  static $name = "GetUsers";

  public execute = [
    'query', (name: string) => {
      Tools.Debug.log("getting users, " + name);
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
  static $inject = ['dbContext', 'aur.legacyMediator'];

  constructor(context: W6Context, private m: LegacyMediator) {
    super(context);
  }

  public escapeIfNeeded(str) {
    if (str.indexOf(" ") != -1)
      return "\"" + str + "\"";
    return str;
  }

  public execute = [
    'query', (name: string) => {
      return this.m.legacyRequest(GetUsersQuery.$name, { query: name })
        .then(results => {
          var obj = [];
          angular.forEach(results, (user: any) => obj.push({ text: "user:" + this.escapeIfNeeded(user.displayName), key: "user:" + this.escapeIfNeeded(user.displayName) }));
          return obj;
        });
    }
  ];
}

registerCQ(GetUserTagsQuery);
