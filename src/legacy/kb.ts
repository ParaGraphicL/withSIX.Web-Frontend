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

import {Client} from 'withsix-sync-api';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';

angular.module('MyAppKbTemplates', []);

class KbModule extends Tk.Module {
  static $name = "KbModule";

  constructor() {
    super('MyAppKb', ['app', 'ngRoute', 'ngDfp', 'commangular', 'route-segment', 'view-segment', 'Components', 'MyAppKbTemplates']);
    this.app
      .config([
        'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
          if (w6.enableAds) {
            // TODO: Consider if we can deal with ads more on the fly instead of at app config?
            doubleClickProvider
              .defineSlot('/' + dfp.publisherId + '/main_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["main_rectangle_atf"])
              .defineSlot('/' + dfp.publisherId + '/main_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["main_rectangle_btf"])
              .defineSlot('/' + dfp.publisherId + '/main_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["main_leaderboard_atf"]);
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
            .when('/:page*', 'static_root')
            .segment('static_root', {
              controller: 'KbStaticMainController',
              templateUrl: '/src_legacy/app/kb/index.html',
              resolve: setupQuery(GetKbQuery),
            });
        }
      ])
      .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
  }
}

export function registerCQ(command) { app.registerCommand(command); }

export function registerService(service) { app.app.service(service.$name, service); }

export function registerController(controller) { app.app.controller(controller.$name, controller); }

var app = new KbModule();

interface IKbModel {
  title: string;
  doc: string;
}

// Load Md's
class KbStaticMainController extends BaseQueryController<IKbModel> {
  static $name = 'KbStaticMainController';
  static $inject = ['$scope', 'logger', '$q', '$routeParams', 'model'];

  constructor(public $scope: IBaseScopeT<IKbModel>, public logger, public $q, $routeParams, model: IKbModel) {
    super($scope, logger, $q, model);
    $scope.$on('$routeChangeSuccess', () => {
      $scope.model = null;
      $scope.request<IKbModel>(GetKbQuery, { '$routeParams': $routeParams }).then(result => $scope.model = result);
    });
  }
}

registerController(KbStaticMainController);


class GetKbQuery extends DbQueryBase {
  static $name = 'GetKb';

  public execute = [
    '$routeParams', routeParams => this.context.getDocMd((routeParams.page || 'index') + '.md', true)
      .then(data => {
        return {
          // TODO: Improve nonsense
          doc: (<string>data).replace(/\[([^\]]+)]\(([^\/])(.*)/g, "[$1](/$2$3").replace(/\/http(s?):/g, "http$1:"),
          page: routeParams.page,
          title: routeParams.page ? routeParams.page.split('/').map(v => this.fixStr(v).replace(/_/g, ' ')).join('\\') : 'Home'
        };
      })
  ];

  fixStr(str) {
    var out = str.replace(/^\s*/, ""); // strip leading spaces
    out = out.replace(/^[a-z]|[^\s][A-Z]/g, (str, offset) => {
      if (offset == 0) {
        return (str.toUpperCase());
      } else {
        return (str.substr(0, 1) + " " + str.substr(1).toLowerCase());
      }
    });
    return (out);
  }

}

registerCQ(GetKbQuery);
