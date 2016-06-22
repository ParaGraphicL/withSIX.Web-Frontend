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
  IMenuItem, ModelDialogControllerBase, DialogControllerBase, Result, BooleanResult} from '../services/legacy/base'
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client} from 'withsix-sync-api';

import {Components} from './components';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';

export module Auth {
  angular.module('MyAppAuthTemplates', []);

  // TODO: Move Login/Register etc from Connect to Auth modules
  class AuthModule extends Tk.Module {
    static $name = "AuthModule";

    constructor() {
      super('MyAppAuth', ['app', 'ngRoute', 'ngDfp', 'commangular', 'MyAppPlayTemplates', 'route-segment', 'view-segment', 'Components', 'MyAppAuthTemplates', 'MyAppConnect']);
      this.app
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            var register = $routeProvider
              .when('/register', 'register')
              //.when('/register/finalize', 'register_finalize')
              .segment('register', {
                controller: 'RegisterController',
                templateUrl: '/src_legacy/app/connect/pages/register.html'
              });

            /*                        register.segment('register_finalize', {
                                        controller: 'FinalizeController',
                                        templateUrl: '/src_legacy/app/connect/pages/finalize.html'
                                    });*/

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
              templateUrl: '/src_legacy/app/connect/pages/resend-activation.html'
            });

            login.segment('login_forgot-password', {
              controller: 'ForgotPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-password.html'
            });
            login.segment('login_forgot-username', {
              controller: 'ForgotUsernameController',
              templateUrl: '/src_legacy/app/connect/pages/forgot-username.html'
            });
            login.segment('login_reset-password', {
              controller: 'ResetPasswordController',
              templateUrl: '/src_legacy/app/connect/pages/reset-password.html'
            });
          }
        ])
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
    }
  }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  var app = new AuthModule();
}
