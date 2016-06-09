module MyApp.Components.Basket {
  export enum BasketItemType {
    Mod,
    Mission,
    Collection,
  }

  export interface IBasketItem {
    id: string;
    name: string;
    packageName: string;
    image: string;
    author: string;
    itemType: BasketItemType;
    constraint?: string;
    isOnlineCollection?: boolean;
    gameId: string;
    sizePacked: number;
  }

  export interface IBasketCollection {
    id: string;
    gameId: string;
    name: string;
    collectionId?: string;
    changed?: boolean;
    state: BasketState;
    items: IBasketItem[];
    isPersistent: boolean;
    isTemporary: boolean;
    basketType: BasketType;
  }

  export interface IBasketModel {
    collections: IBasketCollection[];
    activeId: string;
  }

  export interface IBaskets {
    gameBaskets: _Indexer<IBasketModel>;
  }

  export enum BasketState {
    Unknown = 0,
    Install = 1,
    Syncing = 2,
    Update = 3,
    Launch = 4
  }
  export enum BasketType {
    Default = 0,
    SingleItem = 1,
    SingleCollection = 2,
  }

  export interface IBasketSettings {
    forceBasketInstallMessageHidden: boolean;
    hasConnected: boolean;
  }
  export interface IBasketScope extends ng.IScope {
    settings: IBasketSettings;
    baskets: IBaskets;
  }

  export class BasketService extends Tk.Service {
    static $name = "basketService";
    static $inject = ['localStorageService', 'logger', '$rootScope', 'modInfoService'];
    private baskets: IBaskets;
    private scope: IBasketScope;
    public settings: IBasketSettings;
    private constructedBaskets: _Indexer<any> = {};
    lastActiveItem: string;

    constructor(private localStorage: angular.local.storage.ILocalStorageService, public logger: Logger.ToastLogger, root: IRootScope, private modInfo) {
      super();
      this.scope = <any>root.$new(true);

      this.refresh();

      this.setDefaults();
    }

    refresh() { this.setupBindings(this.localStorage); }

    abort(gameId: string) { return this.modInfo.abort(gameId); };

    private setDefaults() {
      if (this.settings.hasConnected == null) {
        this.settings.hasConnected = false;
      }
    }

    private createLocalBaskets(): IBaskets {
      return {
        gameBaskets: {},
      };
    }

    addToBasket(gameId: string, item: IBasketItem) {
      var baskets = this.getGameBaskets(gameId);
      baskets.active.toggleInBasket(Object.assign({ gameId: gameId }, item));
    }

    getGameBaskets(gameId: string) {
      if (this.constructedBaskets[gameId] != null) return this.constructedBaskets[gameId];

      if (this.baskets.gameBaskets[gameId] == null) this.baskets.gameBaskets[gameId] = {
        activeId: null,
        collections: []
      };

      var basketModel = this.baskets.gameBaskets[gameId];
      try {
        var i = basketModel.collections.length;
      } catch (e) {
        this.logger.error("A Game Basket Group was damaged and had to be reset", "Error Loading Game Baskets");
        delete this.baskets.gameBaskets[gameId];
        return this.getGameBaskets(gameId);
      }

      return this.constructedBaskets[gameId] = window.w6Cheat.api.createGameBasket(gameId, basketModel);
    }

    private setupBinding<TModel>(localStorage: angular.local.storage.ILocalStorageService, key: string, setFunc: () => TModel, testFunc: (model: TModel) => boolean) {
      if (localStorage.keys().indexOf(key) == -1) {
        localStorage.set(key, setFunc());
      } else {
        try {
          var model = localStorage.get<TModel>(key);
          if (!testFunc(model))
            throw new Error("Failed Model Test");
        } catch (e) {
          localStorage.remove(key);
          this.logger.error("Some of your settings were damaged and have been reset to prevent errors.", "Error Loading Status Bar");
          this.setupBinding(localStorage, key, setFunc, testFunc);
          return;
        }
      }
      localStorage.bind(this.scope, key);
    }

    private setupBindings(localStorage: angular.local.storage.ILocalStorageService) {
      this.setupBinding(localStorage, "baskets", () => this.createLocalBaskets(), (model) => {
        if (model.gameBaskets === null || typeof model.gameBaskets !== 'object')
          return false;
        return true;
      });
      this.setupBinding(localStorage, "settings", () => <IBasketSettings>{
        forceBasketInstallMessageHidden: true,
        hasConnected: false
      }, (model) => {
        // ReSharper disable once RedundantComparisonWithBoolean
        // Being Explicit
        if ((model.forceBasketInstallMessageHidden !== true && model.forceBasketInstallMessageHidden !== false) && model.forceBasketInstallMessageHidden != null)
          return false;
        return true;
      });

      this.baskets = this.scope.baskets;
      this.settings = this.scope.settings;
    }
  }

  registerService(BasketService);
}
