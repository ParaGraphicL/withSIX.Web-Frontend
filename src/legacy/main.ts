
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
import {IRootScope, ITagKey, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, ICreateComment, ICQWM, IModel, DbCommandBase, DbQueryBase, BaseController, BaseQueryController,
  IMenuItem, ModelDialogControllerBase, DialogControllerBase, Result, BooleanResult, IHandleCommentsScope} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';

import {Components} from './components';

import {registerService, registerCommands, registerCQ, registerController, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';

export module Main {
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

export module Main.Blog {
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
        Tools.Debug.log("getting postcomments by id: " + postId.toString());
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
      'model', async (model) => {
        var entity = BreezeEntityGraph.PostComment.createEntity(this.context.manager, { postId: model.postId, authorId: this.context.w6.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
        if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
        try {
          await this.context.saveChanges(undefined, [entity]);
        } catch (err) {
          if (model.replyTo) Tools.removeEl(model.replyTo.replies, entity);
          this.context.manager.detachEntity(entity);
          throw err;
        }
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

  export interface IBlogPostScope extends IBaseScope, IHandleCommentsScope<IBreezePostComment> {
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

  export interface IBlogPostContentModel extends IBaseScopeT<IBreezePost> {
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

      if (Tools.debug) {
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

export module Main.Changelog {
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

export module Main.Premium {
  export class OpenPremiumTermsDialogQuery extends DialogQueryBase {
    static $inject = ['$modal', 'dialogs', 'dbContext', 'w6'];

    constructor($modal, public dialogs, context: W6Context, private w6: W6) { super($modal, dialogs, context); }

    static $name = 'OpenPremiumTermsDialog';
    public execute = [
      () => this.openDialog(Components.Dialogs.DefaultDialogWithDataController, {
        templateUrl: '/src_legacy/app/main/premium/premium-terms-dialog.html',
        size: 'lg',
        resolve: {
          data: () => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md")
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
    public execute = [() => this.context.getCustom(this.w6.url.cdn + "/docs/global/TermsOfServicesPremium.md")];
  }

  export class GetPremiumQuery extends DbQueryBase {
    static $name = 'GetPremium';
    public execute = [() => this.context.getCustom("premium")];
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
