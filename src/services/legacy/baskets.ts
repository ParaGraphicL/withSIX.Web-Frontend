import {_Indexer} from './base';

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
  hasConnected: boolean;
}
