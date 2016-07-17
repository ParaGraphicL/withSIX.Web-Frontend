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

import {Components} from './components';

import {registerCommands, getFactory} from './app-base';


export module Admin {
  angular.module('MyAppAdminTemplates', []);

  class AdminModule extends Tk.Module {
    static $name = "AdminModule";

    constructor() {
      super("MyAppAdmin", ['app', 'commangular', 'ngRoute', 'route-segment', 'view-segment', 'Components', 'MyAppAdminTemplates']);
      this.app.config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .config([
          '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
            var $routeProvider = new Tk.RoutingHandler($r1, $r2);
            var setupQuery = $routeProvider.setupQuery;
            var setupQueryPart = $routeProvider.setupQueryPart;

            $routeProvider.when('/', 'root')
              .segment('root', {
                controller: 'RootController',
                templateUrl: '/src_legacy/app/admin/index.html',
                permission: [Resource.admin, Permission.Read]
              })
              .when('/stats', 'stats')
              .when('/stats/games', 'stats.games')
              .when('/stats/content', 'stats.content')
              .when('/stats/orders', 'stats.orders')
              .when('/stats/missions', 'stats.missions')
              .when('/stats/global', 'stats.global')
              .when('/stats/accounts', 'stats.accounts')
              .segment('stats', {
                controller: 'StatsController',
                templateUrl: '/src_legacy/app/admin/pages/stats.html'
              })
              .within()
              .segment('global', {
                controller: 'GlobalController',
                templateUrl: '/src_legacy/app/admin/global/index.html',
                resolve: setupQuery(GetGlobalIntegersOverviewQuery),
                default: true
              })
              .segment('accounts', {
                controller: 'AccountsController',
                templateUrl: '/src_legacy/app/admin/accounts/index.html',
                resolve: setupQuery(GetAccountOverviewQuery)
              })
              .segment('orders', {
                controller: 'OrdersController',
                templateUrl: '/src_legacy/app/admin/orders/index.html',
                resolve: setupQuery(GetOrderOverviewQuery)
              })
              .segment('games', {
                controller: 'GamesController',
                templateUrl: '/src_legacy/app/admin/games/index.html',
                resolve: setupQuery(GetGameOverviewQuery)
              })
              .segment('content', {
                controller: 'GamesContentController',
                templateUrl: '/src_legacy/app/admin/games/content.html',
                resolve: setupQuery(GetGameContentOverviewQuery)
              })
              .segment('missions', {
                controller: 'MissionsController',
                templateUrl: '/src_legacy/app/admin/missions/index.html',
                resolve: setupQuery(GetMissionOverviewQuery)
              });
          }
        ]);
    }
  }

  var app = new AdminModule();

  class RootController extends BaseController {
    static $name = "RootController";
  }

  registerController(RootController);

  class StatsController extends BaseController {
    static $name = "StatsController";

    constructor($scope, logger, $q) {
      super($scope, logger, $q);
      $scope.menuItems = this.getMenuItems([
        { header: "Global", segment: "global", isDefault: true },
        { header: "Accounts", segment: "accounts" },
        { header: "Orders", segment: "orders" },
        { header: "Games", segment: "games" },
        { header: "Content", segment: "content" },
        { header: "Missions", segment: "missions" }
      ], "stats");
    }
  }

  registerController(StatsController);


  class OrdersController extends BaseQueryController<any> {
    static $name = 'OrdersController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(OrdersController);

  class AccountsController extends BaseQueryController<any> {
    static $name = 'AccountsController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(AccountsController);

  class MissionsController extends BaseQueryController<any> {
    static $name = 'MissionsController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(MissionsController);

  class GlobalController extends BaseQueryController<any> {
    static $name = 'GlobalController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GlobalController);

  class GamesController extends BaseQueryController<any> {
    static $name = 'GamesController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GamesController);

  class GamesContentController extends BaseQueryController<any> {
    static $name = 'GamesContentController';

    constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
      super($scope, logger, $q, model);
    }
  }

  registerController(GamesContentController);


  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  export function registerCQ(command) { app.registerCommand(command); }

  class GetOrderOverviewQuery extends DbQueryBase {
    static $name = 'GetOrderOverview';
    public execute = [
      () => this.context.getCustom('admin/orders')
    ];
  }

  registerCQ(GetOrderOverviewQuery);

  class GetMissionOverviewQuery extends DbQueryBase {
    static $name = 'GetMissionOverview';
    public execute = [() => { }]; // TODO
  }

  registerCQ(GetMissionOverviewQuery);


  class GetGlobalIntegersOverviewQuery extends DbQueryBase {
    static $name = 'GetGlobalIntegersOverview';
    public execute = [
      () => this.context.getCustom('admin/globalintegers')
    ];
  }

  registerCQ(GetGlobalIntegersOverviewQuery);


  class GetGameOverviewQuery extends DbQueryBase {
    static $name = 'GetGameOverview';
    public execute = [
      () => this.context.getCustom('admin/games')
    ];
  }

  registerCQ(GetGameOverviewQuery);

  class GetGameContentOverviewQuery extends DbQueryBase {
    static $name = 'GetGameContentOverview';
    public execute = [() => this.context.getCustom('admin/games/content')];
  }

  registerCQ(GetGameContentOverviewQuery);

  class GetAccountOverviewQuery extends DbQueryBase {
    static $name = 'GetAccountOverview';
    public execute = [
      () => this.context.getCustom('admin/accounts')
    ];
  }

  registerCQ(GetAccountOverviewQuery);
}
