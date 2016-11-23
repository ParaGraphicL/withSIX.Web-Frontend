import { EventWrapper } from './reactive';
import * as Rx from 'rxjs/Rx';
import { inject } from 'aurelia-framework';
import { IActionTabStateUpdate, IActionNotification, IUserErrorAdded, IUserErrorResolved, ConnectionState, IMod, ICollection, IContent, Client } from 'withsix-sync-api';


export class StateChanged {
  constructor(public oldState: ConnectionState, public newState: ConnectionState) { }
}

@inject(Client)
export class ClientWrapper implements IClientWrapper {
  constructor(private client: Client) { }
  get stateChanged() { return this.fromClient('connection.state-changed', (previous, next) => new StateChanged(previous, next)) }
  get actionUpdateNotification() { return this.fromClientNative<IActionTabStateUpdate>('status.actionUpdateNotification') }
  get actionNotification() { return this.fromClientNative<IActionNotification>('status.actionNotification') }
  get userErrorAdded() { return this.fromClientNative<IUserErrorAdded>('client.userErrorAdded') }
  get userErrorResolved() { return this.fromClientNative<IUserErrorResolved>('client.userErrorResolved') }

  private fromClientNative = <T>(eventName: string) => Rx.Observable.fromEvent<T>(this.client, eventName)
  private fromClient = <T>(eventName: string, transform: (...args) => T) => Rx.Observable.fromEvent<T>(this.client, eventName, transform);
}

export class GameChanged {
  constructor(public id: string, public slug: string, public isPageChange?: boolean) { }
}

export class AppEventsWrapper extends EventWrapper {
  get gameChanged() { return this.observableFromEvent<GameChanged>(GameChanged); }
  get basketChanged() { return this.observableFromEvent<void>("basketChanged"); }
  emitBasketChanged() { this.eventBus.publish("basketChanged") }
}


export interface IInContent extends IContent {
  constraint?: string;
}

export interface IModInContent extends IMod, IInContent { }
export interface ICollectionInContent extends ICollection, IInContent { }

/*
// TODO: Eval ES6 proxies; when it doesn't exit, auto fromClientNative
class Handler {
  constructor(private client: Client) {}
  mapping = {
    stateChanged: "connection.state-changed",
    actionUpdateNotification: "status.actionUpdateNotification",
    actionNotification: "status.actionNotification",
    userErrorAdded: "client.userErrorAdded", 
    userErrorResolved: "client.userErrorResolved"
  }
  cached = {}
  get (target, key) { return this.cached[key] || this.cached[key] = this.getInternal(target, key) }

  getInternal (target, key) {
    if (target[key]) return target[key];
    const resolved = this.mapping[key];
    if (resolved == null) throw new Error(`${key} undefined`); 
    return this.fromClientNative(resolved); 
  }

  private fromClientNative = <T>(eventName: string) => Rx.Observable.fromEvent<T>(this.client, eventName)
}

const createClientWrapper = (client: Client) => <IClientWrapper> new Proxy(new ClientWrapper(client), new Handler(client))
*/

interface IClientWrapper {
  readonly stateChanged: Rx.Observable<StateChanged>;
  readonly actionUpdateNotification: Rx.Observable<IActionTabStateUpdate>;
  readonly actionNotification: Rx.Observable<IActionNotification>;
  readonly userErrorAdded: Rx.Observable<IUserErrorAdded>;
  readonly userErrorResolved: Rx.Observable<IUserErrorResolved>;
}
