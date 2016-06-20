import {IBasketSettings, IBaskets, IBasketItem} from './baskets';
import {Tk} from './tk';
import {_Indexer} from './base';
import {ToastLogger} from './logger';


interface IBasketScope extends ng.IScope {
  settings: IBasketSettings;
  baskets: IBaskets;
}

export class BasketService extends Tk.Service {
  static $name = "basketService";
  static $inject = ['localStorageService', 'logger', '$rootScope', 'aur.client'];
  private baskets: IBaskets;
  private scope: IBasketScope;
  public settings: IBasketSettings;
  private constructedBaskets: _Indexer<any> = {};
  lastActiveItem: string;

  constructor(private localStorage: angular.local.storage.ILocalStorageService, public logger: ToastLogger, root: ng.IScope, private modInfo) {
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
      hasConnected: false
    }, (model) => {
      return true;
    });

    this.baskets = this.scope.baskets;
    this.settings = this.scope.settings;
  }
}
