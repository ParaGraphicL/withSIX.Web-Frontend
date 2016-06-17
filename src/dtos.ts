import {W6} from './services/withSIX';
import breeze from 'breeze-client';


export interface IUserInfo {
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isPremium: boolean;
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isAdmin: boolean;
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isManager: boolean;
  id: string;
  slug: string;
  avatarURL: string;
  hasAvatar: boolean;
  avatarUpdatedAt: Date;
  emailMd5: string;
  displayName: string;
  userName: string;
  firstName: string;
  lastName: string;
  profileUrl: string; // computed
  clearAvatars(): void;
  getAvatarUrl(size: number): string;
  isInRole(role: string): boolean;
  isInRoles(...roles: string[]): boolean;
  isInRoles(roles: string[]): boolean;
  hasPermission(resource: string, action: string): boolean;
  roles: string[];
  failedLogin: boolean;
}

export class Role {
  static admin = "admin";
  static user = "user";
  static bot = "bot";
  static manager = "manager";
  static premium = "premium";
  static authorBeta = "author_beta";
  static author = "author";
}

export class Resource {
  static admin = "admin";
  static mods = "mods";
}

export class Permission {
  static Create = "create"; // new
  static Read = "read"; // view, list
  static Update = "update"; // edit
  static Delete = "delete"; // destroy
}

export class ModPermission {
  static CreateReport = 'create_report';
}

// TODO: See if we can somehow sync up with the C# PermissionManager somehow
export class Permissions {
  static write = [Permission.Create, Permission.Update, Permission.Delete];
  static read = [Permission.Read];
  static readAndWrite = Permissions.read.concat(Permissions.write);
  static permissions = {
    admin: {
      mods: Permissions.readAndWrite.concat([ModPermission.CreateReport]),
      admin: Permissions.readAndWrite
    },
    manager: {
      mods: Permissions.readAndWrite.concat([ModPermission.CreateReport])
    },
    user: {
      mods: [Permission.Create, Permission.Update, Permissions.read]
    },
    author_beta: {
      mods: [Permission.Create, Permission.Update, Permissions.read]
    },
    premium: {}
  };

  static hasPermission(roles: string[], resource: string, action: string) {
    for (var i in roles) {
      var permissions = this.permissions[roles[i]];
      if (permissions) {
        var actions = permissions[resource];
        if (actions && actions.asEnumerable().contains(action))
          return true;
      }
    }
    return false;
  }
}

// EntiExtends
export module EntityExtends {
  export class _ExtendsHelper {
    public static $namespace: string = "EntityExtends";
  }

  export class BaseEntity {
    // BAH
    static w6: W6;
  }

  export class CollectionVersion implements ICollectionVersion {
    static $name = 'CollectionVersion';
    versionRevision: number;
    versionBuild: number;
    versionMinor: number;
    versionMajor: number;
    branch: string;
    private _version: string;

    private getVersion() {
      if (this.versionRevision && this.versionRevision > -1)
        return [this.versionMajor, this.versionMinor, this.versionBuild, this.versionRevision].join("."); //+ "-" + this.branch
      if (this.versionBuild && this.versionBuild > -1)
        return [this.versionMajor, this.versionMinor, this.versionBuild].join("."); //+ "-" + this.branch
      return [this.versionMajor, this.versionMinor].join(".");
    }

    get version() { // TODO: WHy doesnt work when cached??
      return this.getVersion(); //this._version || (this._version = this.getVersion());
    }
  }

  export interface ICollectionVersion {
    version: string;
  }

  export class Collection { }

  export class User implements IUser {
    static $name = 'User';
    private _avatars = {};
    private _profileUrl: string;
    public slug: string;

    getAvatarUrl(size) { return this._avatars[size] || (this._avatars[size] = window.w6Cheat.w6.url.calculateAvatarUrl(<any>this, size)); }

    clearAvatars() { this._avatars = {}; }

    get profileUrl() { return this._profileUrl || (this._profileUrl = this.slug ? window.w6Cheat.w6.url.getUserSlugUrl(this.slug) : null); }

    isInRole(role: string): boolean { return this.roles.asEnumerable().contains(role) }
    isInRoles(...roles: string[]): boolean;
    isInRoles(roles: string[]): boolean;
    isInRoles(...roles: any[]): boolean {
      if (roles.length == 0)
        return false;
      if (roles[0] instanceof Array)
        return this._isInRoles(roles[0]);
      return this._isInRoles(roles);
    }

    private _isInRoles(roles: string[]): boolean {
      for (var i in roles)
        if (this.isInRole(roles[i]))
          return true;
      return false;
    }

    hasPermission(resource: string, action: string) {
      return Permissions.hasPermission(this.roles, resource, action);
    }

    roles: string[] = [];
  }

  export interface IUser {
    clearAvatars(): void;
    getAvatarUrl(size: number): string;
    profileUrl: string;
    isInRole(role: string): boolean;
    isInRoles(...roles: string[]): boolean;
    isInRoles(roles: string[]): boolean;
    hasPermission(resource: string, action: string): boolean;
    roles: string[];
  }

  export class Weather implements IWeather {
    static $name = 'Weather';

    getStartWeatherText() {
      var weather = this.getWeatherText((<any>this).startWeather || 0);
      var wind = this.getWindText((<any>this).startWind || 0);
      var waves = this.getWavesText((<any>this).startWaves || 0);
      var fog = this.getFogText((<any>this).startFog || 0);

      return "Weather: " + weather + ", Wind: " + wind + ", Waves: " + waves + " and Fog: " + fog;
    }

    getForecastWeatherText() {
      var weather = this.getWeatherText((<any>this).forecastWeather || 0);
      var wind = this.getWindText((<any>this).forecastWind || 0);
      var waves = this.getWavesText((<any>this).forecastWaves || 0);
      var fog = this.getFogText((<any>this).forecastFog || 0);

      return "Weather: " + weather + ", Wind: " + wind + ", Waves: " + waves + " and Fog: " + fog;
    }

    private getWeatherText(value: number) {
      if (value < 0.26)
        return "Clear";
      if (value < 0.41)
        return "Almost Clear";
      if (value < 0.61)
        return "Semi cloudy";
      if (value < 0.9)
        return "Cloudy";

      return "Overcast";
    }

    private getWindText(value: number) {
      if (value < 0.26)
        return "None";
      if (value < 0.41)
        return "Slightly windy";
      if (value < 0.61)
        return "Windy";
      if (value < 0.9)
        return "Heavy Windy";

      return "Storm";
    }

    private getWavesText(value: number) {
      if (value < 0.26)
        return "None";
      if (value < 0.41)
        return "Slightly wobbly";
      if (value < 0.61)
        return "Wobbly";
      if (value < 0.9)
        return "Heavy Wobbly";

      return "Storm";
    }

    private getFogText(value: number) {
      if (value < 0.26)
        return "None";
      if (value < 0.41)
        return "Slightly foggy";
      if (value < 0.61)
        return "Foggy";
      if (value < 0.9)
        return "Heavy Fog";

      return "Impossible";
    }
  }

  export interface IWeather {
    getStartWeatherText();
    getForecastWeatherText();
  }

  export class Mod {
    public mediaItems: IBreezeModMediaItem[];
    constraint: string

    public getLinkCount(): number {
      var c = 0;
      angular.forEach(this.mediaItems, item => {
        if (item.type == "Link")
          c++;
      });
      return c;
    }
  }

  export interface IMod {
    tags: string[];
    constraint?: string
  }

  export class Game implements IGame {
    get supportsStream() {
      return this.supportsMods || this.supportsMissions || this.supportsCollections;
    }

    supportsMods: boolean;
    supportsMissions: boolean;
    supportsCollections: boolean;
  }

  export interface IGame {
    supportsStream: boolean;
  }

  export class Mission {
  }

  export interface IMission {
    tags: string[];
  }

  export interface ICollection {
    tags: string[];
  }

  // Please note, do not inherit multiple breeze entities from the same class/constructor/prototype!
  export class Comment implements IComment {
    public replies: Comment[];
    public replyTo: IComment;

    hasReply(): boolean {
      return this.replyTo ? true : false;
    }

    getChildCount(): number {
      var c = this.replies.length;
      angular.forEach(this.replies, reply => c += reply.getChildCount());
      return c;
    }
  }

  export interface IComment {
    getChildCount(): number;
    hasReply(): boolean;
    //replyTo: IComment;
    //replies: Comment[];
  }

  export class PostComment extends Comment {
  }

  export interface IPostComment extends IComment {
  }

  export class MissionComment extends Comment {
  }

  export interface IMissionComment extends IComment {
  }

  export class ModComment extends Comment {
  }

  export interface IModComment extends IComment {
  }

  export class CollectionComment extends Comment {
  }

  export interface ICollectionComment extends IComment {
  }

  export class ServerComment extends Comment {
  }

  export interface IServerComment extends IComment {
  }

  export class AppComment extends Comment {
  }

  export interface IAppComment extends IComment {
  }

  export class UserInfo extends User implements IUserInfo {
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isPremium: boolean;
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isAdmin: boolean;
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isManager: boolean;
    id: string;
    slug: string;
    avatarURL: string;
    hasAvatar: boolean;
    emailMd5: string;
    firstName: string;
    lastName: string;
    userName: string;
    displayName: string;
    failedLogin: boolean;
    avatarUpdatedAt: Date;

    // TODO: Listen to avatar changes at a global place and ClearAvatars() so that the next calls will refresh the info. Already implemented for the updateUserInfo calls...
  }
}



// DTOS

// ReSharper disable InconsistentNaming

//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version: 4.0.30319.34209
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

import _IntDefExts = EntityExtends;

export interface IBreezeRange
		extends _IntDefs._Range { }

export interface IBreezeRespawn
		extends _IntDefs._Respawn { }

export interface IBreezeWeather
		extends _IntDefs._Weather,
  _IntDefExts.IWeather { }

export interface IBreezeAppComment
		extends _IntDefs._AppComment,
  _IntDefExts.IAppComment { }

export interface IBreezeApp
		extends _IntDefs._App { }

export interface IBreezeUser
		extends _IntDefs._User,
  _IntDefExts.IUser { }

export interface IBreezeEntityModuleComment
		extends _IntDefs._EntityModuleComment { }

export interface IBreezeUserEntityModule
		extends _IntDefs._UserEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeWall
		extends _IntDefs._Wall { }

export interface IBreezeWallPost
		extends _IntDefs._WallPost { }

export interface IBreezeAppEntityModule
		extends _IntDefs._AppEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeCollectionEntityModule
		extends _IntDefs._CollectionEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeGroupEntityModule
		extends _IntDefs._GroupEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeMissionEntityModule
		extends _IntDefs._MissionEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeModEntityModule
		extends _IntDefs._ModEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeServerEntityModule
		extends _IntDefs._ServerEntityModule, AbstractDefs.IBreezeEntityModule { }

export interface IBreezeGameInApp
		extends _IntDefs._GameInApp { }

export interface IBreezeAppMediaItem
		extends _IntDefs._AppMediaItem { }

export interface IBreezeCollectionComment
		extends _IntDefs._CollectionComment,
  _IntDefExts.ICollectionComment { }

export interface IBreezeCollection
		extends _IntDefs._Collection,
  _IntDefExts.ICollection { }

export interface IBreezeCollectionFileTransferPolicy
		extends _IntDefs._CollectionFileTransferPolicy { }

export interface IBreezeAWSUploadPolicy
		extends _IntDefs._AWSUploadPolicy { }

export interface IBreezeCollectionImageFileTransferPolicy
		extends _IntDefs._CollectionImageFileTransferPolicy, IBreezeCollectionFileTransferPolicy { }

export interface IBreezeGameInContent
		extends _IntDefs._GameInContent { }

export interface IBreezeGameModStat
		extends _IntDefs._GameModStat, IBreezeGameInContent { }

export interface IBreezeGroupInContent
		extends _IntDefs._GroupInContent { }

export interface IBreezeCollectionVersion
		extends _IntDefs._CollectionVersion,
  _IntDefExts.ICollectionVersion { }

export interface IBreezeCollectionVersionDependency
		extends _IntDefs._CollectionVersionDependency { }

export interface IBreezeMod
		extends _IntDefs._Mod,
  _IntDefExts.IMod { }

export interface IBreezeModCategoryInMod
		extends _IntDefs._ModCategoryInMod { }

export interface IBreezeCollectionInMod
		extends _IntDefs._CollectionInMod { }

export interface IBreezeModComment
		extends _IntDefs._ModComment,
  _IntDefExts.IModComment { }

export interface IBreezeModDependency
		extends _IntDefs._ModDependency { }

export interface IBreezeModDependent
		extends _IntDefs._ModDependent { }

export interface IBreezeModFileTransferPolicy
		extends _IntDefs._ModFileTransferPolicy { }

export interface IBreezeModImageFileTransferPolicy
		extends _IntDefs._ModImageFileTransferPolicy, IBreezeModFileTransferPolicy { }

export interface IBreezeModInfo
		extends _IntDefs._ModInfo { }

export interface IBreezeModMediaItem
		extends _IntDefs._ModMediaItem { }

export interface IBreezeModStat
		extends _IntDefs._ModStat { }

export interface IBreezeModUpdate
		extends _IntDefs._ModUpdate { }

export interface IBreezeModUserGroup
		extends _IntDefs._ModUserGroup { }

export interface IBreezeModGroupUser
		extends _IntDefs._ModGroupUser { }

export interface IBreezeCollectionVersionServer
		extends _IntDefs._CollectionVersionServer { }

export interface IBreezeCollectionMediaItem
		extends _IntDefs._CollectionMediaItem { }

export interface IBreezeCollectionStat
		extends _IntDefs._CollectionStat { }

export interface IBreezeGame
		extends _IntDefs._Game,
  _IntDefExts.IGame { }

export interface IBreezeGameStat
		extends _IntDefs._GameStat, IBreezeGame { }

export interface IBreezeGroupMembership
		extends _IntDefs._GroupMembership { }

export interface IBreezeGroup
		extends _IntDefs._Group { }

export interface IBreezeWallPostComment
		extends _IntDefs._WallPostComment, AbstractDefs.IBreezeComment { }

export interface IBreezeServer
		extends _IntDefs._Server { }

export interface IBreezeServerComment
		extends _IntDefs._ServerComment,
  _IntDefExts.IServerComment { }

export interface IBreezePlayer
		extends _IntDefs._Player { }

export interface IBreezeMissionComment
		extends _IntDefs._MissionComment,
  _IntDefExts.IMissionComment { }

export interface IBreezeMission
		extends _IntDefs._Mission,
  _IntDefExts.IMission { }

export interface IBreezeMissionFeature
		extends _IntDefs._MissionFeature { }

export interface IBreezeMissionVersion
		extends _IntDefs._MissionVersion { }

export interface IBreezeMissionVersionDependency
		extends _IntDefs._MissionVersionDependency { }

export interface IBreezeMissionVersionSide
		extends _IntDefs._MissionVersionSide { }

export interface IBreezeMissionMediaItem
		extends _IntDefs._MissionMediaItem { }

export interface IBreezeMissionImage
		extends _IntDefs._MissionImage, IBreezeMissionMediaItem { }

export interface IBreezeMissionVideo
		extends _IntDefs._MissionVideo, IBreezeMissionMediaItem { }

export interface IBreezeMissionStat
		extends _IntDefs._MissionStat { }

export interface IBreezeModCategory
		extends _IntDefs._ModCategory { }

export interface IBreezeModInCategory
		extends _IntDefs._ModInCategory { }

export interface IBreezePostComment
		extends _IntDefs._PostComment,
  _IntDefExts.IPostComment { }

export interface IBreezePost
		extends _IntDefs._Post { }

export interface IBreezeCreateBlog
		extends _IntDefs._CreateBlog, IBreezePost { }

export interface IBreezeCreateBlogCommand
		extends _IntDefs._CreateBlogCommand, IBreezeCreateBlog { }

export interface IBreezeDeleteBlogCommand
		extends _IntDefs._DeleteBlogCommand, AbstractDefs.IBreezeEditBlogCommand { }

export interface IBreezeUpdateBlogCommand
		extends _IntDefs._UpdateBlogCommand, AbstractDefs.IBreezeEditBlogCommand { }

export interface IBreezeProduct
		extends _IntDefs._Product { }

export module AbstractDefs {
  /**Abstract
  */
		export interface IBreezeEntityModule
    extends _IntDefs._EntityModule { }

  /**Abstract
  */
		export interface IBreezeComment
    extends _IntDefs._Comment,
				_IntDefExts.IComment { }

