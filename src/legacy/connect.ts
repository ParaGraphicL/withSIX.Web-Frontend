import breeze from 'breeze-client';

import {IBreezeMod, IBreezeUser, IBreezeCollection, IBreezeMission, IBreezeCollectionVersionDependency, IBreezePost, IBreezeModUpdate, IBreezeCollectionVersion, IBreezeGame, IBreezeAWSUploadPolicy,
  IBreezeMissionComment, IBreezeMissionVersion, IBreezeCollectionImageFileTransferPolicy, IBreezeModInfo,
  IBreezeCollectionComment, IBreezePostComment, AbstractDefs, BreezeInitialzation, IBreezeModUserGroup, IBreezeModComment, IBreezeModImageFileTransferPolicy,
  IBreezeModMediaItem, IUserInfo, Resource, Permission, Role,
  EntityExtends, BreezeEntityGraph, _IntDefs} from '../services/dtos';
import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {IRootScope, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, DbCommandBase, DbQueryBase, BaseController, BaseQueryController } from './app-base'
import {ITagKey, ICreateComment, ICQWM, IModel, IMenuItem} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';

import { ReportDialogController, ForwardService, OpenForgotPasswordDialogQuery, ResendActivationCommand, ForgotPasswordCommand, ForgotUsernameCommand, RegisterCommand } from './components';
import {ToastLogger} from '../services/legacy/logger';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';

declare var Fingerprint;

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
              controller: ReportDialogController,
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
              resolve: setupQuery(GetMeSettingsPersonalQuery),
            }).segment('avatar', {
              templateUrl: '/src_legacy/app/connect/me/settings/avatar.html',
              controller: 'MeSettingsAvatarController',
              resolve: setupQuery(GetMeSettingsAvatarQuery),
            }).segment('credentials', {
              templateUrl: '/src_legacy/app/connect/me/settings/credentials.html',
              controller: 'MeSettingsCredentialsController',
              resolve: setupQuery(GetMeSettingsCredentialsQuery),
            }).segment('premium', {
              templateUrl: '/src_legacy/app/connect/me/settings/premium.html',
              controller: 'MeSettingsPremiumController',
              resolve: setupQuery(GetMeSettingsPremiumQuery),
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
              resolve: setupQuery(GetMeBlogQuery),
            }).segment('create', {
              templateUrl: '/src_legacy/app/connect/me/blog/create.html',
              controller: 'MeBlogCreateController',
            }).segment('edit', {
              templateUrl: '/src_legacy/app/connect/me/blog/edit.html',
              controller: 'MeBlogEditController',
              resolve: setupQuery(GetMeBlogPostQuery),
            });

          me.segment('friends', {
            templateUrl: '/src_legacy/app/connect/me/friends.html',
            controller: 'MeFriendsController',
            resolve: setupQuery(GetMeFriendsQuery),
          });

          me.segment('messages', {
            templateUrl: '/src_legacy/app/connect/me/messages.html',
          }).within()
            .segment('list', {
              default: true,
              controller: 'MeMessagesController',
              templateUrl: '/src_legacy/app/connect/me/messages-list.html',
              resolve: setupQuery(GetMeMessagesQuery)
            })
            .segment('user', {
              templateUrl: '/src_legacy/app/connect/profile/messages.html',
              controller: 'MeUserMessagesController',
              resolve: setupQuery(GetMeUserMessagesQuery),
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
              resolve: setupQuery(GetProfileQuery),
            })
            .within();

          profile.segment('content', { default: true })
            .within()
            .segment('aurelia', {});

          profile.segment('blog', {
            templateUrl: '/src_legacy/app/connect/profile/blogposts.html',
            controller: 'ProfileBlogController',
            resolve: setupQuery(GetProfileBlogQuery),
          });

          profile.segment('friends', {
            templateUrl: '/src_legacy/app/connect/profile/friends.html',
            controller: 'ProfileFriendsController',
            resolve: setupQuery(GetProfileFriendsQuery),
          });
          profile.segment('messages', {
            templateUrl: '/src_legacy/app/connect/profile/messages.html',
            controller: 'ProfileMessagesController',
            resolve: setupQuery(GetProfileMessagesQuery),
          });
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

const app = new ConnectModule();

