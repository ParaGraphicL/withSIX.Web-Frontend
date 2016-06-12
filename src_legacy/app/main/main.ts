﻿module MyApp.Main {
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
