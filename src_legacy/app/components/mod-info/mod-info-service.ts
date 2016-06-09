module MyApp.Components.ModInfo {
  // Deprecated in favour of withsix-sync-api
  export interface IContentState {
    id: string; gameId: string; state: ItemState; version: string;
    speed?: number; progress?: number;
  }

  export enum ItemState {
    NotInstalled = 0,

    Uptodate = 1,

    UpdateAvailable = 2,
    Incomplete = 3,

    Installing = 11,
    Updating = 12,
    Uninstalling = 13,
    Diagnosing = 14,
    Launching = 15
  }

  export interface IClientInfo {
    content: { [id: string]: IContentState };
    globalLock: boolean;
    gameLock: boolean;
    isRunning: boolean;
  }

  export enum State {
    Normal = 0,
    Paused = 1,
    Error = 2,
  }
}
