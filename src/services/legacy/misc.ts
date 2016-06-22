import {IBreezeModUpdate, IBreezeMod, IBreezeCollection} from '../dtos';
import {IBasketItem, BasketItemType} from './baskets';
import {Tools} from '../tools';
import {W6} from '../withSIX';
import breeze from 'breeze-client';

export enum FileSize {
  B,
  KB,
  MB,
  GB,
  TB,
  PB,
  EB,
  ZB,
  YB
}

export interface IBreezeErrorReason extends IBreezeHttpResponse<IHttpResponse<IHttpResponseException>> {
}

export interface IBreezeHttpResponse<TResponse> {
  httpResponse: TResponse;
  entityManager: breeze.EntityManager;
  query: breeze.EntityQuery;
  status: number;
  message: string;
}

export interface IHttpResponse<TData> {
  data: TData;
  status: number;
  statusText: string;
}

export interface IHttpResponseException {
  $id: string;
  $type: string;
  ExceptionMessage: string;
  ExceptionType: string;
  Message: string;
  StackTrace?: string;
}



export class ModsHelper {
  static arma2Id = "1947DE55-44ED-4D92-A62F-26CFBE48258B";
  static arma3Id = "9DE199E3-7342-4495-AD18-195CF264BA5B";
  static a3MpCategories = ["Island", "Objects (Buildings, Foliage, Trees etc)"];
  static objectCategories = ["Objects (Buildings, Foliage, Trees etc)"];
  static getGameIds(id: string) {
    if (id.toUpperCase() == this.arma3Id)
      return [id, this.arma2Id];
    return [id];
  }

  static getCompatibilityModsFor(id: string, otherId: string, tags: string[] = []) {
    if (id.toUpperCase() == this.arma3Id) {
      if (tags.asEnumerable().any(x => this.objectCategories.asEnumerable().contains(x))) return [];
      if (tags.asEnumerable().any(x => this.a3MpCategories.asEnumerable().contains(x))) return ["@cup_terrains_core"];
      return ["@AllInArmaStandaloneLite"];
    }
    return [];
  }
  static getFullVersion = (x: IBreezeModUpdate, cutStable = true) => x.version + (cutStable && x.branch == 'stable' ? '' : ('-' + x.branch));
  static versionCompare = (x: IBreezeModUpdate, y: IBreezeModUpdate) => Tools.versionCompare(ModsHelper.getFullVersion(x, false), ModsHelper.getFullVersion(y, false))
}

// TODO: Not static
export class Helper {
  static modToBasket(mod: IBreezeMod, gameId?: string): IBasketItem {
    return {
      id: mod.id, name: mod.name, gameId: mod.gameId || gameId, itemType: BasketItemType.Mod, packageName: mod.packageName,
      image: mod.avatar ? W6.instance.url.getUsercontentUrl2(mod.avatar, mod.avatarUpdatedAt) : ((<any>mod).image ? (<any>mod).image : null),
      author: mod.author && mod.author.id != W6.instance.w6OBot ? mod.author.displayName : mod.authorText, sizePacked: mod.sizePacked
    }
  }

  static collectionToBasket(collection: IBreezeCollection, gameId?: string): IBasketItem {
    return {
      id: collection.id,
      itemType: BasketItemType.Collection,
      gameId: collection.gameId || gameId,
      packageName: collection.slug, // pff
      author: collection.author.displayName,
      image: collection.avatar ? W6.instance.url.getUsercontentUrl2(collection.avatar, collection.avatarUpdatedAt) : null, // item.image ? item.image :
      name: collection.name,
      sizePacked: collection.sizePacked,
      isOnlineCollection: true
    }
  }

  static streamModToBasket(mod: any, gameId?: string): IBasketItem {
    return {
      id: mod.id, name: mod.headerName, gameId: mod.gameId || gameId, itemType: BasketItemType.Mod, packageName: mod.packageName,
      image: mod.image ? W6.instance.url.getUsercontentUrl2(mod.image, mod.imageUpdatedAt) : null, author: mod.author, sizePacked: mod.sizePacked
    }
  }
}
