import {CollectionScope, ItemState} from 'withsix-sync-api';

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
