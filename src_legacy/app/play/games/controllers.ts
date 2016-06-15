module MyApp.Play.Games {
  import ClientInfo = MyApp.Components.ModInfo.IClientInfo;
  import ItemState = MyApp.Components.ModInfo.ItemState;
  import ConnectionState = MyApp.Components.Signalr.ConnectionState;
  import BasketService = MyApp.Components.Basket.BasketService;

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

  export interface IGameScope extends IBaseScopeT<IBreezeGame>, IBaseGameScope { }

  class GameController extends BaseQueryController<IBreezeGame> {
    static $name = "GameController";

    static $inject = [
      '$scope', 'logger', '$q', 'dbContext', 'model', 'modInfoService',
      '$rootScope', 'basketService', 'aur.eventBus'
    ];

    constructor(public $scope: IGameScope, public logger, $q, dbContext, query: { game: IBreezeGame, gameInfo }, private modInfo,
      $rootScope: IRootScope, basketService: Components.Basket.BasketService, private eventBus: IEventBus) {
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

      if (model.supportsServers && $scope.environment != Tk.Environment.Production)
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
        try {
          await basketService.getGameBaskets($scope.game.id).handleAction(Helper.modToBasket(item, $scope.game.id), $scope.clientInfo, 1);
        } catch (err) {
          if (modInfo.state != ConnectionState.connected)
            basketService.settings.forceBasketInstallMessageHidden = false;
          throw err;
        }
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
        try {
          await basketService.getGameBaskets($scope.game.id).handleAction(Helper.collectionToBasket(item, $scope.game.id), $scope.clientInfo, 2)
        } catch (err) {
          if (modInfo.state != ConnectionState.connected)
            basketService.settings.forceBasketInstallMessageHidden = false;
          throw err;
        }
      };
      window.w6Cheat.api.gameChanged({ id: model.id, slug: model.slug });
      var s = this.eventBus.subscribe("basketChanged", () => this.applyIfNeeded());

      // TODO: Move to Directive..
      $scope.$on('$destroy', () => {
        s.dispose();
        //window.w6Cheat.api.gameChanged({ id: null });
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
