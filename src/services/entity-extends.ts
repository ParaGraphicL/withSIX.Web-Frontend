import breeze from 'breeze-client';

import { IBreezeModMediaItem } from './dtos';

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
  emailConfirmed: boolean;
  email: string;
  passwordSet: boolean;
  hasGroups: boolean;
  clearAvatars(): void;
  getAvatarUrl(size: number): string;
  isInRole(role: string): boolean;
  isInRoles(...roles: string[]): boolean;
  isInRoles(roles: string[]): boolean;
  hasPermission(resource: string, action: string): boolean;
  roles: string[];
  failedLogin: boolean;
}

export abstract class Role {
  static admin = "admin";
  static user = "user";
  static bot = "bot";
  static manager = "manager";
  static premium = "premium";
  static authorBeta = "author_beta";
  static author = "author";
}

export abstract class Resource {
  static admin = "admin";
  static mods = "mods";
}

export abstract class Permission {
  static Create = "create"; // new
  static Read = "read"; // view, list
  static Update = "update"; // edit
  static Delete = "delete"; // destroy
}

export abstract class ModPermission {
  static CreateReport = 'create_report';
}

// TODO: See if we can somehow sync up with the C# PermissionManager somehow
export abstract class Permissions {
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
        if (actions && actions.some(x => x == action))
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

  export abstract class BaseEntity {
    // BAH
    static w6;
    static eventPublisher: (evt) => void;
    publishEvent(evt) { return BaseEntity.eventPublisher(evt); }
  }

  export abstract class CollectionVersion implements ICollectionVersion {
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

  export abstract class Collection { }

  export abstract class UserBase implements IUser {
    private _avatars = {};
    private _profileUrl: string;
    public slug: string;

    getAvatarUrl(size) { return this._avatars[size] || (this._avatars[size] = BaseEntity.w6.url.calculateAvatarUrl(<any>this, size)); }

    clearAvatars() { this._avatars = {}; }

    get profileUrl() { return this._profileUrl || (this._profileUrl = this.slug ? BaseEntity.w6.url.getUserSlugUrl(this.slug) : null); }

    isInRole(role: string): boolean { return this.roles.some(x => x == role) }
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

  export abstract class User extends UserBase {
    static $name = 'User';
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

  export abstract class Weather implements IWeather {
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

  export abstract class Mod {
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

  export abstract class Game implements IGame {
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

  export abstract class Mission {
  }

  export interface IMission {
    tags: string[];
  }

  export interface ICollection {
    tags: string[];
  }

  // Please note, do not inherit multiple breeze entities from the same class/constructor/prototype!
  export abstract class Comment implements IComment {
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

  export abstract class PostComment extends Comment {
  }

  export interface IPostComment extends IComment {
  }

  export abstract class MissionComment extends Comment {
  }

  export interface IMissionComment extends IComment {
  }

  export abstract class ModComment extends Comment {
  }

  export interface IModComment extends IComment {
  }

  export abstract class CollectionComment extends Comment {
  }

  export interface ICollectionComment extends IComment {
  }

  export abstract class ServerComment extends Comment {
  }

  export interface IServerComment extends IComment {
  }

  export abstract class AppComment extends Comment {
  }

  export interface IAppComment extends IComment {
  }
}
