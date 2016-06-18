import breeze from 'breeze-client';

import {IBreezeMod, IBreezeUser, IBreezeCollection, IBreezeMission, IBreezeCollectionVersionDependency, IBreezePost, IBreezeModUpdate, IBreezeCollectionVersion, IBreezeGame, IBreezeAWSUploadPolicy,
  IBreezeMissionComment, IBreezeMissionVersion, IBreezeCollectionImageFileTransferPolicy, IBreezeModInfo,
  IBreezeCollectionComment, IBreezePostComment, AbstractDefs, BreezeInitialzation, IBreezeModUserGroup, IBreezeModComment, IBreezeModImageFileTransferPolicy,
  IBreezeModMediaItem, IUserInfo, Resource, Permission, Role,
  EntityExtends, BreezeEntityGraph, _IntDefs} from '../services/dtos';
import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, W6ContextWrapper, IQueryResult} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {IRootScope, ITagKey, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, ICreateComment, ICQWM, IModel, DbCommandBase, DbQueryBase, BaseController, BaseQueryController,
  IMenuItem, ModelDialogControllerBase, DialogControllerBase, Result, BooleanResult, IHandleCommentsScope} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';

import {Components} from './components';

import {registerService, registerCommands, registerCQ, registerController, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';


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
  clientInfo: Components.ModInfo.IClientInfo;
  directDownload: (item: { id: string; }) => Promise<void>;
  directDownloadCollection: (item: IBreezeCollection) => Promise<void>; // { id: string; }
  getItemClass: (item: Components.Basket.IBasketItem) => string;
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

export interface IGameScope extends IBaseScopeT<IBreezeGame>, IBaseGameScope { }

export interface IContentScope extends IBaseGameScope {
}

export interface IContentScopeT<TModel> extends IContentScope, IHaveModel<TModel> {
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



export module Play {
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

export module Play.Collections {
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

    constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q, $sce: ng.ISCEService, private localStorageService, private w6: W6, private forwardService: Components.ForwardService, private $timeout: ng.ITimeoutService, private uploadService: Components.Upload.UploadService, private $popover, $rootScope: IRootScope, basketService: Components.Basket.BasketService, eventBus: EventAggregator, private mediator, model: IBreezeCollection) {
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

        Tools.Debug.log("handlepreferredclient: ", newValue);
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
          Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Tools.Debug.log("Failure", reason);
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
          Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadRemoteLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Tools.Debug.log("Failure", reason);
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
          Tools.Debug.log(data, status, headers, config);

          this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
          policy.uploaded = true;
          $scope.uploadingCollectionImage = false;
        }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Tools.Debug.log(data, status, headers, config);
          Tools.Debug.log("Failure");

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
        Tools.Debug.log('Add new comment', newComment);

        var r = this.$scope.requestWM<ICreateComment<IBreezeCollectionComment>>(CreateCollectionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
        newComment.message = "";
        newComment.valueOf = false;

        return r;
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteCollectionCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
        this.$scope.saveComment = comment => {
          Tools.Debug.log("Saving comment", comment);
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
        Tools.Debug.log("getting collectioncomments by id: " + collectionId.toString());
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
        Tools.Debug.log('Delete comment', model);
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

export module Play.Games {
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
          Tools.Debug.log(result);
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
          Tools.Debug.log(result);
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
      Tools.Debug.log(model);

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
          Tools.Debug.log(result);
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
          Tools.Debug.log(result);
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
        Tools.Debug.log(this.$modal);
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

        Tools.Debug.log(this.$modal);
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

  import ClientInfo = Components.ModInfo.IClientInfo;
  import ItemState = Components.ModInfo.ItemState;
  import BasketService = Components.Basket.BasketService;

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

export module Play.Missions {

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
        Tools.Debug.log("getting missioncomments by id: " + missionId.toString());
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
        Tools.Debug.log(model);
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
        Tools.Debug.log("getting edit mission by id: " + missionid.toString());
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
        Tools.Debug.log("getting publish mission version by id: " + missionId + ", and versionSlug: " + versionSlug);
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
        Tools.Debug.log("getting missions by author: " + this.userInfo.slug);
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
      Tools.Debug.log("updateFileInfo", files);
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

      if (Tools.debug) {
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
        Tools.Debug.log('Add new comment', newComment);
        $scope.request(CreateMissionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: $scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } });
        //WM<ICreateComment<IBreezeMissionComment>>
        newComment.message = "";
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteMissionCommentCommand, { model: comment });
      this.$scope.saveComment = comment => {
        Tools.Debug.log("Saving comment", comment);
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
      Tools.Debug.log("updateFileInfo", files);
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
      Tools.Debug.log("updateFileInfo", files);
      this.$scope.mission.files = files;
    };
    public submit = () => {
      this.requestAndProcessResponse(UploadNewMissionVersionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), files: this.$scope.mission.files });
    };
  }

  registerController(UploadNewversionController);
}
export module Play.Mods {
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
        Tools.Debug.log("getting mod by id: " + modId);
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
        Tools.Debug.log("getting modcomments by id: " + modId.toString());
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
          Tools.Debug.log("info", info);
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
        Tools.Debug.log("getting modupdates by id: " + modId.toString());
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
        if (Tools.debug) Tools.Debug.log(data, editData);
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
        Tools.Debug.log('Delete comment', model);
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
        Tools.Debug.log("getting mods by game: " + gameId + ", " + name);

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
        Tools.Debug.log("getting mods by user: " + userSlug + ", " + name);

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
        Tools.Debug.log("getting mod tags, " + name);
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

      //$scope.openLoginDialog = () => $scope.request(Components.Dialogs.OpenLoginDialogQuery);
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

      if (this.$scope.environment != Tools.Environment.Production) {
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
          Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Tools.Debug.log("Failure", reason);
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
          Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
          this.uploadRemoteLogo(file, uploadRequest);
          return;
        }).catch((reason) => {
          Tools.Debug.log("Failure", reason);
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
          Tools.Debug.log(data, status, headers, config);

          this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
          policy.uploaded = true;
          $scope.uploadingModImage = false;
        }).error((data: string, status: number, headers: (headerName: string) => string, config: ng.IRequestConfig) => {
          Tools.Debug.log(data, status, headers, config);
          Tools.Debug.log("Failure");

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
        Tools.Debug.log('Add new comment', newComment);
        var r = this.$scope.requestWM<ICreateComment<IBreezeModComment>>(CreateModCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => { this.breezeQueryFailed(x); });
        newComment.message = "";
        newComment.valueOf = false;
        return r;
      };
      this.$scope.deleteComment = comment => this.$scope.request(DeleteModCommentCommand, { model: comment }).catch(x => { this.breezeQueryFailed(x); }),
        this.$scope.saveComment = comment => {
          Tools.Debug.log("Saving comment", comment);
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
      Tools.Debug.log("SCOPE: ", $scope);
      //this.$timeout(() => this.$scope.request(GetModCreditsQuery, { modId: this.$scope.model.id }));
    }

    addGroup = (name: string): void => {
      var group = BreezeEntityGraph.ModUserGroup.createEntity(this.entityManager, {
        name: name
      });
      this.$scope.model.userGroups.push(group);
      this.$timeout(() => {
        (<any>$("#" + group.id)[0]).scrollIntoViewIfNeeded();
        Tools.Debug.log($("#" + group.id + "-title"));
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
      Tools.Debug.log("Scope: ", $scope);
      $scope.createBlogPost = false;
      /*
      Tools.Debug.log(<any>BreezeEntityGraph.AccountWall.$name);

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
        Tools.Debug.log(a);
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

      $scope.sendReport = () => this.processCommand($scope.request(Components.Dialogs.SendReportCommand, { data: $scope.model }, "Report sent!")
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
          Tools.Debug.log(result);
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
}
