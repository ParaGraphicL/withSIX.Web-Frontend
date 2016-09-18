import {CollectionScope, ItemState, ICollection, TypeScope, IIPEndpoint} from 'withsix-sync-api';
import {IBreezeCollection, IBreezeMod, IBreezeMission} from './dtos';
import {W6} from './withSIX';
import breeze from 'breeze-client';
import {W6Context} from './w6context';

interface ICollectionExtend extends ICollection {
  subscribers: number;
  groupId?: string;
}


class GameIds {
  static Arma1 = "1781B5A8-7C05-4B5D-8EC3-62C14DA42B5B";
  static Arma2Oa = "B4EC1290-CECD-45A3-977F-136C5929E51C";
  static Arma2 = "FA5A2E52-D760-4B12-ACBD-07FD35FF12E8";
  static Arma2Co = "1947DE55-44ED-4D92-A62F-26CFBE48258B";
  static Arma2Free = "FA5A2B52-D770-4B12-ACBD-07FD35CB12E8";
  static Arma3 = "9DE199E3-7342-4495-AD18-195CF264BA5B";
  static IronFront = "3EBAA36D-CA5C-4C08-B4A8-3B1CAE423F65";
  static TKOH = "C24098DC-4EFC-443D-B1A4-3FA69512780A";
  static TKOM = "AE3D9D2D-F09B-4E2F-BF1A-89D9C6BA4FA9";
  static DayZSA = "E3EB8AC2-AE32-41D0-8B34-E936A20B31A6";
  static Homeworld2 = "E65A1906-F0CB-4B78-835E-E367E6DB6962";
  static CarrierCommand = "6A1D6219-F47C-4EEB-BE3E-D8E39BF89FE0";
  static KerbalSP = "A980BC60-74E1-46D9-9F3D-8BB695A21B69";
  static GTAV = "BE87E190-6FA4-4C96-B604-0D9B08165CC5";
  static GTAIV = "8BA4D622-2A91-4149-9E06-EF40DF4E2DCB";
  static Witcher3 = "5137A2FB-1A8D-4DA8-97F6-65F88042E4D6";
  static Stellaris = "54218fae-042d-5368-bbb4-275e36d78da5";
  static Starbound = "c56ca8b0-8095-5191-b942-141f75fe001c";
  static Skyrim = "90abc214-0abd-53c7-a1c7-046114af5253";
  static NMS = "b9afdadd-8d3f-596c-8726-0aeb1e25c9db";
  static Fallout4 = "084b1585-7f92-55ce-af4c-fdf551e080f6";
}

export class GameHelper {
  static gameIds = GameIds;

  static toAddresss(addr: IIPEndpoint) {
    return `${addr.address}:${addr.port}`;
  }

  static async getGameServers(gameId: string, context: W6Context) {
    if (gameId === GameHelper.gameIds.Starbound) {
      const w6Cheat = <any>window.w6Cheat;
      const servers = w6Cheat.servers || (w6Cheat.servers = {});
      return <Map<string, any>>servers[gameId] || (servers[gameId] =
        (await context.getCustom<any[]>("http://cdn2.withsix.com/servers/SB-Servers.json"))
          .toMap(x => GameHelper.toAddresss(x.address)));
    } else {
      return new Map<string, any>();
    }
  }
}

export class MissionHelper {
  public static convertOnlineMission(x: IBreezeMission, game: { id: string; slug: string }, w6: W6) {
    return {
      id: x.id,
      image: w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
      author: x.author.displayName,
      authorSlug: x.author ? x.author.slug : null,
      slug: x.slug,
      name: x.name,
      gameId: game ? game.id : x.game.id,
      gameSlug: game ? game.slug : x.game.slug,
      originalGameId: x.game.id,
      originalGameSlug: x.game.slug,
      size: x.size,
      sizePacked: x.sizePacked,
      stat: x.stat,
      type: "mission",
      // version: x.version, // todo
    }
  }
}

