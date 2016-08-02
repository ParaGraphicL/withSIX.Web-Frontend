// TODO: For array enumerable functions etc use defineProperty from https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

declare var googletag: any;
declare var Markdown: any;

// Workaround aurelia fetch
interface BufferSource {}
interface URLSearchParams {}

// Rxui
interface Proxy {}

interface Function {
  $name?: string;
}

interface JQuery {
  redactor(options): any;
}

interface JQueryStatic {
  validator: any;
}

interface Array<T> {
  flatten: <T2>() => Array<T2>;
  removeEl: (el: T) => void;
  toMap: <K>(keySelector: (x: T) => K) => Map<K, T>;
  includes: (el: T) => boolean;
  move: (fromIdx: number, toIdx: number) => void;
  //removeRange: (...el: T[]) => void;
}

interface Object {
  entries(): IterableIterator<any[]>;
}

interface String {
  endsWithIgnoreCase: (suffix) => boolean;
  startsWithIgnoreCase: (prefix) => boolean;
  containsIgnoreCase: (needle) => boolean;
  equalsIgnoreCase: (needle) => boolean;
  indexOfIgnoreCase: (needle) => number;
  toUpperCaseFirst: () => string;
  toLowerCaseFirst: () => string;
  sluggify: () => string;
  toShortId: () => string;
  fromShortId: () => string;
  sluggifyEntityName: () => string;
  truncate: (count: number) => string;
}

interface IApi {
  errorMsg(error): string[];
  openSettings(model?): void;
  openGeneralDialog(model: { model; viewModel: string }): Promise<any>;
  createGameBasket(gameId, basketModel): any;
  getContentStateInitial(state: { state /*: MyApp.Components.ModInfo.ItemState */; version: string }, constraint?: string);//: MyApp.Components.ModInfo.ItemState;
  login(evt?): void;
  navigate(url: string): void;
  logout(): void;
  render(settings: ISettings): Promise<{dispose: () => void}>
}

interface ISettings { model?; view?; viewModel?; targetElement}

interface Window {
  // from legacy client
  six_client: {
    open_pws_uri: (url) => void;
    refresh_login(): void;
    login(accessToken: string): void;
    subscribedToCollection(id: string): void;
    unsubscribedFromCollection(id: string): void;
  }
  // from electron api
  api: {
    openExternalUrl(url: string): void
  }
  w6Cheat: {
    api: IApi; // for modern client
    navigate: (string) => void; // for legacy client
  }
  assetHash: { [asset: string]: string }
  prerenderReady: boolean;
  RedactorPlugins;
}
