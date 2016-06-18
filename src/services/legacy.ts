import {Play, Main} from '../legacy/app';

import OpenAddModDialogQuery = Play.Games.OpenAddModDialogQuery;
import OpenAddCollectionDialogQuery = Play.Games.OpenAddCollectionDialogQuery;
import GetMiniChangelogQuery = Main.Changelog.GetMiniChangelogQuery;
import GetBlogsQuery = Main.Blog.GetBlogsQuery;

export {GetMiniChangelogQuery, GetBlogsQuery, OpenAddModDialogQuery, OpenAddCollectionDialogQuery}

import {BasketService as LegacyBasketService} from './legacy/basket-service';
export {LegacyBasketService}

export * from './legacy/baskets';
export * from './legacy/misc';
export * from './legacy/data-services'
export * from './legacy/logger'
export * from './legacy/upload'
