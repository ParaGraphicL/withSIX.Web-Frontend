// TODO: For array enumerable functions etc use defineProperty from https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js

declare var googletag: any;
declare var Markdown: any;

interface Function {
  $name?: string;
}

interface JQuery {
  redactor(options): any;
}

interface JQueryStatic {
  validator: any;
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
  sluggifyEntityName: () => string;
  format: (args: any[]) => string;
  truncate: (count: number) => string;
}

interface IPromiseFunction<T> {
  (...args): Promise<T>
}

interface ICommandInfo {
  canExecuteObservable?: Rx.Observable<boolean>;
  isVisibleObservable?: Rx.Observable<boolean>;
  icon?: string;
  textCls?: string;
  cls?: string;
  tooltip?: string;
}

interface IDisposable {
  dispose();
}

interface ICommand<T> extends IDisposable, IPromiseFunction<T> {
  isExecuting: boolean;
  isExecutingObservable: Rx.Observable<boolean>;
  isVisible: boolean;
  isVisibleObservable: Rx.Observable<boolean>;
  name: string;
  cls: string;
  icon: string;
  textCls: string;
  tooltip: string;
  canExecute: boolean;
  canExecuteObservable: Rx.Observable<boolean>;
  execute(...args): Promise<T>;
}

interface IApi {
  errorMsg(error): string[];
  openSettings(model?): void;
  createCommand<T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo): ICommand<T>;
  createGameBasket(gameId, basketModel): any;
  getContentStateInitial(state: { state /*: MyApp.Components.ModInfo.ItemState */; version: string }, constraint?: string);//: MyApp.Components.ModInfo.ItemState;
}

interface Window {
  // legacy client
  six_client: {
    open_pws_uri: (url) => void;
    refresh_login(): void;
    login(accessToken: string): void;
    subscribedToCollection(id: string): void;
    unsubscribedFromCollection(id: string): void;
  }
  // node api
  api: {
    openExternalUrl(url: string): void
  }
  w6Cheat: {
    api: IApi;
  }
  assetHash: { [asset: string]: string }
  prerenderReady: boolean;
  RedactorPlugins;
}