  /**Abstract
  */
		export interface IBreezeEditBlogCommand
    extends _IntDefs._EditBlogCommand, IBreezeCreateBlog { }

}
export module _InternalFakeCtors {
		export class Range { }
		export class Respawn { }
		export class App { }
		export class EntityModuleComment { }
		export class EntityModule { }
		export class UserEntityModule { }
		export class Wall { }
		export class WallPost { }
		export class AppEntityModule { }
		export class CollectionEntityModule { }
		export class GroupEntityModule { }
		export class MissionEntityModule { }
		export class ModEntityModule { }
		export class ServerEntityModule { }
		export class GameInApp { }
		export class AppMediaItem { }
		export class CollectionFileTransferPolicy { }
		export class AWSUploadPolicy { }
		export class CollectionImageFileTransferPolicy { }
		export class GameInContent { }
		export class GameModStat { }
		export class GroupInContent { }
		export class CollectionVersionDependency { }
		export class ModCategoryInMod { }
		export class CollectionInMod { }
		export class ModDependency { }
		export class ModDependent { }
		export class ModFileTransferPolicy { }
		export class ModImageFileTransferPolicy { }
		export class ModInfo { }
		export class ModMediaItem { }
		export class ModStat { }
		export class ModUpdate { }
		export class ModUserGroup { }
		export class ModGroupUser { }
		export class CollectionVersionServer { }
		export class CollectionMediaItem { }
		export class CollectionStat { }
		export class GameStat { }
		export class GroupMembership { }
		export class Group { }
		export class WallPostComment { }
		export class Server { }
		export class Player { }
		export class MissionFeature { }
		export class MissionVersion { }
		export class MissionVersionDependency { }
		export class MissionVersionSide { }
		export class MissionMediaItem { }
		export class MissionImage { }
		export class MissionVideo { }
		export class MissionStat { }
		export class ModCategory { }
		export class ModInCategory { }
		export class Post { }
		export class CreateBlog { }
		export class CreateBlogCommand { }
		export class EditBlogCommand { }
		export class DeleteBlogCommand { }
		export class UpdateBlogCommand { }
		export class Product { }
}
export class BreezeInitialzation {
		static registerEntityTypeCtors(store: breeze.MetadataStore) {
    store.registerEntityTypeCtor('Range', _InternalFakeCtors.Range);
    store.registerEntityTypeCtor('Respawn', _InternalFakeCtors.Respawn);
    store.registerEntityTypeCtor('Weather', EntityExtends.Weather);
    store.registerEntityTypeCtor('AppComment', EntityExtends.AppComment);
    store.registerEntityTypeCtor('App', _InternalFakeCtors.App);
    store.registerEntityTypeCtor('User', EntityExtends.User);
    store.registerEntityTypeCtor('EntityModuleComment', _InternalFakeCtors.EntityModuleComment);
    store.registerEntityTypeCtor('EntityModule', _InternalFakeCtors.EntityModule);
    store.registerEntityTypeCtor('UserEntityModule', _InternalFakeCtors.UserEntityModule);
    store.registerEntityTypeCtor('Wall', _InternalFakeCtors.Wall);
    store.registerEntityTypeCtor('WallPost', _InternalFakeCtors.WallPost);
    store.registerEntityTypeCtor('AppEntityModule', _InternalFakeCtors.AppEntityModule);
    store.registerEntityTypeCtor('CollectionEntityModule', _InternalFakeCtors.CollectionEntityModule);
    store.registerEntityTypeCtor('GroupEntityModule', _InternalFakeCtors.GroupEntityModule);
    store.registerEntityTypeCtor('MissionEntityModule', _InternalFakeCtors.MissionEntityModule);
    store.registerEntityTypeCtor('ModEntityModule', _InternalFakeCtors.ModEntityModule);
    store.registerEntityTypeCtor('ServerEntityModule', _InternalFakeCtors.ServerEntityModule);
    store.registerEntityTypeCtor('GameInApp', _InternalFakeCtors.GameInApp);
    store.registerEntityTypeCtor('AppMediaItem', _InternalFakeCtors.AppMediaItem);
    store.registerEntityTypeCtor('CollectionComment', EntityExtends.CollectionComment);
    store.registerEntityTypeCtor('Collection', EntityExtends.Collection);
    store.registerEntityTypeCtor('CollectionFileTransferPolicy', _InternalFakeCtors.CollectionFileTransferPolicy);
    store.registerEntityTypeCtor('AWSUploadPolicy', _InternalFakeCtors.AWSUploadPolicy);
    store.registerEntityTypeCtor('CollectionImageFileTransferPolicy', _InternalFakeCtors.CollectionImageFileTransferPolicy);
    store.registerEntityTypeCtor('GameInContent', _InternalFakeCtors.GameInContent);
    store.registerEntityTypeCtor('GameModStat', _InternalFakeCtors.GameModStat);
    store.registerEntityTypeCtor('GroupInContent', _InternalFakeCtors.GroupInContent);
    store.registerEntityTypeCtor('CollectionVersion', EntityExtends.CollectionVersion);
    store.registerEntityTypeCtor('CollectionVersionDependency', _InternalFakeCtors.CollectionVersionDependency);
    store.registerEntityTypeCtor('Mod', EntityExtends.Mod);
    store.registerEntityTypeCtor('ModCategoryInMod', _InternalFakeCtors.ModCategoryInMod);
    store.registerEntityTypeCtor('CollectionInMod', _InternalFakeCtors.CollectionInMod);
    store.registerEntityTypeCtor('ModComment', EntityExtends.ModComment);
    store.registerEntityTypeCtor('ModDependency', _InternalFakeCtors.ModDependency);
    store.registerEntityTypeCtor('ModDependent', _InternalFakeCtors.ModDependent);
    store.registerEntityTypeCtor('ModFileTransferPolicy', _InternalFakeCtors.ModFileTransferPolicy);
    store.registerEntityTypeCtor('ModImageFileTransferPolicy', _InternalFakeCtors.ModImageFileTransferPolicy);
    store.registerEntityTypeCtor('ModInfo', _InternalFakeCtors.ModInfo);
    store.registerEntityTypeCtor('ModMediaItem', _InternalFakeCtors.ModMediaItem);
    store.registerEntityTypeCtor('ModStat', _InternalFakeCtors.ModStat);
    store.registerEntityTypeCtor('ModUpdate', _InternalFakeCtors.ModUpdate);
    store.registerEntityTypeCtor('ModUserGroup', _InternalFakeCtors.ModUserGroup);
    store.registerEntityTypeCtor('ModGroupUser', _InternalFakeCtors.ModGroupUser);
    store.registerEntityTypeCtor('CollectionVersionServer', _InternalFakeCtors.CollectionVersionServer);
    store.registerEntityTypeCtor('CollectionMediaItem', _InternalFakeCtors.CollectionMediaItem);
    store.registerEntityTypeCtor('CollectionStat', _InternalFakeCtors.CollectionStat);
    store.registerEntityTypeCtor('Game', EntityExtends.Game);
    store.registerEntityTypeCtor('GameStat', _InternalFakeCtors.GameStat);
    store.registerEntityTypeCtor('GroupMembership', _InternalFakeCtors.GroupMembership);
    store.registerEntityTypeCtor('Group', _InternalFakeCtors.Group);
    store.registerEntityTypeCtor('Comment', EntityExtends.Comment);
    store.registerEntityTypeCtor('WallPostComment', _InternalFakeCtors.WallPostComment);
    store.registerEntityTypeCtor('Server', _InternalFakeCtors.Server);
    store.registerEntityTypeCtor('ServerComment', EntityExtends.ServerComment);
    store.registerEntityTypeCtor('Player', _InternalFakeCtors.Player);
    store.registerEntityTypeCtor('MissionComment', EntityExtends.MissionComment);
    store.registerEntityTypeCtor('Mission', EntityExtends.Mission);
    store.registerEntityTypeCtor('MissionFeature', _InternalFakeCtors.MissionFeature);
    store.registerEntityTypeCtor('MissionVersion', _InternalFakeCtors.MissionVersion);
    store.registerEntityTypeCtor('MissionVersionDependency', _InternalFakeCtors.MissionVersionDependency);
    store.registerEntityTypeCtor('MissionVersionSide', _InternalFakeCtors.MissionVersionSide);
    store.registerEntityTypeCtor('MissionMediaItem', _InternalFakeCtors.MissionMediaItem);
    store.registerEntityTypeCtor('MissionImage', _InternalFakeCtors.MissionImage);
    store.registerEntityTypeCtor('MissionVideo', _InternalFakeCtors.MissionVideo);
    store.registerEntityTypeCtor('MissionStat', _InternalFakeCtors.MissionStat);
    store.registerEntityTypeCtor('ModCategory', _InternalFakeCtors.ModCategory);
    store.registerEntityTypeCtor('ModInCategory', _InternalFakeCtors.ModInCategory);
    store.registerEntityTypeCtor('PostComment', EntityExtends.PostComment);
    store.registerEntityTypeCtor('Post', _InternalFakeCtors.Post);
    store.registerEntityTypeCtor('CreateBlog', _InternalFakeCtors.CreateBlog);
    store.registerEntityTypeCtor('CreateBlogCommand', _InternalFakeCtors.CreateBlogCommand);
    store.registerEntityTypeCtor('EditBlogCommand', _InternalFakeCtors.EditBlogCommand);
    store.registerEntityTypeCtor('DeleteBlogCommand', _InternalFakeCtors.DeleteBlogCommand);
    store.registerEntityTypeCtor('UpdateBlogCommand', _InternalFakeCtors.UpdateBlogCommand);
    store.registerEntityTypeCtor('Product', _InternalFakeCtors.Product);
		}
}
export module BreezeEntityGraph {
		var defaultEntityManager: breeze.EntityManager;

		export var initialize = (entityManager: breeze.EntityManager) => {
    if (defaultEntityManager != null)
      throw new Error('EntityGraph has already been initialized');
    defaultEntityManager = entityManager;
		};

