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

import { registerCQ, registerService, registerController, IContentScopeT, ContentModelController, IContentHeader, ContentDownloads, HelpItem, ContentController, IContentIndexScope, IEditConfiguration } from './play'
import { ForwardService } from './components';


export class GetMissionQuery extends DbQueryBase {
  static $name = 'GetMission';

  public execute = [
    'missionId', missionId => this.executeKeyQuery<IBreezeMission>(
      () => this.getEntityQueryFromShortId("Mission", missionId)
        .withParameters({ id: Tools.fromShortId(missionId) })
        .expand(['features', 'mediaItems']))
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
      var entity = <IBreezeMissionComment>this.context.createEntity("MissionComment", { missionId: model.contentId, authorId: this.context.w6.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
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
      return this.context.getCustom("missions/" + Tools.fromShortId(missionid) + "/edit", {});
    }
  ];
}

export class GetPublishMissionVersionQuery extends DbQueryBase {
  static $name = 'GetPublishMissionVersion';

  public execute = [
    'missionId', 'versionSlug',
    (missionId, versionSlug) => {
      Tools.Debug.log("getting publish mission version by id: " + missionId + ", and versionSlug: " + versionSlug);
      return this.context.getCustom("missions/" + Tools.fromShortId(missionId) + "/versions/" + versionSlug, {});
    }
  ];
}

export class NewMissionQuery extends DbQueryBase {
  static $name = 'NewMission';
  static $inject = ['dbContext'];

  // tODO: more flexible if we don't inject userInfo in the constructor, but from the router??
  constructor(context: W6Context) {
    super(context);
  }

  public execute = [
    () => {
      Tools.Debug.log("getting missions by author: " + this.context.w6.userInfo.slug);
      var query = breeze.EntityQuery.from("Missions")
        .where("author.slug", breeze.FilterQueryOp.Equals, this.context.w6.userInfo.slug)
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

  constructor(public $scope: IMissionScope, logger, $routeParams, $q, $sce, forwardService: ForwardService, private $timeout, $location: ng.ILocationService, localStorageService, w6, model: IBreezeMission) {
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

  protected updateAuModel() {
    // todo; call when going out of edit mode etc ?
    this.$scope.auModel = MissionHelper.convertOnlineMission(this.$scope.model, this.$scope.w6.activeGame, this.$scope.w6);
  }


  unfollow() {
    return this.requestAndProcessResponse(UnfollowMissionCommand, { model: this.$scope.model })
      .then(r => {
        this.applyIfNeeded(() => {
          delete this.$scope.followedMissions[this.$scope.model.id];
          this.$scope.model.followersCount -= 1;
        });
      });
  }

  follow() {
    return this.requestAndProcessResponse(FollowMissionCommand, { model: this.$scope.model })
      .then(r => {
        this.applyIfNeeded(() => {
          this.$scope.followedMissions[this.$scope.model.id] = true;
          this.$scope.model.followersCount += 1;
        });
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
      let r = $scope.request(CreateMissionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: $scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } });
      //WM<ICreateComment<IBreezeMissionComment>>
      newComment.message = "";
      return r;
    };
    this.$scope.deleteComment = comment => this.$scope.request(DeleteMissionCommentCommand, { model: comment });
    this.$scope.saveComment = comment => {
      Tools.Debug.log("Saving comment", comment);
      return this.$scope.request(SaveMissionCommentCommand, { model: comment });
    };
    this.$scope.reportComment = (comment) => { };

    if (this.$scope.environment != Tools.Environment.Production) {
      this.$scope.commentLikeStates = {};
      if (this.$scope.w6.userInfo.id) {
        this.$timeout(() => this.$scope.request(GetMissionCommentLikeStateQuery, { missionId: this.$scope.model.id })
          .then(results => this.subscriptionQuerySucceeded(results, this.$scope.commentLikeStates))
          .catch(this.breezeQueryFailed));
      }

      this.$scope.likeComment = comment => this.$scope.request(LikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
        this.applyIfNeeded(() => {
          comment.likesCount += 1;
          this.$scope.commentLikeStates[comment.id] = true;
        });
      });
      this.$scope.unlikeComment = comment => this.$scope.request(UnlikeMissionCommentCommand, { missionId: this.$scope.model.id, id: comment.id }).then(() => {
        this.applyIfNeeded(() => {
          comment.likesCount -= 1;
          this.$scope.commentLikeStates[comment.id] = false;
        });
      });
    }

    this.$timeout(() => this.$scope.request(GetMissionCommentsQuery, { missionId: this.$scope.model.id }));
  }

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
  static $inject = ['$scope', 'logger', '$routeParams', '$timeout', '$q', 'model'];

  constructor(public $scope: IUploadNewmissionScope, public logger, private $routeParams, private $timeout, $q, model) {
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
