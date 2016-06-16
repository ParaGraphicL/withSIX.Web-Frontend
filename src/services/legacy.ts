import {MyApp, globalRedactorOptions} from '../legacy_app';
import breeze from 'breeze-client';

import IBasketItem = MyApp.Components.Basket.IBasketItem;
import BasketItemType = MyApp.Components.Basket.BasketItemType;
import ModsHelper = MyApp.Play.Mods.ModsHelper;
import Helper = MyApp.Play.Helper;
import FileSize = MyApp.Components.FileSize;

import IBasketModel = MyApp.Components.Basket.IBasketModel;
import BasketType = MyApp.Components.Basket.BasketType;
import BasketState = MyApp.Components.Basket.BasketState;
import IBasketCollection = MyApp.Components.Basket.IBasketCollection;

import IBreezeErrorReason = MyApp.IBreezeErrorReason;

//export {MyApp};
export {globalRedactorOptions};
import {EntityExtends} from '../dtos';
export * from '../dtos';
export * from './legacy/w6context';

import CollectionDataService = MyApp.Play.Collections.CollectionDataService
import ModDataService = MyApp.Play.Mods.ModDataService;
import MissionDataService = MyApp.Play.Missions.MissionDataService;
import UploadService = MyApp.Components.Upload.UploadService;
import ToastLogger = MyApp.Components.Logger.ToastLogger;
import OpenAddModDialogQuery = MyApp.Play.Games.OpenAddModDialogQuery;
import OpenAddCollectionDialogQuery = MyApp.Play.Games.OpenAddCollectionDialogQuery;
import LegacyBasketService = MyApp.Components.Basket.BasketService;
import GetMiniChangelogQuery = MyApp.Main.Changelog.GetMiniChangelogQuery;
import GetBlogsQuery = MyApp.Main.Blog.GetBlogsQuery;
import UserInfo = EntityExtends.UserInfo;

export {breeze, IBreezeErrorReason, IBasketItem, IBasketModel, BasketItemType, BasketType, BasketState, IBasketCollection, ModsHelper, Helper}
export {UserInfo, CollectionDataService, ModDataService, UploadService, MissionDataService}
export {ToastLogger, FileSize}
export {GetMiniChangelogQuery, GetBlogsQuery, OpenAddModDialogQuery, OpenAddCollectionDialogQuery, LegacyBasketService}