export function registerCQ(command) { app.registerCommand(command); }

export function registerService(service) { app.app.service(service.$name, service); }

export function registerController(controller) { app.app.controller(controller.$name, controller); }

// Fail Test code:
// public execute = ['$q', (q: ng.IQService) => q.reject("ouch!")]
// public execute = ['$q', (q: ng.IQService) => q.reject({data: { message: "woopsydaisy" }, statusText: "statusText", status: 666})]
export class MeQueryBase extends DbQueryBase {
  private getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }

  public getMeData(resource?) { return this.context.getCustom(this.getMeUrl(resource)); }
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

  public postMeData(resource?, data?, requestName?) { return this.context.postCustom(this.getMeUrl(resource), data, { requestName: requestName }); }

  public deleteMeData(resource?, requestName?, params?) { return this.context.deleteCustom(this.getMeUrl(resource), { requestName: requestName, params: params }); }
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

  constructor(public $scope: IMeScope, public logger, forwardService: ForwardService, $q) {
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

    menuItems.push({ header: "Premium", segment: "premium", url: $scope.w6.userInfo.isPremium ? '/me/settings/premium' : '/gopremium', icon: "icon withSIX-icon-Badge-Sponsor", cls: "premium" });

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
      .then((data) => this.applyIfNeeded(() => {
        form.$setPristine();
        $scope.$emit('myNameChanged', { firstName: $scope.model.firstName, lastName: $scope.model.lastName })
      }));
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
      .then((result) => this.applyIfNeeded(() => form.$setPristine()));
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
          .then((result) => this.$scope.w6.reload());
      else
        return this.requestAndProcessResponse(SaveMeSettingsEmailCredentialsCommand, { data: $scope.model })
          .then((result) => this.$scope.w6.reload());
    };

    // TODO: Second controller
    $scope.saveOther = form => this.requestAndProcessResponse(SaveMeSettingsCredentialsOtherCommand, { data: $scope.modelOther })
      .then((result) => this.applyIfNeeded(() => form.$setPristine()));

    $scope.connectExternal = system =>
      this.forward($scope.url.connect + "/login/" + system + "?connect=true&fingerprint=" + new Fingerprint().get() + ($scope.model.rememberMe ? "&rememberme=true" : ""), $window, $location);

    $scope.openForgotPasswordDialog = () => $scope.request(OpenForgotPasswordDialogQuery, { email: $scope.model.email });
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

    $scope.uploadAvatar = (form) => this.requestAndProcessResponse(SaveMeSettingsAvatarCommand, { file: $scope.files[0] })
      .then((data) => this.avatarUploaded(data, form));
  }

  private avatarCleared = (data) => this.applyIfNeeded(() => {
    this.$scope.model.hasAvatar = false;
    this.avatarChanged();
  });
  private avatarUploaded = (data, form) => this.applyIfNeeded(() => {
    (<HTMLFormElement>document.forms[form.$name]).reset();
    this.$scope.files = [];
    this.$scope.model.hasAvatar = true;
    this.$scope.model.avatarURL = this.$scope.url.contentCdn + "/account/" + this.$scope.w6.userInfo.id + "/profile/avatar/";
    this.$scope.model.avatarUpdatedAt = new Date().toISOString();
    this.avatarChanged();
  });

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

    $scope.accept = (friendRequest) => this.requestAndProcessCommand(AcceptFriendRequestCommand, { friendId: friendRequest.sender.id })
      .then((data) => this.applyIfNeeded(() => Tools.removeEl(model.friendshipRequests, friendRequest)));
    $scope.deny = (friendRequest) => this.requestAndProcessCommand(DenyFriendRequestCommand, { friendId: friendRequest.sender.id })
      .then((data) => this.applyIfNeeded(() => Tools.removeEl(model.friendshipRequests, friendRequest)));
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

  sendMessage = form => this.requestAndProcessCommand(CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
    .then((data) =>
      this.applyIfNeeded(() => {
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
    $scope.save = form => this.requestAndProcessCommand(CreateBlogPostCommand, { data: $scope.model })
      .then(() => this.applyIfNeeded(() => {
        form.$setPristine();
        back();
      }));
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

    $scope.save = form => this.requestAndProcessCommand(UpdateBlogPostCommand, { id: model.id, data: model })
      .then(() => this.applyIfNeeded(() => {
        form.$setPristine();
        back();
      }));

    $scope.updateDate = () => $scope.model.created = new Date();

    $scope.cancel = () => back();
    $scope.delete = () => this.requestAndProcessCommand(DeleteBlogPostCommand, { id: model.id }, 'Post deleted')
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

export class ResetPasswordCommand extends DbCommandBase {
  static $name = 'ResetPassword';
  public execute = ['data', data => this.context.postCustom("user/reset-password", data, { requestName: 'resetPassword' })];
}
registerCQ(ResetPasswordCommand);

class ResendActivationController extends BaseController {
  static $name = "ResendActivationController";
  static $inject = ['$scope', 'logger', '$q', '$routeParams'];

  constructor(public $scope, public logger, $q, $routeParams) {
    super($scope, logger, $q);

    $scope.model = {
      email: $routeParams.email,
      fingerPrint: new Fingerprint().get()
    };
    $scope.submit = () => this.requestAndProcessResponse(ResendActivationCommand, { data: $scope.model });
  }
}

registerController(ResendActivationController);

class ForgotPasswordController extends BaseController {
  static $name = "ForgotPasswordController";
  static $inject = ['$scope', 'logger', '$q', '$routeParams'];

  constructor(public $scope, public logger, $q, $routeParams) {
    super($scope, logger, $q);

    $scope.model = {};
    $scope.submit = () => this.requestAndProcessCommand(ForgotPasswordCommand, { data: $scope.model }, "Request sent!")
      .then(result => this.applyIfNeeded(() => $scope.success = true));
  }
}

registerController(ForgotPasswordController);

class ForgotUsernameController extends BaseController {
  static $name = "ForgotUsernameController";
  static $inject = ['$scope', 'logger', '$q', '$routeParams'];

  constructor(public $scope, public logger, $q, $routeParams) {
    super($scope, logger, $q);

    $scope.model = {};
    $scope.submit = () => this.requestAndProcessCommand(ForgotUsernameCommand, { data: $scope.model }, "Request sent!")
      .then(result => this.applyIfNeeded(() => $scope.success = true));
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

    $scope.submit = () => this.requestAndProcessCommand(ResetPasswordCommand, { data: $scope.model })
      .then(result => this.applyIfNeeded(() => $scope.success = true));
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
    $scope.register = () => this.requestAndProcessResponse(RegisterCommand, { data: $scope.model }).then(x => this.$scope.w6.navigate('/thanks'));
    $scope.openForgotPasswordDialog = () => $scope.request(OpenForgotPasswordDialogQuery, { email: $scope.model.email });
    //$scope.openLoginDialog = () => $scope.request(Components.Dialogs.OpenLoginDialogQuery);
  }
}

registerController(RegisterController);


export class ProfileQueryBase extends DbQueryBase {
  private getUserUrl(userSlug, resource?) { return "profile/" + this.context.getUserSlugCache(userSlug) + (resource ? "/" + resource : ""); }

  public getUserProfileData(userSlug, resource?) { return this.context.getCustom(this.getUserUrl(userSlug, resource)); }
}

export class GetProfileQuery extends ProfileQueryBase {
  static $name = "GetProfile";
  public execute = [
    'userSlug', (userSlug) => this.context.getCustom<{ id: string }>("profile/" + userSlug)
      .then((result) => {
        var userProfile = result;
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

  public postProfileData(userSlug, resource?, data?, requestName?) { return this.context.postCustom(this.getUserUrl(userSlug, resource), data, { requestName: requestName }); }

  public deleteProfileData(userSlug, resource?, requestName?) { return this.context.deleteCustom(this.getUserUrl(userSlug, resource), { requestName: requestName }); }
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
    $scope.addFriend = () => this.requestAndProcessCommand(AddAsFriendCommand, { userSlug: model.slug })
      .then((data) => this.applyIfNeeded(() => model.isFriend = true));
    $scope.removeFriend = () => this.requestAndProcessCommand(RemoveAsFriendCommand, { userSlug: model.slug })
      .then((data) => this.applyIfNeeded(() => model.isFriend = false));
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
      this.requestAndProcessCommand(CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
        .then((data) => this.applyIfNeeded(() => {
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