		export class Range {
    static $name: string = "Range";
    $name: string = "Range";
    $type: string = "Range";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Range): IBreezeRange;
    static createEntity(config?: _IntDefs.__opt_Range): IBreezeRange;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Range): IBreezeRange {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeRange>entityManagerOrConfig.createEntity("Range", config);
      } else {
        return <IBreezeRange>defaultEntityManager.createEntity("Range", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Range): IBreezeRange;
    public createEntity(config?: _IntDefs.__opt_Range): IBreezeRange;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Range): IBreezeRange {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeRange>entityManagerOrConfig.createEntity("Range", config);
      } else {
        return <IBreezeRange>defaultEntityManager.createEntity("Range", entityManagerOrConfig);
      }
    }
		}
		export class Respawn {
    static $name: string = "Respawn";
    $name: string = "Respawn";
    $type: string = "Respawn";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Respawn): IBreezeRespawn;
    static createEntity(config?: _IntDefs.__opt_Respawn): IBreezeRespawn;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Respawn): IBreezeRespawn {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeRespawn>entityManagerOrConfig.createEntity("Respawn", config);
      } else {
        return <IBreezeRespawn>defaultEntityManager.createEntity("Respawn", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Respawn): IBreezeRespawn;
    public createEntity(config?: _IntDefs.__opt_Respawn): IBreezeRespawn;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Respawn): IBreezeRespawn {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeRespawn>entityManagerOrConfig.createEntity("Respawn", config);
      } else {
        return <IBreezeRespawn>defaultEntityManager.createEntity("Respawn", entityManagerOrConfig);
      }
    }
		}
		export class Weather {
    static $name: string = "Weather";
    $name: string = "Weather";
    $type: string = "Weather";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Weather): IBreezeWeather;
    static createEntity(config?: _IntDefs.__opt_Weather): IBreezeWeather;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Weather): IBreezeWeather {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWeather>entityManagerOrConfig.createEntity("Weather", config);
      } else {
        return <IBreezeWeather>defaultEntityManager.createEntity("Weather", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Weather): IBreezeWeather;
    public createEntity(config?: _IntDefs.__opt_Weather): IBreezeWeather;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Weather): IBreezeWeather {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWeather>entityManagerOrConfig.createEntity("Weather", config);
      } else {
        return <IBreezeWeather>defaultEntityManager.createEntity("Weather", entityManagerOrConfig);
      }
    }
		}
		export class AppComment {
    static $name: string = "AppComment";
    $name: string = "AppComment";
    $type: string = "AppComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static app = (): App => new App("app");
    static author = (): User => new User("author");
    static replies = (): AppComment => new AppComment("replies");
    static replyTo = (): AppComment => new AppComment("replyTo");

    app = (): App => new App(this.$name + "." + "app");
    author = (): User => new User(this.$name + "." + "author");
    replies = (): AppComment => new AppComment(this.$name + "." + "replies");
    replyTo = (): AppComment => new AppComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppComment): IBreezeAppComment;
    static createEntity(config?: _IntDefs.__opt_AppComment): IBreezeAppComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppComment): IBreezeAppComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppComment>entityManagerOrConfig.createEntity("AppComment", config);
      } else {
        return <IBreezeAppComment>defaultEntityManager.createEntity("AppComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppComment): IBreezeAppComment;
    public createEntity(config?: _IntDefs.__opt_AppComment): IBreezeAppComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppComment): IBreezeAppComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppComment>entityManagerOrConfig.createEntity("AppComment", config);
      } else {
        return <IBreezeAppComment>defaultEntityManager.createEntity("AppComment", entityManagerOrConfig);
      }
    }
		}
		export class App {
    static $name: string = "App";
    $name: string = "App";
    $type: string = "App";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): AppComment => new AppComment("comments");
    static entityModule = (): AppEntityModule => new AppEntityModule("entityModule");
    static games = (): GameInApp => new GameInApp("games");
    static mediaItems = (): AppMediaItem => new AppMediaItem("mediaItems");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): AppComment => new AppComment(this.$name + "." + "comments");
    entityModule = (): AppEntityModule => new AppEntityModule(this.$name + "." + "entityModule");
    games = (): GameInApp => new GameInApp(this.$name + "." + "games");
    mediaItems = (): AppMediaItem => new AppMediaItem(this.$name + "." + "mediaItems");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_App): IBreezeApp;
    static createEntity(config?: _IntDefs.__opt_App): IBreezeApp;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_App): IBreezeApp {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeApp>entityManagerOrConfig.createEntity("App", config);
      } else {
        return <IBreezeApp>defaultEntityManager.createEntity("App", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_App): IBreezeApp;
    public createEntity(config?: _IntDefs.__opt_App): IBreezeApp;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_App): IBreezeApp {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeApp>entityManagerOrConfig.createEntity("App", config);
      } else {
        return <IBreezeApp>defaultEntityManager.createEntity("App", entityManagerOrConfig);
      }
    }
		}
		export class User {
    static $name: string = "User";
    $name: string = "User";
    $type: string = "User";

			 constructor(name: string) {
      this.$name = name;
    }

    static entityModule = (): UserEntityModule => new UserEntityModule("entityModule");

    entityModule = (): UserEntityModule => new UserEntityModule(this.$name + "." + "entityModule");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_User): IBreezeUser;
    static createEntity(config?: _IntDefs.__opt_User): IBreezeUser;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_User): IBreezeUser {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUser>entityManagerOrConfig.createEntity("User", config);
      } else {
        return <IBreezeUser>defaultEntityManager.createEntity("User", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_User): IBreezeUser;
    public createEntity(config?: _IntDefs.__opt_User): IBreezeUser;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_User): IBreezeUser {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUser>entityManagerOrConfig.createEntity("User", config);
      } else {
        return <IBreezeUser>defaultEntityManager.createEntity("User", entityManagerOrConfig);
      }
    }
		}
		export class EntityModuleComment {
    static $name: string = "EntityModuleComment";
    $name: string = "EntityModuleComment";
    $type: string = "EntityModuleComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static entityModule = (): EntityModule => new EntityModule("entityModule");
    static replies = (): EntityModuleComment => new EntityModuleComment("replies");
    static replyTo = (): EntityModuleComment => new EntityModuleComment("replyTo");

    author = (): User => new User(this.$name + "." + "author");
    entityModule = (): EntityModule => new EntityModule(this.$name + "." + "entityModule");
    replies = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "replies");
    replyTo = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment;
    static createEntity(config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeEntityModuleComment>entityManagerOrConfig.createEntity("EntityModuleComment", config);
      } else {
        return <IBreezeEntityModuleComment>defaultEntityManager.createEntity("EntityModuleComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment;
    public createEntity(config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EntityModuleComment): IBreezeEntityModuleComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeEntityModuleComment>entityManagerOrConfig.createEntity("EntityModuleComment", config);
      } else {
        return <IBreezeEntityModuleComment>defaultEntityManager.createEntity("EntityModuleComment", entityManagerOrConfig);
      }
    }
		}
		export class EntityModule {
    static $name: string = "EntityModule";
    $name: string = "EntityModule";
    $type: string = "EntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule;
    static createEntity(config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeEntityModule>entityManagerOrConfig.createEntity("EntityModule", config);
      } else {
        return <AbstractDefs.IBreezeEntityModule>defaultEntityManager.createEntity("EntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule;
    public createEntity(config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EntityModule): AbstractDefs.IBreezeEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeEntityModule>entityManagerOrConfig.createEntity("EntityModule", config);
      } else {
        return <AbstractDefs.IBreezeEntityModule>defaultEntityManager.createEntity("EntityModule", entityManagerOrConfig);
      }
    }
		}
		export class UserEntityModule {
    static $name: string = "UserEntityModule";
    $name: string = "UserEntityModule";
    $type: string = "UserEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule;
    static createEntity(config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUserEntityModule>entityManagerOrConfig.createEntity("UserEntityModule", config);
      } else {
        return <IBreezeUserEntityModule>defaultEntityManager.createEntity("UserEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule;
    public createEntity(config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_UserEntityModule): IBreezeUserEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUserEntityModule>entityManagerOrConfig.createEntity("UserEntityModule", config);
      } else {
        return <IBreezeUserEntityModule>defaultEntityManager.createEntity("UserEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class Wall {
    static $name: string = "Wall";
    $name: string = "Wall";
    $type: string = "Wall";

			 constructor(name: string) {
      this.$name = name;
    }

    static entityModule = (): EntityModule => new EntityModule("entityModule");
    static posts = (): WallPost => new WallPost("posts");

    entityModule = (): EntityModule => new EntityModule(this.$name + "." + "entityModule");
    posts = (): WallPost => new WallPost(this.$name + "." + "posts");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Wall): IBreezeWall;
    static createEntity(config?: _IntDefs.__opt_Wall): IBreezeWall;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Wall): IBreezeWall {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWall>entityManagerOrConfig.createEntity("Wall", config);
      } else {
        return <IBreezeWall>defaultEntityManager.createEntity("Wall", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Wall): IBreezeWall;
    public createEntity(config?: _IntDefs.__opt_Wall): IBreezeWall;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Wall): IBreezeWall {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWall>entityManagerOrConfig.createEntity("Wall", config);
      } else {
        return <IBreezeWall>defaultEntityManager.createEntity("Wall", entityManagerOrConfig);
      }
    }
		}
		export class WallPost {
    static $name: string = "WallPost";
    $name: string = "WallPost";
    $type: string = "WallPost";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): WallPostComment => new WallPostComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): WallPostComment => new WallPostComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_WallPost): IBreezeWallPost;
    static createEntity(config?: _IntDefs.__opt_WallPost): IBreezeWallPost;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_WallPost): IBreezeWallPost {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWallPost>entityManagerOrConfig.createEntity("WallPost", config);
      } else {
        return <IBreezeWallPost>defaultEntityManager.createEntity("WallPost", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_WallPost): IBreezeWallPost;
    public createEntity(config?: _IntDefs.__opt_WallPost): IBreezeWallPost;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_WallPost): IBreezeWallPost {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWallPost>entityManagerOrConfig.createEntity("WallPost", config);
      } else {
        return <IBreezeWallPost>defaultEntityManager.createEntity("WallPost", entityManagerOrConfig);
      }
    }
		}
		export class AppEntityModule {
    static $name: string = "AppEntityModule";
    $name: string = "AppEntityModule";
    $type: string = "AppEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule;
    static createEntity(config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppEntityModule>entityManagerOrConfig.createEntity("AppEntityModule", config);
      } else {
        return <IBreezeAppEntityModule>defaultEntityManager.createEntity("AppEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule;
    public createEntity(config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppEntityModule): IBreezeAppEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppEntityModule>entityManagerOrConfig.createEntity("AppEntityModule", config);
      } else {
        return <IBreezeAppEntityModule>defaultEntityManager.createEntity("AppEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class CollectionEntityModule {
    static $name: string = "CollectionEntityModule";
    $name: string = "CollectionEntityModule";
    $type: string = "CollectionEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule;
    static createEntity(config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionEntityModule>entityManagerOrConfig.createEntity("CollectionEntityModule", config);
      } else {
        return <IBreezeCollectionEntityModule>defaultEntityManager.createEntity("CollectionEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule;
    public createEntity(config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionEntityModule): IBreezeCollectionEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionEntityModule>entityManagerOrConfig.createEntity("CollectionEntityModule", config);
      } else {
        return <IBreezeCollectionEntityModule>defaultEntityManager.createEntity("CollectionEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class GroupEntityModule {
    static $name: string = "GroupEntityModule";
    $name: string = "GroupEntityModule";
    $type: string = "GroupEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule;
    static createEntity(config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupEntityModule>entityManagerOrConfig.createEntity("GroupEntityModule", config);
      } else {
        return <IBreezeGroupEntityModule>defaultEntityManager.createEntity("GroupEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule;
    public createEntity(config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupEntityModule): IBreezeGroupEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupEntityModule>entityManagerOrConfig.createEntity("GroupEntityModule", config);
      } else {
        return <IBreezeGroupEntityModule>defaultEntityManager.createEntity("GroupEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class MissionEntityModule {
    static $name: string = "MissionEntityModule";
    $name: string = "MissionEntityModule";
    $type: string = "MissionEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule;
    static createEntity(config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionEntityModule>entityManagerOrConfig.createEntity("MissionEntityModule", config);
      } else {
        return <IBreezeMissionEntityModule>defaultEntityManager.createEntity("MissionEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule;
    public createEntity(config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionEntityModule): IBreezeMissionEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionEntityModule>entityManagerOrConfig.createEntity("MissionEntityModule", config);
      } else {
        return <IBreezeMissionEntityModule>defaultEntityManager.createEntity("MissionEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class ModEntityModule {
    static $name: string = "ModEntityModule";
    $name: string = "ModEntityModule";
    $type: string = "ModEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule;
    static createEntity(config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModEntityModule>entityManagerOrConfig.createEntity("ModEntityModule", config);
      } else {
        return <IBreezeModEntityModule>defaultEntityManager.createEntity("ModEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule;
    public createEntity(config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModEntityModule): IBreezeModEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModEntityModule>entityManagerOrConfig.createEntity("ModEntityModule", config);
      } else {
        return <IBreezeModEntityModule>defaultEntityManager.createEntity("ModEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class ServerEntityModule {
    static $name: string = "ServerEntityModule";
    $name: string = "ServerEntityModule";
    $type: string = "ServerEntityModule";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): EntityModuleComment => new EntityModuleComment("comments");
    static wall = (): Wall => new Wall("wall");

    comments = (): EntityModuleComment => new EntityModuleComment(this.$name + "." + "comments");
    wall = (): Wall => new Wall(this.$name + "." + "wall");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule;
    static createEntity(config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServerEntityModule>entityManagerOrConfig.createEntity("ServerEntityModule", config);
      } else {
        return <IBreezeServerEntityModule>defaultEntityManager.createEntity("ServerEntityModule", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule;
    public createEntity(config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ServerEntityModule): IBreezeServerEntityModule {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServerEntityModule>entityManagerOrConfig.createEntity("ServerEntityModule", config);
      } else {
        return <IBreezeServerEntityModule>defaultEntityManager.createEntity("ServerEntityModule", entityManagerOrConfig);
      }
    }
		}
		export class GameInApp {
    static $name: string = "GameInApp";
    $name: string = "GameInApp";
    $type: string = "GameInApp";

			 constructor(name: string) {
      this.$name = name;
    }

    static app = (): App => new App("app");

    app = (): App => new App(this.$name + "." + "app");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp;
    static createEntity(config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameInApp>entityManagerOrConfig.createEntity("GameInApp", config);
      } else {
        return <IBreezeGameInApp>defaultEntityManager.createEntity("GameInApp", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp;
    public createEntity(config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameInApp): IBreezeGameInApp {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameInApp>entityManagerOrConfig.createEntity("GameInApp", config);
      } else {
        return <IBreezeGameInApp>defaultEntityManager.createEntity("GameInApp", entityManagerOrConfig);
      }
    }
		}
		export class AppMediaItem {
    static $name: string = "AppMediaItem";
    $name: string = "AppMediaItem";
    $type: string = "AppMediaItem";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static app = (): App => new App("app");

    account = (): User => new User(this.$name + "." + "account");
    app = (): App => new App(this.$name + "." + "app");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem;
    static createEntity(config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppMediaItem>entityManagerOrConfig.createEntity("AppMediaItem", config);
      } else {
        return <IBreezeAppMediaItem>defaultEntityManager.createEntity("AppMediaItem", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem;
    public createEntity(config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AppMediaItem): IBreezeAppMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAppMediaItem>entityManagerOrConfig.createEntity("AppMediaItem", config);
      } else {
        return <IBreezeAppMediaItem>defaultEntityManager.createEntity("AppMediaItem", entityManagerOrConfig);
      }
    }
		}
		export class CollectionComment {
    static $name: string = "CollectionComment";
    $name: string = "CollectionComment";
    $type: string = "CollectionComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static collection = (): Collection => new Collection("collection");
    static replies = (): CollectionComment => new CollectionComment("replies");
    static replyTo = (): CollectionComment => new CollectionComment("replyTo");

    author = (): User => new User(this.$name + "." + "author");
    collection = (): Collection => new Collection(this.$name + "." + "collection");
    replies = (): CollectionComment => new CollectionComment(this.$name + "." + "replies");
    replyTo = (): CollectionComment => new CollectionComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment;
    static createEntity(config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionComment>entityManagerOrConfig.createEntity("CollectionComment", config);
      } else {
        return <IBreezeCollectionComment>defaultEntityManager.createEntity("CollectionComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment;
    public createEntity(config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionComment): IBreezeCollectionComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionComment>entityManagerOrConfig.createEntity("CollectionComment", config);
      } else {
        return <IBreezeCollectionComment>defaultEntityManager.createEntity("CollectionComment", entityManagerOrConfig);
      }
    }
		}
		export class Collection {
    static $name: string = "Collection";
    $name: string = "Collection";
    $type: string = "Collection";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): CollectionComment => new CollectionComment("comments");
    static entityModule = (): CollectionEntityModule => new CollectionEntityModule("entityModule");
    static fileTransferPolicies = (): CollectionFileTransferPolicy => new CollectionFileTransferPolicy("fileTransferPolicies");
    static forkedCollection = (): Collection => new Collection("forkedCollection");
    static forkedCollections = (): Collection => new Collection("forkedCollections");
    static game = (): GameInContent => new GameInContent("game");
    static group = (): GroupInContent => new GroupInContent("group");
    static latestVersion = (): CollectionVersion => new CollectionVersion("latestVersion");
    static mediaItems = (): CollectionMediaItem => new CollectionMediaItem("mediaItems");
    static stat = (): CollectionStat => new CollectionStat("stat");
    static versions = (): CollectionVersion => new CollectionVersion("versions");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): CollectionComment => new CollectionComment(this.$name + "." + "comments");
    entityModule = (): CollectionEntityModule => new CollectionEntityModule(this.$name + "." + "entityModule");
    fileTransferPolicies = (): CollectionFileTransferPolicy => new CollectionFileTransferPolicy(this.$name + "." + "fileTransferPolicies");
    forkedCollection = (): Collection => new Collection(this.$name + "." + "forkedCollection");
    forkedCollections = (): Collection => new Collection(this.$name + "." + "forkedCollections");
    game = (): GameInContent => new GameInContent(this.$name + "." + "game");
    group = (): GroupInContent => new GroupInContent(this.$name + "." + "group");
    latestVersion = (): CollectionVersion => new CollectionVersion(this.$name + "." + "latestVersion");
    mediaItems = (): CollectionMediaItem => new CollectionMediaItem(this.$name + "." + "mediaItems");
    stat = (): CollectionStat => new CollectionStat(this.$name + "." + "stat");
    versions = (): CollectionVersion => new CollectionVersion(this.$name + "." + "versions");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Collection): IBreezeCollection;
    static createEntity(config?: _IntDefs.__opt_Collection): IBreezeCollection;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Collection): IBreezeCollection {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollection>entityManagerOrConfig.createEntity("Collection", config);
      } else {
        return <IBreezeCollection>defaultEntityManager.createEntity("Collection", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Collection): IBreezeCollection;
    public createEntity(config?: _IntDefs.__opt_Collection): IBreezeCollection;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Collection): IBreezeCollection {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollection>entityManagerOrConfig.createEntity("Collection", config);
      } else {
        return <IBreezeCollection>defaultEntityManager.createEntity("Collection", entityManagerOrConfig);
      }
    }
		}
		export class CollectionFileTransferPolicy {
    static $name: string = "CollectionFileTransferPolicy";
    $name: string = "CollectionFileTransferPolicy";
    $type: string = "CollectionFileTransferPolicy";

			 constructor(name: string) {
      this.$name = name;
    }

    static collection = (): Collection => new Collection("collection");
    static uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy("uploadPolicy");

    collection = (): Collection => new Collection(this.$name + "." + "collection");
    uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy(this.$name + "." + "uploadPolicy");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy;
    static createEntity(config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionFileTransferPolicy>entityManagerOrConfig.createEntity("CollectionFileTransferPolicy", config);
      } else {
        return <IBreezeCollectionFileTransferPolicy>defaultEntityManager.createEntity("CollectionFileTransferPolicy", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy;
    public createEntity(config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionFileTransferPolicy): IBreezeCollectionFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionFileTransferPolicy>entityManagerOrConfig.createEntity("CollectionFileTransferPolicy", config);
      } else {
        return <IBreezeCollectionFileTransferPolicy>defaultEntityManager.createEntity("CollectionFileTransferPolicy", entityManagerOrConfig);
      }
    }
		}
		export class AWSUploadPolicy {
    static $name: string = "AWSUploadPolicy";
    $name: string = "AWSUploadPolicy";
    $type: string = "AWSUploadPolicy";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy;
    static createEntity(config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAWSUploadPolicy>entityManagerOrConfig.createEntity("AWSUploadPolicy", config);
      } else {
        return <IBreezeAWSUploadPolicy>defaultEntityManager.createEntity("AWSUploadPolicy", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy;
    public createEntity(config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_AWSUploadPolicy): IBreezeAWSUploadPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeAWSUploadPolicy>entityManagerOrConfig.createEntity("AWSUploadPolicy", config);
      } else {
        return <IBreezeAWSUploadPolicy>defaultEntityManager.createEntity("AWSUploadPolicy", entityManagerOrConfig);
      }
    }
		}
		export class CollectionImageFileTransferPolicy {
    static $name: string = "CollectionImageFileTransferPolicy";
    $name: string = "CollectionImageFileTransferPolicy";
    $type: string = "CollectionImageFileTransferPolicy";

			 constructor(name: string) {
      this.$name = name;
    }

    static collection = (): Collection => new Collection("collection");
    static uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy("uploadPolicy");

    collection = (): Collection => new Collection(this.$name + "." + "collection");
    uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy(this.$name + "." + "uploadPolicy");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy;
    static createEntity(config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionImageFileTransferPolicy>entityManagerOrConfig.createEntity("CollectionImageFileTransferPolicy", config);
      } else {
        return <IBreezeCollectionImageFileTransferPolicy>defaultEntityManager.createEntity("CollectionImageFileTransferPolicy", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy;
    public createEntity(config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionImageFileTransferPolicy): IBreezeCollectionImageFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionImageFileTransferPolicy>entityManagerOrConfig.createEntity("CollectionImageFileTransferPolicy", config);
      } else {
        return <IBreezeCollectionImageFileTransferPolicy>defaultEntityManager.createEntity("CollectionImageFileTransferPolicy", entityManagerOrConfig);
      }
    }
		}
		export class GameInContent {
    static $name: string = "GameInContent";
    $name: string = "GameInContent";
    $type: string = "GameInContent";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent;
    static createEntity(config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameInContent>entityManagerOrConfig.createEntity("GameInContent", config);
      } else {
        return <IBreezeGameInContent>defaultEntityManager.createEntity("GameInContent", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent;
    public createEntity(config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameInContent): IBreezeGameInContent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameInContent>entityManagerOrConfig.createEntity("GameInContent", config);
      } else {
        return <IBreezeGameInContent>defaultEntityManager.createEntity("GameInContent", entityManagerOrConfig);
      }
    }
		}
		export class GameModStat {
    static $name: string = "GameModStat";
    $name: string = "GameModStat";
    $type: string = "GameModStat";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat;
    static createEntity(config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameModStat>entityManagerOrConfig.createEntity("GameModStat", config);
      } else {
        return <IBreezeGameModStat>defaultEntityManager.createEntity("GameModStat", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat;
    public createEntity(config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameModStat): IBreezeGameModStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameModStat>entityManagerOrConfig.createEntity("GameModStat", config);
      } else {
        return <IBreezeGameModStat>defaultEntityManager.createEntity("GameModStat", entityManagerOrConfig);
      }
    }
		}
		export class GroupInContent {
    static $name: string = "GroupInContent";
    $name: string = "GroupInContent";
    $type: string = "GroupInContent";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent;
    static createEntity(config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupInContent>entityManagerOrConfig.createEntity("GroupInContent", config);
      } else {
        return <IBreezeGroupInContent>defaultEntityManager.createEntity("GroupInContent", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent;
    public createEntity(config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupInContent): IBreezeGroupInContent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupInContent>entityManagerOrConfig.createEntity("GroupInContent", config);
      } else {
        return <IBreezeGroupInContent>defaultEntityManager.createEntity("GroupInContent", entityManagerOrConfig);
      }
    }
		}
		export class CollectionVersion {
    static $name: string = "CollectionVersion";
    $name: string = "CollectionVersion";
    $type: string = "CollectionVersion";

			 constructor(name: string) {
      this.$name = name;
    }

    static collection = (): Collection => new Collection("collection");
    static dependencies = (): CollectionVersionDependency => new CollectionVersionDependency("dependencies");
    static servers = (): CollectionVersionServer => new CollectionVersionServer("servers");

    collection = (): Collection => new Collection(this.$name + "." + "collection");
    dependencies = (): CollectionVersionDependency => new CollectionVersionDependency(this.$name + "." + "dependencies");
    servers = (): CollectionVersionServer => new CollectionVersionServer(this.$name + "." + "servers");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion;
    static createEntity(config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersion>entityManagerOrConfig.createEntity("CollectionVersion", config);
      } else {
        return <IBreezeCollectionVersion>defaultEntityManager.createEntity("CollectionVersion", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion;
    public createEntity(config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersion): IBreezeCollectionVersion {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersion>entityManagerOrConfig.createEntity("CollectionVersion", config);
      } else {
        return <IBreezeCollectionVersion>defaultEntityManager.createEntity("CollectionVersion", entityManagerOrConfig);
      }
    }
		}
		export class CollectionVersionDependency {
    static $name: string = "CollectionVersionDependency";
    $name: string = "CollectionVersionDependency";
    $type: string = "CollectionVersionDependency";

			 constructor(name: string) {
      this.$name = name;
    }

    static collectionVersion = (): CollectionVersion => new CollectionVersion("collectionVersion");
    static modDependency = (): Mod => new Mod("modDependency");

    collectionVersion = (): CollectionVersion => new CollectionVersion(this.$name + "." + "collectionVersion");
    modDependency = (): Mod => new Mod(this.$name + "." + "modDependency");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency;
    static createEntity(config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersionDependency>entityManagerOrConfig.createEntity("CollectionVersionDependency", config);
      } else {
        return <IBreezeCollectionVersionDependency>defaultEntityManager.createEntity("CollectionVersionDependency", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency;
    public createEntity(config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersionDependency): IBreezeCollectionVersionDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersionDependency>entityManagerOrConfig.createEntity("CollectionVersionDependency", config);
      } else {
        return <IBreezeCollectionVersionDependency>defaultEntityManager.createEntity("CollectionVersionDependency", entityManagerOrConfig);
      }
    }
		}
		export class Mod {
    static $name: string = "Mod";
    $name: string = "Mod";
    $type: string = "Mod";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static categories = (): ModCategoryInMod => new ModCategoryInMod("categories");
    static collections = (): CollectionInMod => new CollectionInMod("collections");
    static comments = (): ModComment => new ModComment("comments");
    static dependencies = (): ModDependency => new ModDependency("dependencies");
    static dependents = (): ModDependent => new ModDependent("dependents");
    static entityModule = (): ModEntityModule => new ModEntityModule("entityModule");
    static fileTransferPolicies = (): ModFileTransferPolicy => new ModFileTransferPolicy("fileTransferPolicies");
    static game = (): GameInContent => new GameInContent("game");
    static group = (): GroupInContent => new GroupInContent("group");
    static info = (): ModInfo => new ModInfo("info");
    static mediaItems = (): ModMediaItem => new ModMediaItem("mediaItems");
    static stat = (): ModStat => new ModStat("stat");
    static updates = (): ModUpdate => new ModUpdate("updates");
    static userGroups = (): ModUserGroup => new ModUserGroup("userGroups");

    author = (): User => new User(this.$name + "." + "author");
    categories = (): ModCategoryInMod => new ModCategoryInMod(this.$name + "." + "categories");
    collections = (): CollectionInMod => new CollectionInMod(this.$name + "." + "collections");
    comments = (): ModComment => new ModComment(this.$name + "." + "comments");
    dependencies = (): ModDependency => new ModDependency(this.$name + "." + "dependencies");
    dependents = (): ModDependent => new ModDependent(this.$name + "." + "dependents");
    entityModule = (): ModEntityModule => new ModEntityModule(this.$name + "." + "entityModule");
    fileTransferPolicies = (): ModFileTransferPolicy => new ModFileTransferPolicy(this.$name + "." + "fileTransferPolicies");
    game = (): GameInContent => new GameInContent(this.$name + "." + "game");
    group = (): GroupInContent => new GroupInContent(this.$name + "." + "group");
    info = (): ModInfo => new ModInfo(this.$name + "." + "info");
    mediaItems = (): ModMediaItem => new ModMediaItem(this.$name + "." + "mediaItems");
    stat = (): ModStat => new ModStat(this.$name + "." + "stat");
    updates = (): ModUpdate => new ModUpdate(this.$name + "." + "updates");
    userGroups = (): ModUserGroup => new ModUserGroup(this.$name + "." + "userGroups");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Mod): IBreezeMod;
    static createEntity(config?: _IntDefs.__opt_Mod): IBreezeMod;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Mod): IBreezeMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMod>entityManagerOrConfig.createEntity("Mod", config);
      } else {
        return <IBreezeMod>defaultEntityManager.createEntity("Mod", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Mod): IBreezeMod;
    public createEntity(config?: _IntDefs.__opt_Mod): IBreezeMod;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Mod): IBreezeMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMod>entityManagerOrConfig.createEntity("Mod", config);
      } else {
        return <IBreezeMod>defaultEntityManager.createEntity("Mod", entityManagerOrConfig);
      }
    }
		}
		export class ModCategoryInMod {
    static $name: string = "ModCategoryInMod";
    $name: string = "ModCategoryInMod";
    $type: string = "ModCategoryInMod";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod;
    static createEntity(config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModCategoryInMod>entityManagerOrConfig.createEntity("ModCategoryInMod", config);
      } else {
        return <IBreezeModCategoryInMod>defaultEntityManager.createEntity("ModCategoryInMod", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod;
    public createEntity(config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModCategoryInMod): IBreezeModCategoryInMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModCategoryInMod>entityManagerOrConfig.createEntity("ModCategoryInMod", config);
      } else {
        return <IBreezeModCategoryInMod>defaultEntityManager.createEntity("ModCategoryInMod", entityManagerOrConfig);
      }
    }
		}
		export class CollectionInMod {
    static $name: string = "CollectionInMod";
    $name: string = "CollectionInMod";
    $type: string = "CollectionInMod";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod;
    static createEntity(config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionInMod>entityManagerOrConfig.createEntity("CollectionInMod", config);
      } else {
        return <IBreezeCollectionInMod>defaultEntityManager.createEntity("CollectionInMod", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod;
    public createEntity(config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionInMod): IBreezeCollectionInMod {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionInMod>entityManagerOrConfig.createEntity("CollectionInMod", config);
      } else {
        return <IBreezeCollectionInMod>defaultEntityManager.createEntity("CollectionInMod", entityManagerOrConfig);
      }
    }
		}
		export class ModComment {
    static $name: string = "ModComment";
    $name: string = "ModComment";
    $type: string = "ModComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static mod = (): Mod => new Mod("mod");
    static replies = (): ModComment => new ModComment("replies");
    static replyTo = (): ModComment => new ModComment("replyTo");

    author = (): User => new User(this.$name + "." + "author");
    mod = (): Mod => new Mod(this.$name + "." + "mod");
    replies = (): ModComment => new ModComment(this.$name + "." + "replies");
    replyTo = (): ModComment => new ModComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModComment): IBreezeModComment;
    static createEntity(config?: _IntDefs.__opt_ModComment): IBreezeModComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModComment): IBreezeModComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModComment>entityManagerOrConfig.createEntity("ModComment", config);
      } else {
        return <IBreezeModComment>defaultEntityManager.createEntity("ModComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModComment): IBreezeModComment;
    public createEntity(config?: _IntDefs.__opt_ModComment): IBreezeModComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModComment): IBreezeModComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModComment>entityManagerOrConfig.createEntity("ModComment", config);
      } else {
        return <IBreezeModComment>defaultEntityManager.createEntity("ModComment", entityManagerOrConfig);
      }
    }
		}
		export class ModDependency {
    static $name: string = "ModDependency";
    $name: string = "ModDependency";
    $type: string = "ModDependency";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModDependency): IBreezeModDependency;
    static createEntity(config?: _IntDefs.__opt_ModDependency): IBreezeModDependency;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModDependency): IBreezeModDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModDependency>entityManagerOrConfig.createEntity("ModDependency", config);
      } else {
        return <IBreezeModDependency>defaultEntityManager.createEntity("ModDependency", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModDependency): IBreezeModDependency;
    public createEntity(config?: _IntDefs.__opt_ModDependency): IBreezeModDependency;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModDependency): IBreezeModDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModDependency>entityManagerOrConfig.createEntity("ModDependency", config);
      } else {
        return <IBreezeModDependency>defaultEntityManager.createEntity("ModDependency", entityManagerOrConfig);
      }
    }
		}
		export class ModDependent {
    static $name: string = "ModDependent";
    $name: string = "ModDependent";
    $type: string = "ModDependent";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModDependent): IBreezeModDependent;
    static createEntity(config?: _IntDefs.__opt_ModDependent): IBreezeModDependent;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModDependent): IBreezeModDependent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModDependent>entityManagerOrConfig.createEntity("ModDependent", config);
      } else {
        return <IBreezeModDependent>defaultEntityManager.createEntity("ModDependent", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModDependent): IBreezeModDependent;
    public createEntity(config?: _IntDefs.__opt_ModDependent): IBreezeModDependent;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModDependent): IBreezeModDependent {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModDependent>entityManagerOrConfig.createEntity("ModDependent", config);
      } else {
        return <IBreezeModDependent>defaultEntityManager.createEntity("ModDependent", entityManagerOrConfig);
      }
    }
		}
		export class ModFileTransferPolicy {
    static $name: string = "ModFileTransferPolicy";
    $name: string = "ModFileTransferPolicy";
    $type: string = "ModFileTransferPolicy";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");
    static uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy("uploadPolicy");

    mod = (): Mod => new Mod(this.$name + "." + "mod");
    uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy(this.$name + "." + "uploadPolicy");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy;
    static createEntity(config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModFileTransferPolicy>entityManagerOrConfig.createEntity("ModFileTransferPolicy", config);
      } else {
        return <IBreezeModFileTransferPolicy>defaultEntityManager.createEntity("ModFileTransferPolicy", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy;
    public createEntity(config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModFileTransferPolicy): IBreezeModFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModFileTransferPolicy>entityManagerOrConfig.createEntity("ModFileTransferPolicy", config);
      } else {
        return <IBreezeModFileTransferPolicy>defaultEntityManager.createEntity("ModFileTransferPolicy", entityManagerOrConfig);
      }
    }
		}
		export class ModImageFileTransferPolicy {
    static $name: string = "ModImageFileTransferPolicy";
    $name: string = "ModImageFileTransferPolicy";
    $type: string = "ModImageFileTransferPolicy";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");
    static uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy("uploadPolicy");

    mod = (): Mod => new Mod(this.$name + "." + "mod");
    uploadPolicy = (): AWSUploadPolicy => new AWSUploadPolicy(this.$name + "." + "uploadPolicy");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy;
    static createEntity(config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModImageFileTransferPolicy>entityManagerOrConfig.createEntity("ModImageFileTransferPolicy", config);
      } else {
        return <IBreezeModImageFileTransferPolicy>defaultEntityManager.createEntity("ModImageFileTransferPolicy", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy;
    public createEntity(config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModImageFileTransferPolicy): IBreezeModImageFileTransferPolicy {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModImageFileTransferPolicy>entityManagerOrConfig.createEntity("ModImageFileTransferPolicy", config);
      } else {
        return <IBreezeModImageFileTransferPolicy>defaultEntityManager.createEntity("ModImageFileTransferPolicy", entityManagerOrConfig);
      }
    }
		}
		export class ModInfo {
    static $name: string = "ModInfo";
    $name: string = "ModInfo";
    $type: string = "ModInfo";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModInfo): IBreezeModInfo;
    static createEntity(config?: _IntDefs.__opt_ModInfo): IBreezeModInfo;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModInfo): IBreezeModInfo {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModInfo>entityManagerOrConfig.createEntity("ModInfo", config);
      } else {
        return <IBreezeModInfo>defaultEntityManager.createEntity("ModInfo", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModInfo): IBreezeModInfo;
    public createEntity(config?: _IntDefs.__opt_ModInfo): IBreezeModInfo;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModInfo): IBreezeModInfo {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModInfo>entityManagerOrConfig.createEntity("ModInfo", config);
      } else {
        return <IBreezeModInfo>defaultEntityManager.createEntity("ModInfo", entityManagerOrConfig);
      }
    }
		}
		export class ModMediaItem {
    static $name: string = "ModMediaItem";
    $name: string = "ModMediaItem";
    $type: string = "ModMediaItem";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static mod = (): Mod => new Mod("mod");

    account = (): User => new User(this.$name + "." + "account");
    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem;
    static createEntity(config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModMediaItem>entityManagerOrConfig.createEntity("ModMediaItem", config);
      } else {
        return <IBreezeModMediaItem>defaultEntityManager.createEntity("ModMediaItem", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem;
    public createEntity(config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModMediaItem): IBreezeModMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModMediaItem>entityManagerOrConfig.createEntity("ModMediaItem", config);
      } else {
        return <IBreezeModMediaItem>defaultEntityManager.createEntity("ModMediaItem", entityManagerOrConfig);
      }
    }
		}
		export class ModStat {
    static $name: string = "ModStat";
    $name: string = "ModStat";
    $type: string = "ModStat";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");

    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModStat): IBreezeModStat;
    static createEntity(config?: _IntDefs.__opt_ModStat): IBreezeModStat;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModStat): IBreezeModStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModStat>entityManagerOrConfig.createEntity("ModStat", config);
      } else {
        return <IBreezeModStat>defaultEntityManager.createEntity("ModStat", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModStat): IBreezeModStat;
    public createEntity(config?: _IntDefs.__opt_ModStat): IBreezeModStat;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModStat): IBreezeModStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModStat>entityManagerOrConfig.createEntity("ModStat", config);
      } else {
        return <IBreezeModStat>defaultEntityManager.createEntity("ModStat", entityManagerOrConfig);
      }
    }
		}
		export class ModUpdate {
    static $name: string = "ModUpdate";
    $name: string = "ModUpdate";
    $type: string = "ModUpdate";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static mod = (): Mod => new Mod("mod");

    account = (): User => new User(this.$name + "." + "account");
    mod = (): Mod => new Mod(this.$name + "." + "mod");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate;
    static createEntity(config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModUpdate>entityManagerOrConfig.createEntity("ModUpdate", config);
      } else {
        return <IBreezeModUpdate>defaultEntityManager.createEntity("ModUpdate", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate;
    public createEntity(config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModUpdate): IBreezeModUpdate {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModUpdate>entityManagerOrConfig.createEntity("ModUpdate", config);
      } else {
        return <IBreezeModUpdate>defaultEntityManager.createEntity("ModUpdate", entityManagerOrConfig);
      }
    }
		}
		export class ModUserGroup {
    static $name: string = "ModUserGroup";
    $name: string = "ModUserGroup";
    $type: string = "ModUserGroup";

			 constructor(name: string) {
      this.$name = name;
    }

    static mod = (): Mod => new Mod("mod");
    static users = (): ModGroupUser => new ModGroupUser("users");

    mod = (): Mod => new Mod(this.$name + "." + "mod");
    users = (): ModGroupUser => new ModGroupUser(this.$name + "." + "users");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup;
    static createEntity(config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModUserGroup>entityManagerOrConfig.createEntity("ModUserGroup", config);
      } else {
        return <IBreezeModUserGroup>defaultEntityManager.createEntity("ModUserGroup", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup;
    public createEntity(config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModUserGroup): IBreezeModUserGroup {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModUserGroup>entityManagerOrConfig.createEntity("ModUserGroup", config);
      } else {
        return <IBreezeModUserGroup>defaultEntityManager.createEntity("ModUserGroup", entityManagerOrConfig);
      }
    }
		}
		export class ModGroupUser {
    static $name: string = "ModGroupUser";
    $name: string = "ModGroupUser";
    $type: string = "ModGroupUser";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static modUserGroup = (): ModUserGroup => new ModUserGroup("modUserGroup");

    account = (): User => new User(this.$name + "." + "account");
    modUserGroup = (): ModUserGroup => new ModUserGroup(this.$name + "." + "modUserGroup");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser;
    static createEntity(config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModGroupUser>entityManagerOrConfig.createEntity("ModGroupUser", config);
      } else {
        return <IBreezeModGroupUser>defaultEntityManager.createEntity("ModGroupUser", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser;
    public createEntity(config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModGroupUser): IBreezeModGroupUser {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModGroupUser>entityManagerOrConfig.createEntity("ModGroupUser", config);
      } else {
        return <IBreezeModGroupUser>defaultEntityManager.createEntity("ModGroupUser", entityManagerOrConfig);
      }
    }
		}
		export class CollectionVersionServer {
    static $name: string = "CollectionVersionServer";
    $name: string = "CollectionVersionServer";
    $type: string = "CollectionVersionServer";

			 constructor(name: string) {
      this.$name = name;
    }

    static collectionVersion = (): CollectionVersion => new CollectionVersion("collectionVersion");

    collectionVersion = (): CollectionVersion => new CollectionVersion(this.$name + "." + "collectionVersion");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer;
    static createEntity(config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersionServer>entityManagerOrConfig.createEntity("CollectionVersionServer", config);
      } else {
        return <IBreezeCollectionVersionServer>defaultEntityManager.createEntity("CollectionVersionServer", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer;
    public createEntity(config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionVersionServer): IBreezeCollectionVersionServer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionVersionServer>entityManagerOrConfig.createEntity("CollectionVersionServer", config);
      } else {
        return <IBreezeCollectionVersionServer>defaultEntityManager.createEntity("CollectionVersionServer", entityManagerOrConfig);
      }
    }
		}
		export class CollectionMediaItem {
    static $name: string = "CollectionMediaItem";
    $name: string = "CollectionMediaItem";
    $type: string = "CollectionMediaItem";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static collection = (): Collection => new Collection("collection");

    account = (): User => new User(this.$name + "." + "account");
    collection = (): Collection => new Collection(this.$name + "." + "collection");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem;
    static createEntity(config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionMediaItem>entityManagerOrConfig.createEntity("CollectionMediaItem", config);
      } else {
        return <IBreezeCollectionMediaItem>defaultEntityManager.createEntity("CollectionMediaItem", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem;
    public createEntity(config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionMediaItem): IBreezeCollectionMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionMediaItem>entityManagerOrConfig.createEntity("CollectionMediaItem", config);
      } else {
        return <IBreezeCollectionMediaItem>defaultEntityManager.createEntity("CollectionMediaItem", entityManagerOrConfig);
      }
    }
		}
		export class CollectionStat {
    static $name: string = "CollectionStat";
    $name: string = "CollectionStat";
    $type: string = "CollectionStat";

			 constructor(name: string) {
      this.$name = name;
    }

    static collection = (): Collection => new Collection("collection");

    collection = (): Collection => new Collection(this.$name + "." + "collection");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat;
    static createEntity(config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionStat>entityManagerOrConfig.createEntity("CollectionStat", config);
      } else {
        return <IBreezeCollectionStat>defaultEntityManager.createEntity("CollectionStat", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat;
    public createEntity(config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CollectionStat): IBreezeCollectionStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCollectionStat>entityManagerOrConfig.createEntity("CollectionStat", config);
      } else {
        return <IBreezeCollectionStat>defaultEntityManager.createEntity("CollectionStat", entityManagerOrConfig);
      }
    }
		}
		export class Game {
    static $name: string = "Game";
    $name: string = "Game";
    $type: string = "Game";

			 constructor(name: string) {
      this.$name = name;
    }

    static parent = (): Game => new Game("parent");

    parent = (): Game => new Game(this.$name + "." + "parent");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Game): IBreezeGame;
    static createEntity(config?: _IntDefs.__opt_Game): IBreezeGame;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Game): IBreezeGame {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGame>entityManagerOrConfig.createEntity("Game", config);
      } else {
        return <IBreezeGame>defaultEntityManager.createEntity("Game", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Game): IBreezeGame;
    public createEntity(config?: _IntDefs.__opt_Game): IBreezeGame;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Game): IBreezeGame {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGame>entityManagerOrConfig.createEntity("Game", config);
      } else {
        return <IBreezeGame>defaultEntityManager.createEntity("Game", entityManagerOrConfig);
      }
    }
		}
		export class GameStat {
    static $name: string = "GameStat";
    $name: string = "GameStat";
    $type: string = "GameStat";

			 constructor(name: string) {
      this.$name = name;
    }

    static parent = (): Game => new Game("parent");

    parent = (): Game => new Game(this.$name + "." + "parent");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameStat): IBreezeGameStat;
    static createEntity(config?: _IntDefs.__opt_GameStat): IBreezeGameStat;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameStat): IBreezeGameStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameStat>entityManagerOrConfig.createEntity("GameStat", config);
      } else {
        return <IBreezeGameStat>defaultEntityManager.createEntity("GameStat", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GameStat): IBreezeGameStat;
    public createEntity(config?: _IntDefs.__opt_GameStat): IBreezeGameStat;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GameStat): IBreezeGameStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGameStat>entityManagerOrConfig.createEntity("GameStat", config);
      } else {
        return <IBreezeGameStat>defaultEntityManager.createEntity("GameStat", entityManagerOrConfig);
      }
    }
		}
		export class GroupMembership {
    static $name: string = "GroupMembership";
    $name: string = "GroupMembership";
    $type: string = "GroupMembership";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static group = (): Group => new Group("group");

    account = (): User => new User(this.$name + "." + "account");
    group = (): Group => new Group(this.$name + "." + "group");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership;
    static createEntity(config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupMembership>entityManagerOrConfig.createEntity("GroupMembership", config);
      } else {
        return <IBreezeGroupMembership>defaultEntityManager.createEntity("GroupMembership", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership;
    public createEntity(config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_GroupMembership): IBreezeGroupMembership {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroupMembership>entityManagerOrConfig.createEntity("GroupMembership", config);
      } else {
        return <IBreezeGroupMembership>defaultEntityManager.createEntity("GroupMembership", entityManagerOrConfig);
      }
    }
		}
		export class Group {
    static $name: string = "Group";
    $name: string = "Group";
    $type: string = "Group";

			 constructor(name: string) {
      this.$name = name;
    }

    static collections = (): Collection => new Collection("collections");
    static comments = (): Comment => new Comment("comments");
    static entityModule = (): UserEntityModule => new UserEntityModule("entityModule");
    static memberships = (): GroupMembership => new GroupMembership("memberships");
    static owner = (): User => new User("owner");
    static servers = (): Server => new Server("servers");

    collections = (): Collection => new Collection(this.$name + "." + "collections");
    comments = (): Comment => new Comment(this.$name + "." + "comments");
    entityModule = (): UserEntityModule => new UserEntityModule(this.$name + "." + "entityModule");
    memberships = (): GroupMembership => new GroupMembership(this.$name + "." + "memberships");
    owner = (): User => new User(this.$name + "." + "owner");
    servers = (): Server => new Server(this.$name + "." + "servers");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Group): IBreezeGroup;
    static createEntity(config?: _IntDefs.__opt_Group): IBreezeGroup;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Group): IBreezeGroup {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroup>entityManagerOrConfig.createEntity("Group", config);
      } else {
        return <IBreezeGroup>defaultEntityManager.createEntity("Group", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Group): IBreezeGroup;
    public createEntity(config?: _IntDefs.__opt_Group): IBreezeGroup;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Group): IBreezeGroup {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeGroup>entityManagerOrConfig.createEntity("Group", config);
      } else {
        return <IBreezeGroup>defaultEntityManager.createEntity("Group", entityManagerOrConfig);
      }
    }
		}
		export class Comment {
    static $name: string = "Comment";
    $name: string = "Comment";
    $type: string = "Comment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");

    author = (): User => new User(this.$name + "." + "author");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment;
    static createEntity(config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeComment>entityManagerOrConfig.createEntity("Comment", config);
      } else {
        return <AbstractDefs.IBreezeComment>defaultEntityManager.createEntity("Comment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment;
    public createEntity(config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Comment): AbstractDefs.IBreezeComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeComment>entityManagerOrConfig.createEntity("Comment", config);
      } else {
        return <AbstractDefs.IBreezeComment>defaultEntityManager.createEntity("Comment", entityManagerOrConfig);
      }
    }
		}
		export class WallPostComment {
    static $name: string = "WallPostComment";
    $name: string = "WallPostComment";
    $type: string = "WallPostComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");

    author = (): User => new User(this.$name + "." + "author");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment;
    static createEntity(config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWallPostComment>entityManagerOrConfig.createEntity("WallPostComment", config);
      } else {
        return <IBreezeWallPostComment>defaultEntityManager.createEntity("WallPostComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment;
    public createEntity(config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_WallPostComment): IBreezeWallPostComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeWallPostComment>entityManagerOrConfig.createEntity("WallPostComment", config);
      } else {
        return <IBreezeWallPostComment>defaultEntityManager.createEntity("WallPostComment", entityManagerOrConfig);
      }
    }
		}
		export class Server {
    static $name: string = "Server";
    $name: string = "Server";
    $type: string = "Server";

			 constructor(name: string) {
      this.$name = name;
    }

    static comments = (): ServerComment => new ServerComment("comments");
    static entityModule = (): ServerEntityModule => new ServerEntityModule("entityModule");
    static game = (): GameInContent => new GameInContent("game");
    static players = (): Player => new Player("players");

    comments = (): ServerComment => new ServerComment(this.$name + "." + "comments");
    entityModule = (): ServerEntityModule => new ServerEntityModule(this.$name + "." + "entityModule");
    game = (): GameInContent => new GameInContent(this.$name + "." + "game");
    players = (): Player => new Player(this.$name + "." + "players");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Server): IBreezeServer;
    static createEntity(config?: _IntDefs.__opt_Server): IBreezeServer;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Server): IBreezeServer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServer>entityManagerOrConfig.createEntity("Server", config);
      } else {
        return <IBreezeServer>defaultEntityManager.createEntity("Server", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Server): IBreezeServer;
    public createEntity(config?: _IntDefs.__opt_Server): IBreezeServer;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Server): IBreezeServer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServer>entityManagerOrConfig.createEntity("Server", config);
      } else {
        return <IBreezeServer>defaultEntityManager.createEntity("Server", entityManagerOrConfig);
      }
    }
		}
		export class ServerComment {
    static $name: string = "ServerComment";
    $name: string = "ServerComment";
    $type: string = "ServerComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static replies = (): ServerComment => new ServerComment("replies");
    static replyTo = (): ServerComment => new ServerComment("replyTo");
    static server = (): Server => new Server("server");

    author = (): User => new User(this.$name + "." + "author");
    replies = (): ServerComment => new ServerComment(this.$name + "." + "replies");
    replyTo = (): ServerComment => new ServerComment(this.$name + "." + "replyTo");
    server = (): Server => new Server(this.$name + "." + "server");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ServerComment): IBreezeServerComment;
    static createEntity(config?: _IntDefs.__opt_ServerComment): IBreezeServerComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ServerComment): IBreezeServerComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServerComment>entityManagerOrConfig.createEntity("ServerComment", config);
      } else {
        return <IBreezeServerComment>defaultEntityManager.createEntity("ServerComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ServerComment): IBreezeServerComment;
    public createEntity(config?: _IntDefs.__opt_ServerComment): IBreezeServerComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ServerComment): IBreezeServerComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeServerComment>entityManagerOrConfig.createEntity("ServerComment", config);
      } else {
        return <IBreezeServerComment>defaultEntityManager.createEntity("ServerComment", entityManagerOrConfig);
      }
    }
		}
		export class Player {
    static $name: string = "Player";
    $name: string = "Player";
    $type: string = "Player";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Player): IBreezePlayer;
    static createEntity(config?: _IntDefs.__opt_Player): IBreezePlayer;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Player): IBreezePlayer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePlayer>entityManagerOrConfig.createEntity("Player", config);
      } else {
        return <IBreezePlayer>defaultEntityManager.createEntity("Player", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Player): IBreezePlayer;
    public createEntity(config?: _IntDefs.__opt_Player): IBreezePlayer;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Player): IBreezePlayer {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePlayer>entityManagerOrConfig.createEntity("Player", config);
      } else {
        return <IBreezePlayer>defaultEntityManager.createEntity("Player", entityManagerOrConfig);
      }
    }
		}
		export class MissionComment {
    static $name: string = "MissionComment";
    $name: string = "MissionComment";
    $type: string = "MissionComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static mission = (): Mission => new Mission("mission");
    static replies = (): MissionComment => new MissionComment("replies");
    static replyTo = (): MissionComment => new MissionComment("replyTo");

    author = (): User => new User(this.$name + "." + "author");
    mission = (): Mission => new Mission(this.$name + "." + "mission");
    replies = (): MissionComment => new MissionComment(this.$name + "." + "replies");
    replyTo = (): MissionComment => new MissionComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment;
    static createEntity(config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionComment>entityManagerOrConfig.createEntity("MissionComment", config);
      } else {
        return <IBreezeMissionComment>defaultEntityManager.createEntity("MissionComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment;
    public createEntity(config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionComment): IBreezeMissionComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionComment>entityManagerOrConfig.createEntity("MissionComment", config);
      } else {
        return <IBreezeMissionComment>defaultEntityManager.createEntity("MissionComment", entityManagerOrConfig);
      }
    }
		}
		export class Mission {
    static $name: string = "Mission";
    $name: string = "Mission";
    $type: string = "Mission";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): MissionComment => new MissionComment("comments");
    static entityModule = (): MissionEntityModule => new MissionEntityModule("entityModule");
    static features = (): MissionFeature => new MissionFeature("features");
    static game = (): GameInContent => new GameInContent("game");
    static latestVersion = (): MissionVersion => new MissionVersion("latestVersion");
    static mediaItems = (): MissionMediaItem => new MissionMediaItem("mediaItems");
    static stat = (): MissionStat => new MissionStat("stat");
    static versions = (): MissionVersion => new MissionVersion("versions");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): MissionComment => new MissionComment(this.$name + "." + "comments");
    entityModule = (): MissionEntityModule => new MissionEntityModule(this.$name + "." + "entityModule");
    features = (): MissionFeature => new MissionFeature(this.$name + "." + "features");
    game = (): GameInContent => new GameInContent(this.$name + "." + "game");
    latestVersion = (): MissionVersion => new MissionVersion(this.$name + "." + "latestVersion");
    mediaItems = (): MissionMediaItem => new MissionMediaItem(this.$name + "." + "mediaItems");
    stat = (): MissionStat => new MissionStat(this.$name + "." + "stat");
    versions = (): MissionVersion => new MissionVersion(this.$name + "." + "versions");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Mission): IBreezeMission;
    static createEntity(config?: _IntDefs.__opt_Mission): IBreezeMission;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Mission): IBreezeMission {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMission>entityManagerOrConfig.createEntity("Mission", config);
      } else {
        return <IBreezeMission>defaultEntityManager.createEntity("Mission", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Mission): IBreezeMission;
    public createEntity(config?: _IntDefs.__opt_Mission): IBreezeMission;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Mission): IBreezeMission {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMission>entityManagerOrConfig.createEntity("Mission", config);
      } else {
        return <IBreezeMission>defaultEntityManager.createEntity("Mission", entityManagerOrConfig);
      }
    }
		}
		export class MissionFeature {
    static $name: string = "MissionFeature";
    $name: string = "MissionFeature";
    $type: string = "MissionFeature";

			 constructor(name: string) {
      this.$name = name;
    }

    static mission = (): Mission => new Mission("mission");

    mission = (): Mission => new Mission(this.$name + "." + "mission");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature;
    static createEntity(config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionFeature>entityManagerOrConfig.createEntity("MissionFeature", config);
      } else {
        return <IBreezeMissionFeature>defaultEntityManager.createEntity("MissionFeature", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature;
    public createEntity(config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionFeature): IBreezeMissionFeature {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionFeature>entityManagerOrConfig.createEntity("MissionFeature", config);
      } else {
        return <IBreezeMissionFeature>defaultEntityManager.createEntity("MissionFeature", entityManagerOrConfig);
      }
    }
		}
		export class MissionVersion {
    static $name: string = "MissionVersion";
    $name: string = "MissionVersion";
    $type: string = "MissionVersion";

			 constructor(name: string) {
      this.$name = name;
    }

    static addons = (): MissionVersionDependency => new MissionVersionDependency("addons");
    static mission = (): Mission => new Mission("mission");
    static sides = (): MissionVersionSide => new MissionVersionSide("sides");

    addons = (): MissionVersionDependency => new MissionVersionDependency(this.$name + "." + "addons");
    mission = (): Mission => new Mission(this.$name + "." + "mission");
    sides = (): MissionVersionSide => new MissionVersionSide(this.$name + "." + "sides");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion;
    static createEntity(config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersion>entityManagerOrConfig.createEntity("MissionVersion", config);
      } else {
        return <IBreezeMissionVersion>defaultEntityManager.createEntity("MissionVersion", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion;
    public createEntity(config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersion): IBreezeMissionVersion {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersion>entityManagerOrConfig.createEntity("MissionVersion", config);
      } else {
        return <IBreezeMissionVersion>defaultEntityManager.createEntity("MissionVersion", entityManagerOrConfig);
      }
    }
		}
		export class MissionVersionDependency {
    static $name: string = "MissionVersionDependency";
    $name: string = "MissionVersionDependency";
    $type: string = "MissionVersionDependency";

			 constructor(name: string) {
      this.$name = name;
    }

    static missionVersion = (): MissionVersion => new MissionVersion("missionVersion");
    static modDependency = (): Mod => new Mod("modDependency");

    missionVersion = (): MissionVersion => new MissionVersion(this.$name + "." + "missionVersion");
    modDependency = (): Mod => new Mod(this.$name + "." + "modDependency");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency;
    static createEntity(config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersionDependency>entityManagerOrConfig.createEntity("MissionVersionDependency", config);
      } else {
        return <IBreezeMissionVersionDependency>defaultEntityManager.createEntity("MissionVersionDependency", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency;
    public createEntity(config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersionDependency): IBreezeMissionVersionDependency {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersionDependency>entityManagerOrConfig.createEntity("MissionVersionDependency", config);
      } else {
        return <IBreezeMissionVersionDependency>defaultEntityManager.createEntity("MissionVersionDependency", entityManagerOrConfig);
      }
    }
		}
		export class MissionVersionSide {
    static $name: string = "MissionVersionSide";
    $name: string = "MissionVersionSide";
    $type: string = "MissionVersionSide";

			 constructor(name: string) {
      this.$name = name;
    }

    static missionVersion = (): MissionVersion => new MissionVersion("missionVersion");

    missionVersion = (): MissionVersion => new MissionVersion(this.$name + "." + "missionVersion");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide;
    static createEntity(config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersionSide>entityManagerOrConfig.createEntity("MissionVersionSide", config);
      } else {
        return <IBreezeMissionVersionSide>defaultEntityManager.createEntity("MissionVersionSide", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide;
    public createEntity(config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVersionSide): IBreezeMissionVersionSide {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVersionSide>entityManagerOrConfig.createEntity("MissionVersionSide", config);
      } else {
        return <IBreezeMissionVersionSide>defaultEntityManager.createEntity("MissionVersionSide", entityManagerOrConfig);
      }
    }
		}
		export class MissionMediaItem {
    static $name: string = "MissionMediaItem";
    $name: string = "MissionMediaItem";
    $type: string = "MissionMediaItem";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static mission = (): Mission => new Mission("mission");

    account = (): User => new User(this.$name + "." + "account");
    mission = (): Mission => new Mission(this.$name + "." + "mission");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem;
    static createEntity(config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionMediaItem>entityManagerOrConfig.createEntity("MissionMediaItem", config);
      } else {
        return <IBreezeMissionMediaItem>defaultEntityManager.createEntity("MissionMediaItem", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem;
    public createEntity(config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionMediaItem): IBreezeMissionMediaItem {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionMediaItem>entityManagerOrConfig.createEntity("MissionMediaItem", config);
      } else {
        return <IBreezeMissionMediaItem>defaultEntityManager.createEntity("MissionMediaItem", entityManagerOrConfig);
      }
    }
		}
		export class MissionImage {
    static $name: string = "MissionImage";
    $name: string = "MissionImage";
    $type: string = "MissionImage";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static mission = (): Mission => new Mission("mission");

    account = (): User => new User(this.$name + "." + "account");
    mission = (): Mission => new Mission(this.$name + "." + "mission");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage;
    static createEntity(config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionImage>entityManagerOrConfig.createEntity("MissionImage", config);
      } else {
        return <IBreezeMissionImage>defaultEntityManager.createEntity("MissionImage", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage;
    public createEntity(config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionImage): IBreezeMissionImage {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionImage>entityManagerOrConfig.createEntity("MissionImage", config);
      } else {
        return <IBreezeMissionImage>defaultEntityManager.createEntity("MissionImage", entityManagerOrConfig);
      }
    }
		}
		export class MissionVideo {
    static $name: string = "MissionVideo";
    $name: string = "MissionVideo";
    $type: string = "MissionVideo";

			 constructor(name: string) {
      this.$name = name;
    }

    static account = (): User => new User("account");
    static mission = (): Mission => new Mission("mission");

    account = (): User => new User(this.$name + "." + "account");
    mission = (): Mission => new Mission(this.$name + "." + "mission");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo;
    static createEntity(config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVideo>entityManagerOrConfig.createEntity("MissionVideo", config);
      } else {
        return <IBreezeMissionVideo>defaultEntityManager.createEntity("MissionVideo", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo;
    public createEntity(config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionVideo): IBreezeMissionVideo {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionVideo>entityManagerOrConfig.createEntity("MissionVideo", config);
      } else {
        return <IBreezeMissionVideo>defaultEntityManager.createEntity("MissionVideo", entityManagerOrConfig);
      }
    }
		}
		export class MissionStat {
    static $name: string = "MissionStat";
    $name: string = "MissionStat";
    $type: string = "MissionStat";

			 constructor(name: string) {
      this.$name = name;
    }

    static mission = (): Mission => new Mission("mission");

    mission = (): Mission => new Mission(this.$name + "." + "mission");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat;
    static createEntity(config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionStat>entityManagerOrConfig.createEntity("MissionStat", config);
      } else {
        return <IBreezeMissionStat>defaultEntityManager.createEntity("MissionStat", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat;
    public createEntity(config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_MissionStat): IBreezeMissionStat {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeMissionStat>entityManagerOrConfig.createEntity("MissionStat", config);
      } else {
        return <IBreezeMissionStat>defaultEntityManager.createEntity("MissionStat", entityManagerOrConfig);
      }
    }
		}
		export class ModCategory {
    static $name: string = "ModCategory";
    $name: string = "ModCategory";
    $type: string = "ModCategory";

			 constructor(name: string) {
      this.$name = name;
    }

    static mods = (): ModInCategory => new ModInCategory("mods");

    mods = (): ModInCategory => new ModInCategory(this.$name + "." + "mods");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModCategory): IBreezeModCategory;
    static createEntity(config?: _IntDefs.__opt_ModCategory): IBreezeModCategory;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModCategory): IBreezeModCategory {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModCategory>entityManagerOrConfig.createEntity("ModCategory", config);
      } else {
        return <IBreezeModCategory>defaultEntityManager.createEntity("ModCategory", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModCategory): IBreezeModCategory;
    public createEntity(config?: _IntDefs.__opt_ModCategory): IBreezeModCategory;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModCategory): IBreezeModCategory {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModCategory>entityManagerOrConfig.createEntity("ModCategory", config);
      } else {
        return <IBreezeModCategory>defaultEntityManager.createEntity("ModCategory", entityManagerOrConfig);
      }
    }
		}
		export class ModInCategory {
    static $name: string = "ModInCategory";
    $name: string = "ModInCategory";
    $type: string = "ModInCategory";

			 constructor(name: string) {
      this.$name = name;
    }

    static category = (): ModCategory => new ModCategory("category");

    category = (): ModCategory => new ModCategory(this.$name + "." + "category");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory;
    static createEntity(config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModInCategory>entityManagerOrConfig.createEntity("ModInCategory", config);
      } else {
        return <IBreezeModInCategory>defaultEntityManager.createEntity("ModInCategory", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory;
    public createEntity(config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_ModInCategory): IBreezeModInCategory {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeModInCategory>entityManagerOrConfig.createEntity("ModInCategory", config);
      } else {
        return <IBreezeModInCategory>defaultEntityManager.createEntity("ModInCategory", entityManagerOrConfig);
      }
    }
		}
		export class PostComment {
    static $name: string = "PostComment";
    $name: string = "PostComment";
    $type: string = "PostComment";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static post = (): Post => new Post("post");
    static replies = (): PostComment => new PostComment("replies");
    static replyTo = (): PostComment => new PostComment("replyTo");

    author = (): User => new User(this.$name + "." + "author");
    post = (): Post => new Post(this.$name + "." + "post");
    replies = (): PostComment => new PostComment(this.$name + "." + "replies");
    replyTo = (): PostComment => new PostComment(this.$name + "." + "replyTo");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_PostComment): IBreezePostComment;
    static createEntity(config?: _IntDefs.__opt_PostComment): IBreezePostComment;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_PostComment): IBreezePostComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePostComment>entityManagerOrConfig.createEntity("PostComment", config);
      } else {
        return <IBreezePostComment>defaultEntityManager.createEntity("PostComment", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_PostComment): IBreezePostComment;
    public createEntity(config?: _IntDefs.__opt_PostComment): IBreezePostComment;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_PostComment): IBreezePostComment {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePostComment>entityManagerOrConfig.createEntity("PostComment", config);
      } else {
        return <IBreezePostComment>defaultEntityManager.createEntity("PostComment", entityManagerOrConfig);
      }
    }
		}
		export class Post {
    static $name: string = "Post";
    $name: string = "Post";
    $type: string = "Post";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Post): IBreezePost;
    static createEntity(config?: _IntDefs.__opt_Post): IBreezePost;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Post): IBreezePost {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePost>entityManagerOrConfig.createEntity("Post", config);
      } else {
        return <IBreezePost>defaultEntityManager.createEntity("Post", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Post): IBreezePost;
    public createEntity(config?: _IntDefs.__opt_Post): IBreezePost;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Post): IBreezePost {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezePost>entityManagerOrConfig.createEntity("Post", config);
      } else {
        return <IBreezePost>defaultEntityManager.createEntity("Post", entityManagerOrConfig);
      }
    }
		}
		export class CreateBlog {
    static $name: string = "CreateBlog";
    $name: string = "CreateBlog";
    $type: string = "CreateBlog";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog;
    static createEntity(config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCreateBlog>entityManagerOrConfig.createEntity("CreateBlog", config);
      } else {
        return <IBreezeCreateBlog>defaultEntityManager.createEntity("CreateBlog", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog;
    public createEntity(config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CreateBlog): IBreezeCreateBlog {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCreateBlog>entityManagerOrConfig.createEntity("CreateBlog", config);
      } else {
        return <IBreezeCreateBlog>defaultEntityManager.createEntity("CreateBlog", entityManagerOrConfig);
      }
    }
		}
		export class CreateBlogCommand {
    static $name: string = "CreateBlogCommand";
    $name: string = "CreateBlogCommand";
    $type: string = "CreateBlogCommand";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand;
    static createEntity(config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCreateBlogCommand>entityManagerOrConfig.createEntity("CreateBlogCommand", config);
      } else {
        return <IBreezeCreateBlogCommand>defaultEntityManager.createEntity("CreateBlogCommand", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand;
    public createEntity(config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_CreateBlogCommand): IBreezeCreateBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeCreateBlogCommand>entityManagerOrConfig.createEntity("CreateBlogCommand", config);
      } else {
        return <IBreezeCreateBlogCommand>defaultEntityManager.createEntity("CreateBlogCommand", entityManagerOrConfig);
      }
    }
		}
		export class EditBlogCommand {
    static $name: string = "EditBlogCommand";
    $name: string = "EditBlogCommand";
    $type: string = "EditBlogCommand";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand;
    static createEntity(config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeEditBlogCommand>entityManagerOrConfig.createEntity("EditBlogCommand", config);
      } else {
        return <AbstractDefs.IBreezeEditBlogCommand>defaultEntityManager.createEntity("EditBlogCommand", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand;
    public createEntity(config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_EditBlogCommand): AbstractDefs.IBreezeEditBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <AbstractDefs.IBreezeEditBlogCommand>entityManagerOrConfig.createEntity("EditBlogCommand", config);
      } else {
        return <AbstractDefs.IBreezeEditBlogCommand>defaultEntityManager.createEntity("EditBlogCommand", entityManagerOrConfig);
      }
    }
		}
		export class DeleteBlogCommand {
    static $name: string = "DeleteBlogCommand";
    $name: string = "DeleteBlogCommand";
    $type: string = "DeleteBlogCommand";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand;
    static createEntity(config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeDeleteBlogCommand>entityManagerOrConfig.createEntity("DeleteBlogCommand", config);
      } else {
        return <IBreezeDeleteBlogCommand>defaultEntityManager.createEntity("DeleteBlogCommand", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand;
    public createEntity(config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_DeleteBlogCommand): IBreezeDeleteBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeDeleteBlogCommand>entityManagerOrConfig.createEntity("DeleteBlogCommand", config);
      } else {
        return <IBreezeDeleteBlogCommand>defaultEntityManager.createEntity("DeleteBlogCommand", entityManagerOrConfig);
      }
    }
		}
		export class UpdateBlogCommand {
    static $name: string = "UpdateBlogCommand";
    $name: string = "UpdateBlogCommand";
    $type: string = "UpdateBlogCommand";

			 constructor(name: string) {
      this.$name = name;
    }

    static author = (): User => new User("author");
    static comments = (): PostComment => new PostComment("comments");

    author = (): User => new User(this.$name + "." + "author");
    comments = (): PostComment => new PostComment(this.$name + "." + "comments");

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand;
    static createEntity(config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUpdateBlogCommand>entityManagerOrConfig.createEntity("UpdateBlogCommand", config);
      } else {
        return <IBreezeUpdateBlogCommand>defaultEntityManager.createEntity("UpdateBlogCommand", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand;
    public createEntity(config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_UpdateBlogCommand): IBreezeUpdateBlogCommand {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeUpdateBlogCommand>entityManagerOrConfig.createEntity("UpdateBlogCommand", config);
      } else {
        return <IBreezeUpdateBlogCommand>defaultEntityManager.createEntity("UpdateBlogCommand", entityManagerOrConfig);
      }
    }
		}
		export class Product {
    static $name: string = "Product";
    $name: string = "Product";
    $type: string = "Product";

			 constructor(name: string) {
      this.$name = name;
    }

    static createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Product): IBreezeProduct;
    static createEntity(config?: _IntDefs.__opt_Product): IBreezeProduct;
    static createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Product): IBreezeProduct {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeProduct>entityManagerOrConfig.createEntity("Product", config);
      } else {
        return <IBreezeProduct>defaultEntityManager.createEntity("Product", entityManagerOrConfig);
      }
    }

    public createEntity(entityManager: breeze.EntityManager, config?: _IntDefs.__opt_Product): IBreezeProduct;
    public createEntity(config?: _IntDefs.__opt_Product): IBreezeProduct;
    public createEntity(entityManagerOrConfig: any, config?: _IntDefs.__opt_Product): IBreezeProduct {
      if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {
        return <IBreezeProduct>entityManagerOrConfig.createEntity("Product", config);
      } else {
        return <IBreezeProduct>defaultEntityManager.createEntity("Product", entityManagerOrConfig);
      }
    }
		}
}
export module _IntDefs {
		export interface _Range
    extends breeze.Entity {
    //Data Properties
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    max?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    min?: number; //Int32
		}

