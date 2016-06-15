module MyApp.Connect {
  angular.module('MyAppConnectTemplates', []);

  class ConnectModule extends Tk.Module {
    static $name = "ConnectModule";

    constructor() {
      super('MyAppConnect', ['app', 'ngRoute', 'ngDfp', 'commangular', 'MyAppPlayContentIndexes', 'MyAppPlayTemplates', 'route-segment', 'view-segment', 'Components', 'MyAppConnectTemplates']);

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
              when('/me/groups', 'newprofile').
              when('/me/groups/:id/:slug', 'newprofile').
              when('/me/groups/:id/:slug/join/:token', 'newprofile').
              when('/me/groups/:id/:slug/members', 'newprofile').
              when('/me/groups/:id/:slug/collections', 'newprofile').
              when('/me/groups/:id/:slug/mods', 'newprofile').
              when('/me/groups/:id/:slug/servers', 'newprofile').
              when('/me/library', 'newprofile').
              when('/me/library/:gameSlug', 'newprofile').
              when('/me/library/:gameSlug/mods', 'newprofile').
              when('/me/library/:gameSlug/missions', 'newprofile').
              when('/me/library/:gameSlug/collections', 'newprofile').
              when('/me/library/:gameSlug/collections/:collectionId/:collectionSlug?', 'newprofile').
              //when('/me/library/:gameSlug/servers', 'newprofile').
              when('/me/library/:gameSlug/apps', 'newprofile').
              when('/me', 'me').
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
              segment('newprofile', {
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
              when('/u/:userSlug/content/collections', 'profile.content.collections').
              when('/u/:userSlug/content/missions', 'profile.content.missions').
              when('/u/:userSlug/content/mods', 'profile.content.mods').
              //when('/profile/:userSlug/comments', 'profile.comments').
              segment('profile', {
                controller: 'ProfileController',
                templateUrl: '/src_legacy/app/connect/profile/index.html',
                dependencies: ['userSlug'],
                resolve: setupQuery(Profile.GetProfileQuery),
              })
              .within();

            profile.segment('blog', {
              templateUrl: '/src_legacy/app/connect/profile/blogposts.html',
              controller: 'ProfileBlogController',
              resolve: setupQuery(Profile.GetProfileBlogQuery),
            });

            profile.segment('content', {
            }).
              within().
              segment('collections', {
              }).
              segment('mods', {
              }).
              segment('missions', {
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