export class ModHelper {
  public static interestingFields = ["id", "name", "packageName", "group", "groupId", "gameId", "game", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "authorText", "size", "sizePacked", "followersCount", "modVersion", "stat", "latestStableVersion", "publishers"]
  public static async getCompatibilityModIds(compatibilityMods: string[], gameId: string, context: W6Context) {
    let jsonQuery = {
      from: 'Mods',
      where: {
        'packageName': { in: compatibilityMods },
        'gameId': gameId
      }
    }
    // TODO: cache. or use id's in Helper, or cache the link between slug+game -> id??
    let q = new breeze.EntityQuery(jsonQuery).select(["id"]);
    let results = await context.queryLocallyOrServerWhenNoResults<IBreezeMod>(q);
    return results.map(x => x.id)
  }

  public static convertOnlineMod(x: IBreezeMod, game: { id: string; slug: string }, w6: W6) {
    return {
      id: x.id,
      packageName: x.packageName,
      image: w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
      author: x.authorText || x.author.displayName,
      authorSlug: x.author ? x.author.slug : null,
      slug: x.slug,
      name: x.name,
      gameId: game ? game.id : x.game.id,
      gameSlug: game ? game.slug : x.game.slug,
      originalGameId: x.game.id,
      originalGameSlug: x.game.slug,
      size: x.size,
      sizePacked: x.sizePacked,
      stat: x.stat,
      type: "mod",
      version: x.latestStableVersion,
      statInstall: x.stat.install,
      statTotalInstall: x.stat.totalInstall,
      publishers: x.publishers
    }
  }
}

export class ServerHelper {
  public static scopeHints = [
    'Your server will be listed and can be searched for',
    'Only Users with a direct link will be able to find this server',
    'Only users in the group will be able to find this server'
  ]

  public static scopeIcons = [
    'withSIX-icon-Nav-Server',
    'withSIX-icon-Hidden',
    'withSIX-icon-Lock'
  ]

  public static scopes = [CollectionScope.Public, CollectionScope.Unlisted, CollectionScope.Private]
}

export class CollectionHelper {
  public static scopeHints = [
    'Your collection will be listed and can be searched for',
    'Only Users with a direct link will be able to download this collection',
    'Only you will be able to access this collection'
  ]

  public static scopeIcons = [
    'withSIX-icon-Nav-Server',
    'withSIX-icon-Hidden',
    'withSIX-icon-Lock'
  ]

  public static typeScopeIcons = [
    "",
    "withSIX-icon-System-Remote",
    "withSIX-icon-Cloud",
  ]

  public static convertOnlineCollection(collection: IBreezeCollection, type: TypeScope, w6: W6): ICollectionExtend {
    return {
      id: collection.id,
      image: w6.url.getContentAvatarUrl(collection.avatar, collection.avatarUpdatedAt),
      scope: CollectionScope[collection.scope],
      typeScope: type || (collection.authorId == w6.userInfo.id ? TypeScope.Published : null), // todo; figure out if we're subscribed
      author: collection.author.displayName,
      authorSlug: collection.author.slug,
      groupId: collection.groupId,
      slug: collection.slug,
      name: collection.name,
      gameId: collection.game.id,
      gameSlug: collection.game.slug,
      sizePacked: collection.sizePacked,
      type: "collection",
      version: collection.latestStableVersion,
      hasServers: collection.hasServers,
      subscribers: collection.subscribersCount
    }
  }

  public static scopes = [CollectionScope.Public, CollectionScope.Unlisted, CollectionScope.Private]
}

export class ContentHelper {
  public static getConstentStateInitial = (state: { state: ItemState; version: string }, constraint?: string) => {
    if (!state) return ItemState.NotInstalled;
    return ContentHelper.getContentState(state.state, state.version, constraint);
  }
  public static getContentState = (state: ItemState, version: string, constraint?: string) => {
    if (!state || !constraint || !version) return state;
    if (state !== ItemState.UpdateAvailable && state !== ItemState.Uptodate) return state;
    return constraint.toLowerCase() === version.toLowerCase() ? ItemState.Uptodate : ItemState.UpdateAvailable;
  }

  public static itemStateToAction = (state: ItemState) => {
    switch (state) {
      case ItemState.NotInstalled:
      case ItemState.Incomplete:
      case ItemState.UpdateAvailable:
        return Action.Install;
      case ItemState.Uptodate:
        return Action.Launch;
      default: return Action.None;
    }
  }
}


export enum Action {
  None,
  Install,
  Launch
}