		export interface __opt_Range {
    //Data Properties
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    max?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    min?: number; //Int32
		}

		export interface _Respawn
    extends breeze.Entity {
    //Data Properties
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    respawnDelay?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    respawnType?: number; //Int32
		}

		export interface __opt_Respawn {
    //Data Properties
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    respawnDelay?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    respawnType?: number; //Int32
		}

		export interface _Weather
    extends breeze.Entity {
    //Data Properties
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    startTime?: Date; //DateTime
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startWeather?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startFog?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWeather?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastFog?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startWind?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWind?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWaves?: number; //Single
		}

		export interface __opt_Weather {
    //Data Properties
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    startTime?: Date; //DateTime
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startWeather?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startFog?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWeather?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastFog?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    startWind?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWind?: number; //Single
    /**(Single)

    Validation:
     - number: "'Value' must be a number"
    */
    forecastWaves?: number; //Single
		}

		export interface _AppComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeApp)
    */
    app: IBreezeApp;
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeAppComment)
    */
    replies: IBreezeAppComment[];
    /**(IBreezeAppComment)
    */
    replyTo: IBreezeAppComment;
		}

		export interface __opt_AppComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeApp)
    */
    app?: IBreezeApp;
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeAppComment)
    */
    replies?: IBreezeAppComment[];
    /**(IBreezeAppComment)
    */
    replyTo?: IBreezeAppComment;
		}

		export interface _App
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 3 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    packageName: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 450 characters"
     - string: "'Value' must be a string"
    */
    homepageUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeAppComment)
    */
    comments: IBreezeAppComment[];
    /**(IBreezeAppEntityModule)
    */
    entityModule: IBreezeAppEntityModule;
    /**(IBreezeGameInApp)
    */
    games: IBreezeGameInApp[];
    /**(IBreezeAppMediaItem)
    */
    mediaItems: IBreezeAppMediaItem[];
		}

		export interface __opt_App {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 3 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    packageName?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 450 characters"
     - string: "'Value' must be a string"
    */
    homepageUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeAppComment)
    */
    comments?: IBreezeAppComment[];
    /**(IBreezeAppEntityModule)
    */
    entityModule?: IBreezeAppEntityModule;
    /**(IBreezeGameInApp)
    */
    games?: IBreezeGameInApp[];
    /**(IBreezeAppMediaItem)
    */
    mediaItems?: IBreezeAppMediaItem[];
		}

		export interface _User
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    displayName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    userName?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isPremium: boolean; //Boolean
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatarURL?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasAvatar: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    emailMd5?: string; //String

    //Navigation Properties
    /**(IBreezeUserEntityModule)
    */
    entityModule: IBreezeUserEntityModule;
		}

		export interface __opt_User {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    displayName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    userName?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isPremium?: boolean; //Boolean
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatarURL?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasAvatar?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    emailMd5?: string; //String

    //Navigation Properties
    /**(IBreezeUserEntityModule)
    */
    entityModule?: IBreezeUserEntityModule;
		}

		export interface _EntityModuleComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    entityModuleId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(AbstractDefs.IBreezeEntityModule)
    */
    entityModule: AbstractDefs.IBreezeEntityModule;
    /**(IBreezeEntityModuleComment)
    */
    replies: IBreezeEntityModuleComment[];
    /**(IBreezeEntityModuleComment)
    */
    replyTo: IBreezeEntityModuleComment;
		}

		export interface __opt_EntityModuleComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    entityModuleId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(AbstractDefs.IBreezeEntityModule)
    */
    entityModule?: AbstractDefs.IBreezeEntityModule;
    /**(IBreezeEntityModuleComment)
    */
    replies?: IBreezeEntityModuleComment[];
    /**(IBreezeEntityModuleComment)
    */
    replyTo?: IBreezeEntityModuleComment;
		}

		export interface _EntityModule
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    subscribersCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32

    //Navigation Properties
    /**(IBreezeEntityModuleComment)
    */
    comments: IBreezeEntityModuleComment[];
    /**(IBreezeWall)
    */
    wall: IBreezeWall;
		}

		export interface __opt_EntityModule {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    subscribersCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32

    //Navigation Properties
    /**(IBreezeEntityModuleComment)
    */
    comments?: IBreezeEntityModuleComment[];
    /**(IBreezeWall)
    */
    wall?: IBreezeWall;
		}

		export interface _UserEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_UserEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _Wall
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]
    [ForeignKey("entityModule")]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32

    //Navigation Properties
    /**(AbstractDefs.IBreezeEntityModule)
    */
    entityModule: AbstractDefs.IBreezeEntityModule;
    /**(IBreezeWallPost)
    */
    posts: IBreezeWallPost[];
		}

		export interface __opt_Wall {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]
    [ForeignKey("entityModule")]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32

    //Navigation Properties
    /**(AbstractDefs.IBreezeEntityModule)
    */
    entityModule?: AbstractDefs.IBreezeEntityModule;
    /**(IBreezeWallPost)
    */
    posts?: IBreezeWallPost[];
		}

		export interface _WallPost
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    content?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    shareContent?: string; //String
    /**(Int32)
    [ForeignKey("wall")]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    wallId: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    shareContentType: string; //String

    //Navigation Properties
    /**(IBreezeWallPostComment)
    */
    comments: IBreezeWallPostComment[];
    /**(IBreezeWall)
    */
    wall: IBreezeWall;
		}

		export interface __opt_WallPost {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    content?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    shareContent?: string; //String
    /**(Int32)
    [ForeignKey("wall")]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    wallId?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    shareContentType?: string; //String

    //Navigation Properties
    /**(IBreezeWallPostComment)
    */
    comments?: IBreezeWallPostComment[];
    /**(IBreezeWall)
    */
    wall?: IBreezeWall;
		}

		export interface _AppEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_AppEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _CollectionEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_CollectionEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _GroupEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_GroupEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _MissionEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_MissionEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _ModEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_ModEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _ServerEntityModule
    extends _IntDefs._EntityModule { }

		export interface __opt_ServerEntityModule
    extends _IntDefs.__opt_EntityModule { }

		export interface _GameInApp
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId: string; //Guid

    //Navigation Properties
    /**(IBreezeApp)
    */
    app: IBreezeApp;
		}

		export interface __opt_GameInApp {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId?: string; //Guid

    //Navigation Properties
    /**(IBreezeApp)
    */
    app?: IBreezeApp;
		}

		export interface _AppMediaItem
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeApp)
    */
    app: IBreezeApp;
		}

		export interface __opt_AppMediaItem {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("app")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    appId?: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeApp)
    */
    app?: IBreezeApp;
		}

		export interface _CollectionComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeCollection)
    */
    collection: IBreezeCollection;
    /**(IBreezeCollectionComment)
    */
    replies: IBreezeCollectionComment[];
    /**(IBreezeCollectionComment)
    */
    replyTo: IBreezeCollectionComment;
		}

		export interface __opt_CollectionComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeCollection)
    */
    collection?: IBreezeCollection;
    /**(IBreezeCollectionComment)
    */
    replies?: IBreezeCollectionComment[];
    /**(IBreezeCollectionComment)
    */
    replyTo?: IBreezeCollectionComment;
		}

		export interface _Collection
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    modsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    subscribersCount: number; //Int32
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    preferredClient: string; //String
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    scope: string; //String
    /**(Guid)
    [ForeignKey("latestVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    latestVersionId: string; //Guid
    /**(Guid)
    [ForeignKey("forkedCollection")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    forkedCollectionId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    forkedCollectionsCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    tagsInternal?: string; //String
    /**(Guid)
    [ForeignKey("group")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    groupId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeCollectionComment)
    */
    comments: IBreezeCollectionComment[];
    /**(IBreezeCollectionEntityModule)
    */
    entityModule: IBreezeCollectionEntityModule;
    /**(IBreezeCollectionFileTransferPolicy)
    */
    fileTransferPolicies: IBreezeCollectionFileTransferPolicy[];
    /**(IBreezeCollection)
    */
    forkedCollection: IBreezeCollection;
    /**(IBreezeCollection)
    */
    forkedCollections: IBreezeCollection[];
    /**(IBreezeGameInContent)
    */
    game: IBreezeGameInContent;
    /**(IBreezeGroupInContent)
    */
    group: IBreezeGroupInContent;
    /**(IBreezeCollectionVersion)
    */
    latestVersion: IBreezeCollectionVersion;
    /**(IBreezeCollectionMediaItem)
    */
    mediaItems: IBreezeCollectionMediaItem[];
    /**(IBreezeCollectionStat)
    */
    stat: IBreezeCollectionStat;
    /**(IBreezeCollectionVersion)
    */
    versions: IBreezeCollectionVersion[];
		}

		export interface __opt_Collection {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    modsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    subscribersCount?: number; //Int32
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    preferredClient?: string; //String
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    scope?: string; //String
    /**(Guid)
    [ForeignKey("latestVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    latestVersionId?: string; //Guid
    /**(Guid)
    [ForeignKey("forkedCollection")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    forkedCollectionId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    forkedCollectionsCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    tagsInternal?: string; //String
    /**(Guid)
    [ForeignKey("group")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    groupId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeCollectionComment)
    */
    comments?: IBreezeCollectionComment[];
    /**(IBreezeCollectionEntityModule)
    */
    entityModule?: IBreezeCollectionEntityModule;
    /**(IBreezeCollectionFileTransferPolicy)
    */
    fileTransferPolicies?: IBreezeCollectionFileTransferPolicy[];
    /**(IBreezeCollection)
    */
    forkedCollection?: IBreezeCollection;
    /**(IBreezeCollection)
    */
    forkedCollections?: IBreezeCollection[];
    /**(IBreezeGameInContent)
    */
    game?: IBreezeGameInContent;
    /**(IBreezeGroupInContent)
    */
    group?: IBreezeGroupInContent;
    /**(IBreezeCollectionVersion)
    */
    latestVersion?: IBreezeCollectionVersion;
    /**(IBreezeCollectionMediaItem)
    */
    mediaItems?: IBreezeCollectionMediaItem[];
    /**(IBreezeCollectionStat)
    */
    stat?: IBreezeCollectionStat;
    /**(IBreezeCollectionVersion)
    */
    versions?: IBreezeCollectionVersion[];
		}

		export interface _CollectionFileTransferPolicy
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    path: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    uploaded: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection: IBreezeCollection;
    /**(IBreezeAWSUploadPolicy)
    */
    uploadPolicy: IBreezeAWSUploadPolicy;
		}

		export interface __opt_CollectionFileTransferPolicy {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    uploaded?: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection?: IBreezeCollection;
    /**(IBreezeAWSUploadPolicy)
    */
    uploadPolicy?: IBreezeAWSUploadPolicy;
		}

		export interface _AWSUploadPolicy
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    accessKey?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    signature?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    securityToken?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    aCL?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    contentType?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    key?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    bucketName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    encryptedPolicy?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    callbackUrl?: string; //String
		}

		export interface __opt_AWSUploadPolicy {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    accessKey?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    signature?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    securityToken?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    aCL?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    contentType?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    key?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    bucketName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    encryptedPolicy?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    callbackUrl?: string; //String
		}

		export interface _CollectionImageFileTransferPolicy
    extends _IntDefs._CollectionFileTransferPolicy { }

		export interface __opt_CollectionImageFileTransferPolicy
    extends _IntDefs.__opt_CollectionFileTransferPolicy { }

		export interface _GameInContent
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String
		}

		export interface __opt_GameInContent {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String
		}

		export interface _GameModStat
    extends _IntDefs._GameInContent {
    //Data Properties
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMods: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalClaimedMods: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissions: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollections: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalPublicCollections: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalPrivateCollections: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalUnlistedCollections: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModAuthors: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModAuthorComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionAuthorComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionAuthorComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionComments: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionAuthors: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionAuthors: number; //Int32
		}

		export interface __opt_GameModStat
    extends _IntDefs.__opt_GameInContent {
    //Data Properties
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMods?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalClaimedMods?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissions?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollections?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalPublicCollections?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalPrivateCollections?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalUnlistedCollections?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModAuthors?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModAuthorComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionAuthorComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionAuthorComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalModComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionComments?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalMissionAuthors?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    totalCollectionAuthors?: number; //Int32
		}

		export interface _GroupInContent
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String
		}

		export interface __opt_GroupInContent {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String
		}

		export interface _CollectionVersion
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    repositories?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasServers: boolean; //Boolean
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    releasedOn: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionMajor: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionMinor: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionBuild?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionRevision?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    branch?: string; //String
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    description: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection: IBreezeCollection;
    /**(IBreezeCollectionVersionDependency)
    */
    dependencies: IBreezeCollectionVersionDependency[];
    /**(IBreezeCollectionVersionServer)
    */
    servers: IBreezeCollectionVersionServer[];
		}

		export interface __opt_CollectionVersion {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    repositories?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasServers?: boolean; //Boolean
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    releasedOn?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionMajor?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionMinor?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionBuild?: number; //Int32
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    versionRevision?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    branch?: string; //String
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection?: IBreezeCollection;
    /**(IBreezeCollectionVersionDependency)
    */
    dependencies?: IBreezeCollectionVersionDependency[];
    /**(IBreezeCollectionVersionServer)
    */
    servers?: IBreezeCollectionVersionServer[];
		}

		export interface _CollectionVersionDependency
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    dependency?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    constraint?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isRequired: boolean; //Boolean
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    scope: string; //String
    /**(Guid)
    [ForeignKey("collectionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionVersionId: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("modDependency")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    modDependencyId?: string; //Guid
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64

    //Navigation Properties
    /**(IBreezeCollectionVersion)
    */
    collectionVersion: IBreezeCollectionVersion;
    /**(IBreezeMod)
    */
    modDependency: IBreezeMod;
		}

		export interface __opt_CollectionVersionDependency {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    dependency?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    constraint?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isRequired?: boolean; //Boolean
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    scope?: string; //String
    /**(Guid)
    [ForeignKey("collectionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionVersionId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("modDependency")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    modDependencyId?: string; //Guid
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64

    //Navigation Properties
    /**(IBreezeCollectionVersion)
    */
    collectionVersion?: IBreezeCollectionVersion;
    /**(IBreezeMod)
    */
    modDependency?: IBreezeMod;
		}

		export interface _Mod
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    packageName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    authorText?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    modVersion?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    homepageUrl?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    aliases?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasReadme: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasLicense: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasChangelog: boolean; //Boolean
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    latestStableVersion?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    bannerPath?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    bannerUpdatedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    dependentsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    collectionsCount: number; //Int32
    /**(Guid)
    [ForeignKey("group")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    groupId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeModCategoryInMod)
    */
    categories: IBreezeModCategoryInMod[];
    /**(IBreezeCollectionInMod)
    */
    collections: IBreezeCollectionInMod[];
    /**(IBreezeModComment)
    */
    comments: IBreezeModComment[];
    /**(IBreezeModDependency)
    */
    dependencies: IBreezeModDependency[];
    /**(IBreezeModDependent)
    */
    dependents: IBreezeModDependent[];
    /**(IBreezeModEntityModule)
    */
    entityModule: IBreezeModEntityModule;
    /**(IBreezeModFileTransferPolicy)
    */
    fileTransferPolicies: IBreezeModFileTransferPolicy[];
    /**(IBreezeGameInContent)
    */
    game: IBreezeGameInContent;
    /**(IBreezeGroupInContent)
    */
    group: IBreezeGroupInContent;
    /**(IBreezeModInfo)
    */
    info: IBreezeModInfo;
    /**(IBreezeModMediaItem)
    */
    mediaItems: IBreezeModMediaItem[];
    /**(IBreezeModStat)
    */
    stat: IBreezeModStat;
    /**(IBreezeModUpdate)
    */
    updates: IBreezeModUpdate[];
    /**(IBreezeModUserGroup)
    */
    userGroups: IBreezeModUserGroup[];
		}

		export interface __opt_Mod {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    packageName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    authorText?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    modVersion?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    homepageUrl?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    aliases?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasReadme?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasLicense?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hasChangelog?: boolean; //Boolean
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    latestStableVersion?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    bannerPath?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    bannerUpdatedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    dependentsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    collectionsCount?: number; //Int32
    /**(Guid)
    [ForeignKey("group")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    groupId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeModCategoryInMod)
    */
    categories?: IBreezeModCategoryInMod[];
    /**(IBreezeCollectionInMod)
    */
    collections?: IBreezeCollectionInMod[];
    /**(IBreezeModComment)
    */
    comments?: IBreezeModComment[];
    /**(IBreezeModDependency)
    */
    dependencies?: IBreezeModDependency[];
    /**(IBreezeModDependent)
    */
    dependents?: IBreezeModDependent[];
    /**(IBreezeModEntityModule)
    */
    entityModule?: IBreezeModEntityModule;
    /**(IBreezeModFileTransferPolicy)
    */
    fileTransferPolicies?: IBreezeModFileTransferPolicy[];
    /**(IBreezeGameInContent)
    */
    game?: IBreezeGameInContent;
    /**(IBreezeGroupInContent)
    */
    group?: IBreezeGroupInContent;
    /**(IBreezeModInfo)
    */
    info?: IBreezeModInfo;
    /**(IBreezeModMediaItem)
    */
    mediaItems?: IBreezeModMediaItem[];
    /**(IBreezeModStat)
    */
    stat?: IBreezeModStat;
    /**(IBreezeModUpdate)
    */
    updates?: IBreezeModUpdate[];
    /**(IBreezeModUserGroup)
    */
    userGroups?: IBreezeModUserGroup[];
		}

		export interface _ModCategoryInMod
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModCategoryInMod {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _CollectionInMod
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_CollectionInMod {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
    /**(IBreezeModComment)
    */
    replies: IBreezeModComment[];
    /**(IBreezeModComment)
    */
    replyTo: IBreezeModComment;
		}

		export interface __opt_ModComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
    /**(IBreezeModComment)
    */
    replies?: IBreezeModComment[];
    /**(IBreezeModComment)
    */
    replyTo?: IBreezeModComment;
		}

		export interface _ModDependency
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModDependency {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModDependent
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModDependent {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameSlug?: string; //String
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModFileTransferPolicy
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    path: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    uploaded: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
    /**(IBreezeAWSUploadPolicy)
    */
    uploadPolicy: IBreezeAWSUploadPolicy;
		}

		export interface __opt_ModFileTransferPolicy {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    uploaded?: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
    /**(IBreezeAWSUploadPolicy)
    */
    uploadPolicy?: IBreezeAWSUploadPolicy;
		}

		export interface _ModImageFileTransferPolicy
    extends _IntDefs._ModFileTransferPolicy { }

		export interface __opt_ModImageFileTransferPolicy
    extends _IntDefs.__opt_ModFileTransferPolicy { }

		export interface _ModInfo
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    readmeIsCustom: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    readme?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    changelogIsCustom: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    changelog?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    licenseIsCustom: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    license?: string; //String

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModInfo {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    readmeIsCustom?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    readme?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    changelogIsCustom?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    changelog?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    licenseIsCustom?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    license?: string; //String

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModMediaItem
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModMediaItem {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModStat
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall: number; //Int32

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModStat {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall?: number; //Int32

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModUpdate
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    lastUpdate: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    currentState: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    downloadUri?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    version?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    branch?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    comment?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
		}

		export interface __opt_ModUpdate {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    lastUpdate?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    currentState?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    downloadUri?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    version?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    branch?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    comment?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
		}

		export interface _ModUserGroup
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 30 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hidden: boolean; //Boolean
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    position: number; //Int32
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    canManage: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod: IBreezeMod;
    /**(IBreezeModGroupUser)
    */
    users: IBreezeModGroupUser[];
		}

		export interface __opt_ModUserGroup {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mod")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 30 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    hidden?: boolean; //Boolean
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    position?: number; //Int32
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    canManage?: boolean; //Boolean

    //Navigation Properties
    /**(IBreezeMod)
    */
    mod?: IBreezeMod;
    /**(IBreezeModGroupUser)
    */
    users?: IBreezeModGroupUser[];
		}

		export interface _ModGroupUser
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("modUserGroup")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modUserGroupId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    position: number; //Int32
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    userText?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeModUserGroup)
    */
    modUserGroup: IBreezeModUserGroup;
		}

		export interface __opt_ModGroupUser {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("modUserGroup")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    modUserGroupId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    position?: number; //Int32
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    userText?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeModUserGroup)
    */
    modUserGroup?: IBreezeModUserGroup;
		}

		export interface _CollectionVersionServer
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    address?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    password?: string; //String
    /**(Guid)
    [ForeignKey("collectionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionVersionId: string; //Guid

    //Navigation Properties
    /**(IBreezeCollectionVersion)
    */
    collectionVersion: IBreezeCollectionVersion;
		}

		export interface __opt_CollectionVersionServer {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    address?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    password?: string; //String
    /**(Guid)
    [ForeignKey("collectionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionVersionId?: string; //Guid

    //Navigation Properties
    /**(IBreezeCollectionVersion)
    */
    collectionVersion?: IBreezeCollectionVersion;
		}

		export interface _CollectionMediaItem
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeCollection)
    */
    collection: IBreezeCollection;
		}

		export interface __opt_CollectionMediaItem {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId?: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeCollection)
    */
    collection?: IBreezeCollection;
		}

		export interface _CollectionStat
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall: number; //Int32

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection: IBreezeCollection;
		}

		export interface __opt_CollectionStat {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("collection")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    collectionId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall?: number; //Int32

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collection?: IBreezeCollection;
		}

		export interface _Game
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    fullName?: string; //String
    /**(Guid)
    [ForeignKey("parent")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    parentId?: string; //Guid
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    public: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsMods: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsMissions: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsCollections: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsServers: boolean; //Boolean
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 2048 characters"
     - string: "'Value' must be a string"
    */
    buyUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 2048 characters"
     - string: "'Value' must be a string"
    */
    buyImageUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeGame)
    */
    parent: IBreezeGame;
		}

		export interface __opt_Game {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 255 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    fullName?: string; //String
    /**(Guid)
    [ForeignKey("parent")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    parentId?: string; //Guid
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    public?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsMods?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsMissions?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsCollections?: boolean; //Boolean
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsServers?: boolean; //Boolean
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 2048 characters"
     - string: "'Value' must be a string"
    */
    buyUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 2048 characters"
     - string: "'Value' must be a string"
    */
    buyImageUrl?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeGame)
    */
    parent?: IBreezeGame;
		}

		export interface _GameStat
    extends _IntDefs._Game {
    //Data Properties
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCountUniqueClient: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCountUniqueUser: number; //Int32
		}

		export interface __opt_GameStat
    extends _IntDefs.__opt_Game {
    //Data Properties
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCountUniqueClient?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    installedCountUniqueUser?: number; //Int32
		}

		export interface _GroupMembership
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId: string; //Guid
    /**(Guid) [Key]
    [ForeignKey("group")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    groupId: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    role?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeGroup)
    */
    group: IBreezeGroup;
		}

		export interface __opt_GroupMembership {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("account")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(Guid) [Key]
    [ForeignKey("group")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    groupId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    role?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeGroup)
    */
    group?: IBreezeGroup;
		}

		export interface _Group
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collections: IBreezeCollection[];
    /**(AbstractDefs.IBreezeComment)
    */
    comments: AbstractDefs.IBreezeComment[];
    /**(IBreezeUserEntityModule)
    */
    entityModule: IBreezeUserEntityModule;
    /**(IBreezeGroupMembership)
    */
    memberships: IBreezeGroupMembership[];
    /**(IBreezeUser)
    */
    owner: IBreezeUser;
    /**(IBreezeServer)
    */
    servers: IBreezeServer[];
		}

		export interface __opt_Group {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32

    //Navigation Properties
    /**(IBreezeCollection)
    */
    collections?: IBreezeCollection[];
    /**(AbstractDefs.IBreezeComment)
    */
    comments?: AbstractDefs.IBreezeComment[];
    /**(IBreezeUserEntityModule)
    */
    entityModule?: IBreezeUserEntityModule;
    /**(IBreezeGroupMembership)
    */
    memberships?: IBreezeGroupMembership[];
    /**(IBreezeUser)
    */
    owner?: IBreezeUser;
    /**(IBreezeServer)
    */
    servers?: IBreezeServer[];
		}

		export interface _Comment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
		}

		export interface __opt_Comment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
		}

		export interface _WallPostComment
    extends _IntDefs._Comment { }

		export interface __opt_WallPostComment
    extends _IntDefs.__opt_Comment { }

		export interface _Server
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    ipAddress?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    queryPort: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    port: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    numPlayers: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    minPlayers: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    maxPlayers: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    missionName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    islandName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameState?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    difficulty?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    battlEye?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    verifySignatures?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameMode?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    mod?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    country?: string; //String
    /**(Double)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    latitude: number; //Double
    /**(Double)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    longitude: number; //Double
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeServerComment)
    */
    comments: IBreezeServerComment[];
    /**(IBreezeServerEntityModule)
    */
    entityModule: IBreezeServerEntityModule;
    /**(IBreezeGameInContent)
    */
    game: IBreezeGameInContent;
    /**(IBreezePlayer)
    */
    players: IBreezePlayer[];
		}

		export interface __opt_Server {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    ipAddress?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    queryPort?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    port?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    numPlayers?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    minPlayers?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    maxPlayers?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    missionName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    islandName?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameState?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    difficulty?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    battlEye?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    verifySignatures?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    gameMode?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    mod?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    country?: string; //String
    /**(Double)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    latitude?: number; //Double
    /**(Double)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    longitude?: number; //Double
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeServerComment)
    */
    comments?: IBreezeServerComment[];
    /**(IBreezeServerEntityModule)
    */
    entityModule?: IBreezeServerEntityModule;
    /**(IBreezeGameInContent)
    */
    game?: IBreezeGameInContent;
    /**(IBreezePlayer)
    */
    players?: IBreezePlayer[];
		}

		export interface _ServerComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("server")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    serverId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeServerComment)
    */
    replies: IBreezeServerComment[];
    /**(IBreezeServerComment)
    */
    replyTo: IBreezeServerComment;
    /**(IBreezeServer)
    */
    server: IBreezeServer;
		}

		export interface __opt_ServerComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("server")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    serverId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeServerComment)
    */
    replies?: IBreezeServerComment[];
    /**(IBreezeServerComment)
    */
    replyTo?: IBreezeServerComment;
    /**(IBreezeServer)
    */
    server?: IBreezeServer;
		}

		export interface _Player
    extends breeze.Entity {
    //Data Properties
    /**(Int64) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    id?: number; //Int64
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    score: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    deaths: number; //Int32
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    serverId: string; //Guid
		}

		export interface __opt_Player {
    //Data Properties
    /**(Int64) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    id?: number; //Int64
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    score?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    deaths?: number; //Int32
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    serverId?: string; //Guid
		}

		export interface _MissionComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeMission)
    */
    mission: IBreezeMission;
    /**(IBreezeMissionComment)
    */
    replies: IBreezeMissionComment[];
    /**(IBreezeMissionComment)
    */
    replyTo: IBreezeMissionComment;
		}

		export interface __opt_MissionComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeMission)
    */
    mission?: IBreezeMission;
    /**(IBreezeMissionComment)
    */
    replies?: IBreezeMissionComment[];
    /**(IBreezeMissionComment)
    */
    replyTo?: IBreezeMissionComment;
		}

		export interface _Mission
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    modsCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    tagsInternal?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    packageName?: string; //String
    /**(Guid)

    Validation:
     - guid: "'Value' must be a GUID"
    */
    featuredMediaId?: string; //Guid
    /**(Guid)
    [ForeignKey("latestVersion")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    latestVersionId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezeMissionComment)
    */
    comments: IBreezeMissionComment[];
    /**(IBreezeMissionEntityModule)
    */
    entityModule: IBreezeMissionEntityModule;
    /**(IBreezeMissionFeature)
    */
    features: IBreezeMissionFeature[];
    /**(IBreezeGameInContent)
    */
    game: IBreezeGameInContent;
    /**(IBreezeMissionVersion)
    */
    latestVersion: IBreezeMissionVersion;
    /**(IBreezeMissionMediaItem)
    */
    mediaItems: IBreezeMissionMediaItem[];
    /**(IBreezeMissionStat)
    */
    stat: IBreezeMissionStat;
    /**(IBreezeMissionVersion)
    */
    versions: IBreezeMissionVersion[];
		}

		export interface __opt_Mission {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    modsCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    avatar?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    tagsInternal?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    packageName?: string; //String
    /**(Guid)

    Validation:
     - guid: "'Value' must be a GUID"
    */
    featuredMediaId?: string; //Guid
    /**(Guid)
    [ForeignKey("latestVersion")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    latestVersionId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    descriptionFull?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    followersCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    avatarUpdatedAt?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Int32)
    [ForeignKey("entityModule")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    entityModuleId?: number; //Int32
    /**(Guid)
    [ForeignKey("game")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    gameId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezeMissionComment)
    */
    comments?: IBreezeMissionComment[];
    /**(IBreezeMissionEntityModule)
    */
    entityModule?: IBreezeMissionEntityModule;
    /**(IBreezeMissionFeature)
    */
    features?: IBreezeMissionFeature[];
    /**(IBreezeGameInContent)
    */
    game?: IBreezeGameInContent;
    /**(IBreezeMissionVersion)
    */
    latestVersion?: IBreezeMissionVersion;
    /**(IBreezeMissionMediaItem)
    */
    mediaItems?: IBreezeMissionMediaItem[];
    /**(IBreezeMissionStat)
    */
    stat?: IBreezeMissionStat;
    /**(IBreezeMissionVersion)
    */
    versions?: IBreezeMissionVersion[];
		}

		export interface _MissionFeature
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id: string; //Guid
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 80 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 4096 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    content: string; //String

    //Navigation Properties
    /**(IBreezeMission)
    */
    mission: IBreezeMission;
		}

		export interface __opt_MissionFeature {
    //Data Properties
    /**(Guid) [Key]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId?: string; //Guid
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 80 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 4096 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    content?: string; //String

    //Navigation Properties
    /**(IBreezeMission)
    */
    mission?: IBreezeMission;
		}

		export interface _MissionVersion
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    dependencies?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 50 characters"
     - string: "'Value' must be a string"
    */
    version?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    releasedOn?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    startTime?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    playability: string; //String
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId: string; //Guid
    /**(Range:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    playerRange: string; //Range:#SN.withSIX.App.ApiModel
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsAi: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    map?: string; //String
    /**(Weather:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    weather: string; //Weather:#SN.withSIX.App.ApiModel
    /**(Respawn:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    respawn: string; //Respawn:#SN.withSIX.App.ApiModel
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    description: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked: number; //Int64
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug: string; //String

    //Navigation Properties
    /**(IBreezeMissionVersionDependency)
    */
    addons: IBreezeMissionVersionDependency[];
    /**(IBreezeMission)
    */
    mission: IBreezeMission;
    /**(IBreezeMissionVersionSide)
    */
    sides: IBreezeMissionVersionSide[];
		}

		export interface __opt_MissionVersion {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    dependencies?: string; //String
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 50 characters"
     - string: "'Value' must be a string"
    */
    version?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    releasedOn?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    startTime?: Date; //DateTime
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    playability?: string; //String
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId?: string; //Guid
    /**(Range:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    playerRange?: string; //Range:#SN.withSIX.App.ApiModel
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    supportsAi?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    map?: string; //String
    /**(Weather:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    weather?: string; //Weather:#SN.withSIX.App.ApiModel
    /**(Respawn:#SN.withSIX.App.ApiModel)

    Validation:
     - required: "'Value' is required"
    */
    respawn?: string; //Respawn:#SN.withSIX.App.ApiModel
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    description?: string; //String
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    size?: number; //Int64
    /**(Int64)

    Validation:
     - required: "'Value' is required"
     - integer: "'Value' must be an integer"
    */
    sizePacked?: number; //Int64
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 150 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    slug?: string; //String

    //Navigation Properties
    /**(IBreezeMissionVersionDependency)
    */
    addons?: IBreezeMissionVersionDependency[];
    /**(IBreezeMission)
    */
    mission?: IBreezeMission;
    /**(IBreezeMissionVersionSide)
    */
    sides?: IBreezeMissionVersionSide[];
		}

		export interface _MissionVersionDependency
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("missionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionVersionId: string; //Guid
    /**(String) [Key]

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 250 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    addon: string; //String
    /**(Guid)
    [ForeignKey("modDependency")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    modDependencyId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMissionVersion)
    */
    missionVersion: IBreezeMissionVersion;
    /**(IBreezeMod)
    */
    modDependency: IBreezeMod;
		}

		export interface __opt_MissionVersionDependency {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("missionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionVersionId?: string; //Guid
    /**(String) [Key]

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 250 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    addon?: string; //String
    /**(Guid)
    [ForeignKey("modDependency")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    modDependencyId?: string; //Guid

    //Navigation Properties
    /**(IBreezeMissionVersion)
    */
    missionVersion?: IBreezeMissionVersion;
    /**(IBreezeMod)
    */
    modDependency?: IBreezeMod;
		}

		export interface _MissionVersionSide
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("missionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionVersionId: string; //Guid
    /**(String) [Key]

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    side: string; //String

    //Navigation Properties
    /**(IBreezeMissionVersion)
    */
    missionVersion: IBreezeMissionVersion;
		}

		export interface __opt_MissionVersionSide {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("missionVersion")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionVersionId?: string; //Guid
    /**(String) [Key]

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    side?: string; //String

    //Navigation Properties
    /**(IBreezeMissionVersion)
    */
    missionVersion?: IBreezeMissionVersion;
		}

		export interface _MissionMediaItem
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account: IBreezeUser;
    /**(IBreezeMission)
    */
    mission: IBreezeMission;
		}

		export interface __opt_MissionMediaItem {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId?: string; //Guid
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    type?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    shouldDelete?: boolean; //Boolean
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    path?: string; //String
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    createdAt?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updatedAt?: Date; //DateTime
    /**(Guid)
    [ForeignKey("account")]

    Validation:
     - guid: "'Value' must be a GUID"
    */
    accountId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    description?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    account?: IBreezeUser;
    /**(IBreezeMission)
    */
    mission?: IBreezeMission;
		}

		export interface _MissionImage
    extends _IntDefs._MissionMediaItem { }

		export interface __opt_MissionImage
    extends _IntDefs.__opt_MissionMediaItem { }

		export interface _MissionVideo
    extends _IntDefs._MissionMediaItem { }

		export interface __opt_MissionVideo
    extends _IntDefs.__opt_MissionMediaItem { }

		export interface _MissionStat
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall: number; //Int32

    //Navigation Properties
    /**(IBreezeMission)
    */
    mission: IBreezeMission;
		}

		export interface __opt_MissionStat {
    //Data Properties
    /**(Guid) [Key]
    [ForeignKey("mission")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    missionId?: string; //Guid
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    install?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    update?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    uninstall?: number; //Int32

    //Navigation Properties
    /**(IBreezeMission)
    */
    mission?: IBreezeMission;
		}

		export interface _ModCategory
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String

    //Navigation Properties
    /**(IBreezeModInCategory)
    */
    mods: IBreezeModInCategory[];
		}

		export interface __opt_ModCategory {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String

    //Navigation Properties
    /**(IBreezeModInCategory)
    */
    mods?: IBreezeModInCategory[];
		}

		export interface _ModInCategory
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("category")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    categoryId: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String

    //Navigation Properties
    /**(IBreezeModCategory)
    */
    category: IBreezeModCategory;
		}

		export interface __opt_ModInCategory {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("category")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    categoryId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String

    //Navigation Properties
    /**(IBreezeModCategory)
    */
    category?: IBreezeModCategory;
		}

		export interface _PostComment
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("post")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    postId: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezePost)
    */
    post: IBreezePost;
    /**(IBreezePostComment)
    */
    replies: IBreezePostComment[];
    /**(IBreezePostComment)
    */
    replyTo: IBreezePostComment;
		}

		export interface __opt_PostComment {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Guid)
    [ForeignKey("post")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    postId?: string; //Guid
    /**(Int32)
    [ForeignKey("replyTo")]

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    replyToId?: number; //Int32
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 500 characters"
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    message?: string; //String
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    lastEditedAt?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    archivedAt?: Date; //DateTime
    /**(String)

    Validation:
     - stringLength: "'Value' must be a string with between 0 and 200 characters"
     - string: "'Value' must be a string"
    */
    archivedReason?: string; //String

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezePost)
    */
    post?: IBreezePost;
    /**(IBreezePostComment)
    */
    replies?: IBreezePostComment[];
    /**(IBreezePostComment)
    */
    replyTo?: IBreezePostComment;
		}

		export interface _Post
    extends breeze.Entity {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    summary?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    content?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isTeam: boolean; //Boolean
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updated?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isPublished: boolean; //Boolean
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    category: string; //String
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created: Date; //DateTime

    //Navigation Properties
    /**(IBreezeUser)
    */
    author: IBreezeUser;
    /**(IBreezePostComment)
    */
    comments: IBreezePostComment[];
		}

		export interface __opt_Post {
    //Data Properties
    /**(Guid) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    id?: string; //Guid
    /**(Guid)
    [ForeignKey("author")]

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    authorId?: string; //Guid
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    summary?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    content?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isTeam?: boolean; //Boolean
    /**(DateTime)

    Validation:
     - date: "'Value' must be a date"
    */
    updated?: Date; //DateTime
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    likesCount?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    commentsCount?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    title?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    slug?: string; //String
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isPublished?: boolean; //Boolean
    /**(String)

    Validation:
     - required: "'Value' is required"
     - string: "'Value' must be a string"
    */
    category?: string; //String
    /**(DateTime)

    Validation:
     - required: "'Value' is required"
     - date: "'Value' must be a date"
    */
    created?: Date; //DateTime

    //Navigation Properties
    /**(IBreezeUser)
    */
    author?: IBreezeUser;
    /**(IBreezePostComment)
    */
    comments?: IBreezePostComment[];
		}

		export interface _CreateBlog
    extends _IntDefs._Post { }

		export interface __opt_CreateBlog
    extends _IntDefs.__opt_Post { }

		export interface _CreateBlogCommand
    extends _IntDefs._CreateBlog { }

		export interface __opt_CreateBlogCommand
    extends _IntDefs.__opt_CreateBlog { }

		export interface _EditBlogCommand
    extends _IntDefs._CreateBlog {
    //Data Properties
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    postId: string; //Guid
		}

		export interface __opt_EditBlogCommand
    extends _IntDefs.__opt_CreateBlog {
    //Data Properties
    /**(Guid)

    Validation:
     - required: "'Value' is required"
     - guid: "'Value' must be a GUID"
    */
    postId?: string; //Guid
		}

		export interface _DeleteBlogCommand
    extends _IntDefs._EditBlogCommand { }

		export interface __opt_DeleteBlogCommand
    extends _IntDefs.__opt_EditBlogCommand { }

		export interface _UpdateBlogCommand
    extends _IntDefs._EditBlogCommand { }

		export interface __opt_UpdateBlogCommand
    extends _IntDefs.__opt_EditBlogCommand { }

		export interface _Product
    extends breeze.Entity {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    articleId: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    unit?: string; //String
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    unitAmount?: number; //Int32
    /**(Decimal)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    price: number; //Decimal
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isTaxIncluded: boolean; //Boolean
    /**(Decimal)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    taxPart: number; //Decimal
		}

		export interface __opt_Product {
    //Data Properties
    /**(Int32) [Key]
    [DatabaseGenerated(Identity)]

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    id?: number; //Int32
    /**(Int32)

    Validation:
     - required: "'Value' is required"
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    articleId?: number; //Int32
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    name?: string; //String
    /**(String)

    Validation:
     - string: "'Value' must be a string"
    */
    unit?: string; //String
    /**(Int32)

    Validation:
     - int32: "'Value' must be an integer between the values of -2147483648 and 2147483647"
    */
    unitAmount?: number; //Int32
    /**(Decimal)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    price?: number; //Decimal
    /**(Boolean)

    Validation:
     - required: "'Value' is required"
     - bool: "'Value' must be a 'true' or 'false' value"
    */
    isTaxIncluded?: boolean; //Boolean
    /**(Decimal)

    Validation:
     - required: "'Value' is required"
     - number: "'Value' must be a number"
    */
    taxPart?: number; //Decimal
		}

}

// ReSharper restore InconsistentNaming
