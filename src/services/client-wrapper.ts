import {EventWrapper} from './reactive';
import {IActionTabStateUpdate, IActionNotification, IUserErrorAdded, IUserErrorResolved, StateChanged, IMod, ICollection, IContent} from 'withsix-sync-api';

export class ClientWrapper extends EventWrapper {
  get stateChanged() { return this.observableFromEvent<StateChanged>(StateChanged) }
  get actionUpdateNotification() { return this.observableFromEvent<IActionTabStateUpdate>("status.actionUpdateNotification") }
  get actionNotification() { return this.observableFromEvent<IActionNotification>("status.actionNotification") }
  get userErrorAdded() { return this.observableFromEvent<IUserErrorAdded>("client.userErrorAdded") }
  get userErrorResolved() { return this.observableFromEvent<IUserErrorResolved>("client.userErrorResolved") }
}

export class GameChanged { constructor(public id?: string, public slug?: string) { } }

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
