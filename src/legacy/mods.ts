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

import { registerCQ, registerService, registerController, IContentScope, IContentScopeT, ContentModelController, IContentHeader, ContentDownloads, HelpItem, ContentController, IContentIndexScope, IEditConfiguration, GetUserTagsQuery, GetUsersQuery } from './play'

import { AddModDialogController, IModVersionInfo, GetCheckLinkQuery } from './games';
import { ForwardService, SendReportCommand } from './components';

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

  private cancel = () => this.$modalInstance.close();
  private reload = () => this.$scope.w6.reload();
  private showInformation = () => { this.$scope.stepOneInfo = true; };

  private ok = () => {
    return this.$scope.request<{ token; formatProvider; data }>(GetClaimQuery, { modId: this.$scope.model.id })
      .then((result) => {
        this.applyIfNeeded(() => {
          this.$scope.claimToken = result.token;
          this.$scope.formatProvider = result.formatProvider;
          this.$scope.ctModel = result.data;
          this.$scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page2.html';
        });
      })
      .catch(this.httpFailed);
  };

  private verifyToken = () => {
    this.$scope.verificationFailed = false;
    return this.$scope.request(VerifyClaimCommand, { modId: this.$scope.model.id })
      .then((result) => {
        this.applyIfNeeded(() => {
          this.$scope.page = '/src_legacy/app/play/mods/dialogs/_claim-page3.html';
          this.$scope.error = undefined;
        });
      })
      .catch((reason) => {
        this.applyIfNeeded(() => {
          this.httpFailed(reason);
          this.$scope.error = reason.data.message;
        });
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
            .then(result => result.result)
        }
      });
    }
  ];
}

export class GetForumPostQuery extends DbQueryBase {
  static $name = 'GetForumPost';
  public execute = ['forumUrl', forumUrl => this.context.getCustom('cool/forumPost', { params: { forumUrl: forumUrl }, requestName: 'getForumPost' })];
}

registerCQ(GetForumPostQuery);

