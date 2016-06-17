import {CollectionScope, ItemState, ICollection, TypeScope} from 'withsix-sync-api';
import {IBreezeCollection, IBreezeMod, IBreezeMission} from './dtos';
import {W6} from './withSIX';

interface ICollectionExtend extends ICollection {
  subscribers: number;
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
      //version: x.version, // todo
    }
  }
}

export class ModHelper {
  public static convertOnlineMod(x: IBreezeMod, game: { id: string; slug: string }, w6: W6) {
    return {
      id: x.id,
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
      statInstall: x.stat.install
    }
  }
}

export class CollectionHelper {
  public static scopeHints = [
    'Your collection will be listed and can be searched for',
    'Only Users with a direct link will be able to download this collection',
    'Only you will be able to access this collection',
  ]

  public static scopeIcons = [
    'withSIX-icon-Nav-Server',
    'withSIX-icon-Hidden',
    'withSIX-icon-Lock'
  ]

  public static convertOnlineCollection(collection: IBreezeCollection, type: TypeScope, w6: W6): ICollectionExtend {
    return {
      id: collection.id,
      image: w6.url.getContentAvatarUrl(collection.avatar, collection.avatarUpdatedAt),
      typeScope: type || (collection.authorId == w6.userInfo.id ? TypeScope.Published : null), // todo; figure out if we're subscribed
      author: collection.author.displayName,
      authorSlug: collection.author.slug,
      slug: collection.slug,
      name: collection.name,
      gameId: collection.game.id,
      gameSlug: collection.game.slug,
      sizePacked: collection.sizePacked,
      type: "collection",
      version: collection.latestVersion.version,
      hasServers: collection.latestVersion.hasServers,
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
    if (!constraint || !version) return state;
    if (state != ItemState.UpdateAvailable && state != ItemState.Uptodate) return state;
    return constraint == version ? ItemState.Uptodate : ItemState.UpdateAvailable;
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