export class GetModQuery extends DbQueryBase {
  static $name = 'GetMod';
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
      var entity = <IBreezeModComment>this.context.createEntity("ModComment", { modId: model.contentId, authorId: this.context.w6.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
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
  public execute = ['requestId', 'force', (requestId, force) => this.context.getCustom<BooleanResult>("cool/cancelUploadRequest", { requestName: 'cancelUploadRequest', params: { requestId: requestId, force: force } }).then(result => result.result)];
}

registerCQ(CancelUploadRequestQuery);

export class ApproveUploadRequestQuery extends DbCommandBase {
  static $name = 'ApproveUploadRequest';
  public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/approveUpload", { requestName: 'approveUpload', params: { requestId: requestId } }).then(result => result.result)];
}

registerCQ(ApproveUploadRequestQuery);

export class DenyUploadRequestQuery extends DbCommandBase {
  static $name = 'DenyUploadRequest';
  public execute = ['requestId', (requestId) => this.context.getCustom<BooleanResult>("cool/denyUpload", { requestName: 'denyUpload', params: { requestId: requestId } }).then(result => result.result)];
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
  public execute = ['data', data => this.context.getCustom<{}>("mods/get-mod-info?downloadUri=" + data.downloadUri)]
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


export class ModNameExistsQuery extends DbQueryBase {
  static $name = "ModNameExists";
  public execute = [
    'name', 'gameId', 'authorId', (name, gameId, authorId) => {
      if (!name || name.length == 0) return false;
      return <any>this.context.getCustom<BooleanResult>("mods/package-name-exists", { params: { name, gameId, authorId } })
        .then(result => result.result);
    }
  ];
}

registerCQ(ModNameExistsQuery);

export class ModExistsQuery extends DbQueryBase {
  static $name = "ModExists";
  public execute = [
    'packageName', 'gameId', 'groupId', (packageName, gameId, groupId) => {
      if (!packageName || packageName.length == 0) return false;
      let p = <any>{ packageName, gameId };
      if (groupId) p.groupId = groupId;
      return <any>this.context.getCustom<BooleanResult>("mods/package-name-exists", { params: p })
        .then(result => result.result);
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
  static $inject = ['dbContext', 'aur.legacyMediator'];

  constructor(context: W6Context, private m: LegacyMediator) {
    super(context);
  }

  public escapeIfNeeded(str) {
    return str.indexOf(" ") != -1 ? "\"" + str + "\"" : str;
  }

  public execute = [
    'query', 'gameSlug', (name: string, gameSlug: string) => {
      if (gameSlug == null) return this.m.legacyRequest(GetUserTagsQuery.$name, { query: name });

      return Promise.all([
        this.m.legacyRequest(GetUsersQuery.$name, { query: name }), this.context.executeQuery(breeze.EntityQuery.from("ModsByGame")
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
    'dbContext', '$location', 'localStorageService', 'w6', '$popover', '$rootScope', 'basketService', 'model', 'aur.eventBus'];

  constructor(public $scope: IModScope, logger, $routeParams, $q, private $parse: ng.IParseService, forwardService: ForwardService,
    private $sce: ng.ISCEService, private $timeout: ng.ITimeoutService,
    private uploadService: W6Context, $location: ng.ILocationService,
    localStorageService, w6, private $popover, $rootScope,
    basketService: BasketService, model: IBreezeMod, private eventBus: EventAggregator) {
    super($scope, logger, $routeParams, $q, $sce, model);
    let routeGameSlug = $routeParams.gameSlug.toLowerCase();
    let modGameSlug = model.game.slug.toLowerCase();
    if (routeGameSlug != modGameSlug && !(routeGameSlug == 'arma-3' && modGameSlug == 'arma-2')) {
      forwardService.forward(joinUri([$scope.url.play, model.game.slug, "mods", model.id.toShortId(), model.slug]));
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

    //$scope.openLoginDialog = () => $scope.request(OpenLoginDialogQuery);
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
    $scope.getForumPost = (descriptionEditor) => this.requestAndProcessCommand<{ body }>(GetForumPostQuery, { forumUrl: model.homepageUrl }, "fetch first post") // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
      .then(r => {
        // grr jquery in controller
        descriptionEditor.$show();
        $timeout(() => {
          var redactor = $("textarea[redactor]").first().redactor("core.getObject");
          // import in editor:
          redactor.selection.selectAll();
          redactor.insert.html(r.body, false);
          //model.descriptionFull = r.body;
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

  protected updateAuModel() {
    // todo; call when going out of edit mode etc ?
    this.$scope.auModel = ModHelper.convertOnlineMod(this.$scope.model, this.$scope.w6.activeGame, this.$scope.w6);
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

      var newQuery = this.$scope.request<any[]>(GetUsersQuery, { query: (typeof query == 'string' || <any>query instanceof String) ? query : query.displayName })
        .catch(this.breezeQueryFailed).then(r => {
          // breeze objects cause deep reference stackoverflow because of circular references, so we shape the objects
          // into just the vm properties we need fr the view. Which is a good practice in general..
          // UPDATE: Even shaped objects have problems when they are extended off EntityExtends.User... So now just building the objectg manually ;S
          authors = r;
          var authorVms = [];
          authors.forEach(x => {
            let user = { displayName: x.displayName, id: x.id, avatarURL: x.avatarURL, hasAvatar: x.hasAvatar, avatarUpdatedAt: x.avatarUpdatedAt, getAvatarUrl: null, _avatars: [] };
            user.
              getAvatarUrl = (size) => user._avatars[size] || (user._avatars[size] = this.$scope.w6.url.calculateAvatarUrl(<any>this, size));
            authorVms.push(user);
          });
          return authorVms;
        });

      currentQuery = newQuery;

      return currentQuery;
    };

    this.$scope.setAuthor = async (newAuthor: IBreezeUser) => {
      var author = authors.find(x => x.id === newAuthor.id);
      this.$scope.model.author = author;
      if (!this.$scope.editConfig.isEditing && !this.$scope.editConfig.isManaging)
        await this.$scope.editConfig.saveChanges();
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
    this.$scope.openUploadVersionDialog = async () => {
      if (isUploading(getCurrentChange())) {
        this.logger.error("The mod is currently processing a change, please wait until it finishes.");
        return;
      }
      await this.$scope.request(GetModUpdatesQuery, { modId: this.$scope.model.id });
      await this.$scope.request(OpenModUploadDialogQuery, { model: this.$scope.model, info: "download" });
    };
    this.$scope.openVersionHistoryDialog = () => this.$scope.request(ModVersionHistoryDialogQuery, { model: this.$scope.model });
    this.$scope.openAddModDialog = (info = { type: "download", folder: "" }) => this.eventBus.publish(new OpenAddModDialog(this.$scope.model.game, info));

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

    this.$scope.isUploading = () => isUploading(getCurrentChange());

    this.$scope.requiresApproval = (update: IBreezeModUpdate): boolean => {
      if (update == null)
        return false;
      let state = getState(update.currentState);
      return this.requiresApproval(state);
    };

    $scope.approving = false;

    this.$scope.approveUpload = async (update: IBreezeModUpdate) => {
      $scope.approving = true;
      if (!$scope.editConfig.canManage()) {
        this.logger.error("Only management can approve an upload.");
        $scope.approving = false;
        return;
      }
      await $scope.request(ApproveUploadRequestQuery, { requestId: getCurrentChange().id })
        .then(async (result) => {
          setTimeout(() => $scope.approving = false, 1000 * 2);
          await $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
        }).catch(async (reason) => {
          this.applyIfNeeded(() => {
            $scope.approving = false;
            this.httpFailed(reason);
          });
          await $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
        });
    };
    this.$scope.denyUpload = async (update: IBreezeModUpdate) => {
      $scope.approving = true;
      if (!$scope.editConfig.canManage()) {
        this.logger.error("Only management can deny an upload.");
        $scope.approving = false;
        return;
      }
      await $scope.request(DenyUploadRequestQuery, { requestId: getCurrentChange().id })
        .then(async (result) => {
          setTimeout(() => $scope.approving = false, 1000 * 2);
          await $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
        }).catch(async (reason) => {
          this.applyIfNeeded(() => {
            $scope.approving = false;
          });
          await $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
          this.httpFailed(reason);
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

    this.$scope.cancelUpload = async (force: boolean = false) => {
      if ($scope.confirmCancel || $scope.confirmAbandon) {
        setCancelState(true, force);
        setCancelConfirmState(false, force);
        await $scope.request(CancelUploadRequestQuery, { requestId: getCurrentChange().id, force: force })
          .then((result) => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            setTimeout(() => {
              this.applyIfNeeded(() => {
                setCancelConfirmState(false, force);
                setCancelState(false, force);
              });
            }, 1000 * 2);
          }).catch(reason => {
            $scope.request(GetModUpdatesQuery, { modId: $scope.model.id });
            setTimeout(() => {
              this.applyIfNeeded(() => {
                setCancelConfirmState(false, force);
                setCancelState(false, force);
              });
            }, 1000 * 2);
            this.httpFailed(reason);
          });
      } else {
        setCancelConfirmState(true, force);
        setTimeout(() => setCancelConfirmState(false, force), 5000);
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

  private async cancelImageUpload() {
    this.tempModImagePath = null;
    if (this.$scope.model.fileTransferPolicies.length > 0) {
      var transferPolicy = this.$scope.model.fileTransferPolicies[0];

      transferPolicy.entityAspect.setDeleted();
      await this.$scope.editConfig.saveChanges(transferPolicy);
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
    $scope.getCategories = (query) => this.$scope.request<{ name }[]>(GetCategoriesQuery, { query: query })
      .then((d) => this.processNames(d))
      .catch(this.breezeQueryFailed);
  }

  private async newLogoUploadRequest(file: File, $event: any) {
    //if ($scope.model.imageFileTransferPolicy) {
    //    throw Error("An Upload Request already exists.");
    //}
    if (file == null)
      return;

    if (this.$scope.uploadingModImage) {
      this.logger.error("You are already uploading an image! Please wait!");
      return;
    }

    if (file.name.endsWithIgnoreCase(".gif")) {
      this.logger.error("You are unable to upload gifs for your mod logo.");
      return;
    }

    this.$scope.uploadingModImage = true;

    var uploadRequest = BreezeEntityGraph.ModImageFileTransferPolicy.createEntity({
      path: file.name,
      modId: this.$scope.model.id
    });

    var fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = e => {
      this.$timeout(() => {
        if (this.$scope.uploadingModImage)
          this.tempModImagePath = (<any>e.target).result;
      });
    };

    try {
      let result = await this.saveChanges([uploadRequest])
      Tools.Debug.log(result, uploadRequest, this.$scope.model.fileTransferPolicies);
      await this.uploadLogo(file, uploadRequest);
    } catch (reason) {
      Tools.Debug.log("Failure", reason);
      this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
      this.cancelImageUpload();
    } finally {
      this.applyIfNeeded(_ => this.$scope.uploadingModImage = false)
    }
  }

  async saveChanges(changedEntities?) {
    try {
      return await this.entityManager.saveChanges(changedEntities);
    } finally {
      this.applyIfNeeded();
    }
  }

  private async newRemoteLogoUploadRequest(file: string, $event: any) {
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
    try {
      let result = await this.saveChanges([uploadRequest]);
      Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
      this.uploadRemoteLogo(file, uploadRequest);
    } catch (reason) {
      Tools.Debug.log("Failure", reason);
      this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
      this.cancelImageUpload();
    } finally {
      this.applyIfNeeded(_ => $scope.uploadingModImage = false);
    }
  }

  private async uploadLogo(file: File, policy: IBreezeModImageFileTransferPolicy) {
    try {
      let r = await this.uploadService.uploadToAmazonWithPolicy(file, policy.uploadPolicy)
      Tools.Debug.log(r);

      this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
      policy.uploaded = true;
    } catch (r) {
      Tools.Debug.log(r);

      this.cancelImageUpload();
      let data = await r.text();
      if (data.includes("EntityTooLarge")) this.logger.error("Your image can not be larger than 5MB", "Image too large");
      if (data.includes("EntityTooSmall")) this.logger.error("Your image must be at least 10KB", "Image too small");
      throw r;
    } finally {
      this.applyIfNeeded(_ => this.$scope.uploadingModImage = false);
    }
  }

  private uploadRemoteLogo(file: string, policy: IBreezeModImageFileTransferPolicy) {
    this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
    policy.uploaded = true;
    this.$scope.uploadingModImage = false;
  }

  unfollow() {
    this.requestAndProcessResponse(UnfollowModCommand, { model: this.$scope.model })
      .then(r => {
        this.applyIfNeeded(() => {
          delete this.$scope.followedMods[this.$scope.model.id];
          this.$scope.model.followersCount -= 1;
        });
      });
  }

  follow() {
    this.requestAndProcessResponse(FollowModCommand, { model: this.$scope.model })
      .then(r => {
        this.applyIfNeeded(() => {
          this.$scope.followedMods[this.$scope.model.id] = true;
          this.$scope.model.followersCount += 1;
        });
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
  openSteamInfo: () => void;
  externalInfo: { forumUrl?: string; steamInfo; gitHubRepo?: string; armaholicUrl?: string }
  galleryInfo: { description?: string; avatar?: string }
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
    $scope.galleryInfo = {
      description: $scope.model.descriptionFull,
      avatar: $scope.header.getAvatar($scope.w6.imageSizes.bigRectangle.w, $scope.w6.imageSizes.bigRectangle.h)
    }
    this.setupClaiming();
    this.setupStatistics();
    this.setupDependencyAutoComplete();

    this.setupTitle("model.name", "Info - {0} (" + $scope.model.packageName + ") - " + $scope.model.game.name);
    if (this.$scope.features.steam)
      this.handleApis();
  }

  handleApis() {
    let externalInfo = <any>{};
    this.$scope.model.publishers.forEach(x => {
      switch (x.publisherType) {
        case Publisher[Publisher.Armaholic]:
          externalInfo.armaholicUrl = `http://www.armaholic.com/page.php?id=${x.publisherId}`;
          break;
        case Publisher[Publisher.BiForums]:
          externalInfo.forumUrl = `https://forums.bistudio.com/topic/${x.publisherId}-mod`;
          break;
        case Publisher[Publisher.BiForumsClassic]:
          // Modern url takes precedence
          if (!externalInfo.forumUrl) externalInfo.forumUrl = `http://forums.bistudio.com/showthread.php?${x.publisherId}-mod`;
          break;
        case Publisher[Publisher.Steam]:
          externalInfo.steamInfo = { id: this.$scope.model.id, name: this.$scope.model.name, steamId: x.publisherId }
          break;
        case Publisher[Publisher.GitHub]:
          externalInfo.gitHubRepo = x.publisherId;
          break;
      }
    })

    if (!externalInfo.forumUrl) {
      let hp = this.$scope.model.homepageUrl;
      if (hp && (hp.startsWith("http://forums.bistudio.com/") || hp.startsWith("https://forums.bistudio.com/"))) {
        externalInfo.forumUrl = hp;
      }
    }
    this.$scope.externalInfo = externalInfo;
  }

  private setupComments(mod: IBreezeMod) {
    this.$scope.addComment = newComment => {
      Tools.Debug.log('Add new comment', newComment);
      var r = this.$scope.request<ICreateComment<IBreezeModComment>>(CreateModCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => this.breezeQueryFailed(x));
      newComment.message = "";
      newComment.valueOf = false;
      return r;
    };
    this.$scope.deleteComment = comment => this.$scope.request(DeleteModCommentCommand, { model: comment }).catch(x => this.breezeQueryFailed(x)),
      this.$scope.saveComment = comment => {
        Tools.Debug.log("Saving comment", comment);
        return this.$scope.request(SaveModCommentCommand, { model: comment }).catch(x => this.breezeQueryFailed(x));
      };
    this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
    if (this.$scope.environment != Tools.Environment.Production) {
      this.$scope.commentLikeStates = {};
      if (this.$scope.w6.userInfo.id) {
        this.$timeout(() => this.$scope.request(GetModCommentLikeStateQuery, { modId: this.$scope.model.id })
          .then(results => this.subscriptionQuerySucceeded(results, this.$scope.commentLikeStates))
          .catch(this.breezeQueryFailed));
      }

      this.$scope.likeComment = comment => this.$scope.request(LikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
        this.applyIfNeeded(() => {
          comment.likesCount += 1;
          this.$scope.commentLikeStates[comment.id] = true;
        });
      });
      this.$scope.unlikeComment = comment => this.$scope.request(UnlikeModCommentCommand, { modId: this.$scope.model.id, id: comment.id }).then(() => {
        this.applyIfNeeded(() => {
          comment.likesCount -= 1;
          this.$scope.commentLikeStates[comment.id] = false;
        });
      });
    }

    this.$timeout(() => this.$scope.request(GetModCommentsQuery, { modId: this.$scope.model.id }));
  }

  private setupClaiming() { this.$scope.openClaimDialog = () => this.$scope.request(OpenClaimDialogQuery, { gameSlug: this.$routeParams.gameSlug, modId: this.$routeParams.modId }); }

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
    this.$scope.getDependencies = (query) => this.$scope.request(GetModTagsQuery, { gameId: this.$scope.game.id, query: query })
      .then((d) => this.processModNames(d))
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

    $scope.sendReport = () => this.requestAndProcessCommand(SendReportCommand, { data: $scope.model }, "Report sent!")
      .then((data) => this.applyIfNeeded(() => $scope.sent = true));
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
    $scope.setArchivedStatus = async (archive: boolean) => {
      var shouldSave = !model.editConfig.isEditing && !model.editConfig.isManaging;
      if (archive) {
        model.model.archivedAt = new Date();
      } else {
        model.model.archivedAt = null;
      }
      if (shouldSave) {
        this.$modalInstance.close();
        await model.editConfig.saveChanges();
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
  static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'info', 'aur.client', 'dbContext'];

  constructor(public $scope: IUploadVersionDialogScope, public logger: ToastLogger, $modalInstance, $q, model: IBreezeMod, info: string, private modInfoService, private dbContext: W6Context) {
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

    $scope.branches = AddModDialogController.branches;
    $scope.hints = AddModDialogController.hints;
    $scope.inlineHints = AddModDialogController.inlineHints;
    $scope.versionPattern = AddModDialogController.versionPattern;
    $scope.validateVersion = this.validateVersion;

    $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
      if (newValue != oldValue && newValue != null && newValue != "")
        this.checkDownloadLink(newValue);
    });

    // TODO: Handle not connected handler??
    if (this.$scope.w6.miniClient.isConnected) {
      this.modInfoService.getUploadFolder(model.id)
        .then(x => this.applyIfNeeded(() => $scope.model.info.folder = x))
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
    this.$scope.request<IModVersionInfo>(GetLatestInfo, { data: { downloadUri: model.mod.download } }).then(r => {
      this.applyIfNeeded(() => {
        model.mod.version = r.version;
        model.mod.branch = r.branch;
      });
    });
  }

  checkDownloadLink(uri: string) {
    this.$scope.checkingDownloadLink = true;
    this.$scope.model.downloadLinkAvailable = false;
    this.$scope.request<boolean>(GetCheckLinkQuery, { linkToCheck: uri })
      .then((result) => {
        this.applyIfNeeded(() => {
          this.$scope.checkingDownloadLink = false;
          Tools.Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result;
        });
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

    return this.$scope.request(NewModVersionCommand, { data: this.$scope.model.mod })
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

  constructor(public $scope: IModVersionHistoryDialogScope, public logger: ToastLogger, $modalInstance, $q, model: IBreezeMod) {
    super($scope, logger, $modalInstance, $q, model);

    $scope.cancel = this.cancel;
    $scope.ok = this.ok;
    $scope.model = model;
    $scope.updates = model.updates.asEnumerable().orderByDescending(x => x, ModsHelper.versionCompare).toArray();
  }

  private cancel = () => this.$modalInstance.close();
  private ok = () => this.$modalInstance.close();
}

registerController(ModVersionHistoryDialogController);
