import { Base, ReactiveBase, Subscriptions, IDisposable, ISubscription, IPromiseFunction, bindingEngine } from './base';
import { LegacyMediator, Mediator } from './mediator';
import { W6 } from './withSIX';
import { Toastr } from './toastr';
import * as Rx from 'rxjs/Rx';
import * as RxUi from 'rxui';
import { Container, inject, PropertyObserver } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Validation, ValidationResult } from 'aurelia-validation';
import { GlobalErrorHandler } from './legacy/logger';
import { ErrorHandler } from './error-handler';

const { Subject } = Rx;


export class ObservableEventAggregator extends EventAggregator {
  observableFromEvent = <T>(evt: Function | string) => ObservableEventAggregator.observableFromEvent<T>(evt, this);
  static observableFromEvent = <T>(evt: Function | string, eventBus: EventAggregator): Rx.Observable<T> =>
    Rx.Observable.create((observer: Rx.Subject<T>) => eventBus.subscribe(evt, x => observer.next(x)))
      .publish().refCount();
}

@inject(EventAggregator)
export abstract class EventWrapper {
  constructor(protected eventBus: EventAggregator) { }

  observableFromEvent = <T>(evt: Function | string) => ObservableEventAggregator.observableFromEvent<T>(evt, this.eventBus);
}

export class Timer implements IDisposable {
  timeout;
  res;
  public promise: Promise<void>;
  constructor(action: () => void, time: number) {
    this.promise = new Promise<void>((resolve, rej) => {
      this.res = resolve;
      this.timeout = setInterval(action, time);
    });
  }
  dispose() { clearInterval(this.timeout); this.res ? this.res() : null }
}

export class Delay<T> implements IDisposable {
  timeout;
  rej;
  public promise: Promise<T>;
  constructor(action: () => T, time: number) {
    this.promise = new Promise<T>((resolve, rej) => {
      this.rej = rej;
      this.timeout = setTimeout(() => { resolve(action()); this.rej = null }, time);
    });
  }
  dispose() { clearTimeout(this.timeout); this.rej ? this.rej(new Error("Cancelled")) : null }
}

export function using<T extends IDisposable>(resource: T, func: () => any) {
  try {
    return func();
  } finally {
    resource.dispose();
  }
}

export async function usingAsync<T extends IDisposable>(resource: T, func: () => Promise<any>) {
  try {
    return await func();
  } finally {
    resource.dispose();
  }
}

export interface IPropertyChange<T> {
  item: T;
  propertyName: string;
  change: any;
}

export class ListFactory {
  getList<T>(existingList: T[], properties?: string[]) {
    var list = new ReactiveList<T>();
    list.prepare(existingList, properties);
    return list;
  }

  //getObserveAll = <T>(properties?: string[]) => new ObserveAll<T>(properties);
  getObserveAll = <T>(item: T, properties?: string[]) => new ObserveAll<T>(properties).generateObservable(item);
  // getObserveAllEx = <TProp, T>(source: T, exp: (u: T) => TProp, properties?: string[]) => {
  //   var prop = Base.getPropertyName(exp);
  //   var item: TProp = source[prop];
  //   return this.getObserveAll(item, properties);
  // }
}

// TODO: Explore ReactiveArray from RxUi
export class ReactiveList<T> extends ReactiveBase implements IDisposable {
  items: T[];

  allObservable: ObserveAll<T>;
  prepare(items: T[], properties?: string[]) {
    if (!(items instanceof Array) /* && !(items instanceof Map) */) throw new Error("Currently only Array supported");

    this.allObservable = new ObserveAll<T>(properties);
    this.items = items;
    //if (this.items.some(x => x == null)) this.tools.Debug.warn("Has null items", this.items);
    items.filter(x => x != null).forEach(this.observeItem);
    this.subscriptions.subd(d => {
      var sub = Base.observeCollection(this.items)
        .subscribe(x => {
          // TODO: Make item observation optional..
          const { added, removed } = Base.getChanges(x, this.items);
          if (added.length > 0) this._itemsAdded.next(added);
          if (removed.length > 0) this._itemsRemoved.next(removed);
        });
      d(sub);
      d(this.itemsAdded.subscribe(evt => evt.filter(x => x != null).forEach(x => this.observeItem(x))));
      d(this.itemsRemoved.subscribe(evt => evt.filter(x => x != null).forEach(x => { this.changedSubs.get(x).unsubscribe(); this.changedSubs.delete(x); })));
      d(() => this.changedSubs.forEach((v, k) => { v.unsubscribe(); this.changedSubs.delete(k) }));
    });
  }

  observeItem = (x: T) => this.changedSubs.set(x, this.observeItemInternal(x));
  observeItemInternal = (x: T) => this.allObservable.generateObservable(x).subscribe(evt => { try { this._itemChanged.next(evt) } catch (err) { this.tools.Debug.warn("uncaught err handling observable", err) } });

  dispose() {
    this.subscriptions.dispose();
    this._itemsAdded.unsubscribe();
    this._itemsRemoved.unsubscribe();
    this._itemChanged.unsubscribe();
  }

  get modified() { return Rx.Observable.merge(this.itemsAdded.map(x => 0), this.itemsRemoved.map(x => 0), this.itemChanged.map(x => 0)) }

  private _itemsAdded = new Subject<T[]>();
  private _itemsRemoved = new Subject<T[]>();
  private _itemChanged = new Subject<IPropertyChange<T>>();

  public get itemsAdded() { return this._itemsAdded.asObservable(); }
  public get itemsRemoved() { return this._itemsRemoved.asObservable(); }
  public get itemChanged() { return this._itemChanged.asObservable(); }
  private changedSubs = new Map<T, Rx.Subscription>();
}

export class ObserveAll<T> {
  constructor(private properties?: string[], private includeInitial = false) { }
  generateObservable(x: T) {
    if (x == null) throw new Error("x is null");

    /*
    .subscribe(evt => {
      this.tools.Debug.log("$$$ propertyObserver: ", x, p, evt);
      callback(x);
    });
    */

    if (this.properties) return Rx.Observable.merge(...this.properties.map(p => this.observeProperty(x, p)));

    let obs: Rx.Observable<IPropertyChange<T>>[] = [];
    this.properties = [];
    // Observes all properties... sucks impl??
    for (let i in x) {
      // TODO: hasOwnProperty wouldnt allow inherited properties, not even from prototype?!
      if (x.hasOwnProperty(i)) {
        this.properties.push(i); // cache
        obs.push(this.observeProperty(x, i))
      }
    }
    return Rx.Observable.merge(...obs);
  }

  // observeItemInternal(x: T, callback): IDisposable {
  //   if (x == null) throw new Error("x is null");
  //   return this.generateObservable(x).subscribe(evt => {
  //     this.tools.Debug.log("$$$ propertyObserver: ", evt.item, evt.propertyName, evt.change);
  //     callback(evt);
  //   });
  // }

  observeProperty = (x: T, p: string) => Base.observe<T>(x, p, this.includeInitial)
    .map(evt => { return { item: x, propertyName: p, change: evt } })
}

export interface ICommandInfo {
  canExecuteObservable?: Rx.Observable<boolean>;
  isVisibleObservable?: Rx.Observable<boolean>;
  icon?: string;
  textCls?: string;
  cls?: string;
  tooltip?: string;
}

// TODO: Header, Icon, TextCls support?? So commands can be completely reusable?
export var uiCommand = function <T>(action: IPromiseFunction<T>, canExecuteObservable?: Rx.Observable<boolean>, isVisibleObservable?: Rx.Observable<boolean>) { // Rx.Observable<boolean>
  return uiCommand2(null, action, { canExecuteObservable: canExecuteObservable, isVisibleObservable: isVisibleObservable });
}

export var uiCommandWithLogin = function <T>(action: IPromiseFunction<T>, canExecuteObservable?: Rx.Observable<boolean>, isVisibleObservable?: Rx.Observable<boolean>) {
  return uiCommandWithLogin2(null, action, { canExecuteObservable: canExecuteObservable, isVisibleObservable: isVisibleObservable });
}

export var uiCommand2 = function <T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo): IReactiveCommand<T> { // Rx.Observable<boolean>
  let command = new ReactiveCommand<T>(name, action, options);
  let eh: ErrorHandler = Container.instance.get(ErrorHandler);
  command.thrownExceptions.subscribe(x => eh.handleError(x)); // TODO: plug in retryability

  // TODO: Optimize?
  let f = (...args) => command.execute(...args);
  let f2 = <IReactiveCommand<T>>f;
  (<any>f2).command = command;
  f2.dispose = () => command.dispose.bind(command);
  Object.defineProperty(f, 'name', { get: () => command.name, set: (value) => command.name = value });
  Object.defineProperty(f, 'cls', { get: () => command.cls, set: (value) => command.cls = value });
  Object.defineProperty(f, 'tooltip', { get: () => command.tooltip, set: (value) => command.tooltip = value });
  Object.defineProperty(f, 'icon', { get: () => command.icon, set: (value) => command.icon = value });
  Object.defineProperty(f, 'textCls', { get: () => command.textCls, set: (value) => command.textCls = value });
  Object.defineProperty(f, 'canExecute', { get: () => command.canExecute });
  Object.defineProperty(f, 'isExecuting', { get: () => command.isExecuting });
  Object.defineProperty(f, 'isVisible', { get: () => command.isVisible });
  Object.defineProperty(f, 'canExecuteObservable', { get: () => command.canExecuteObservable });
  Object.defineProperty(f, 'isExecutingObservable', { get: () => command.isExecutingObservable });
  Object.defineProperty(f, 'isVisibleObservable', { get: () => command.isVisibleObservable });
  Object.defineProperty(f, 'thrownExceptions', { get: () => command.thrownExceptions });
  return f2;
}

export var uiCommandWithLogin2 = function <T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo): IReactiveCommand<T> {
  let f = <any>uiCommand2(name, action, options);
  let act = f.command.action
  let toastr = <Toastr>Container.instance.get(Toastr);
  let w6 = <W6>Container.instance.get(W6);
  f.command.action = async () => {
    // TODO: What about using Queries and Commands with IRequireUser, throwing when user missing (Decorator), and then catching that exception instead??
    if (w6.isLoggedIn) return await act(arguments);
    if (await toastr.warning("To continue this action you have to login", "Login Required")) w6.openLoginDialog(null)
  }

  return f;
}

export interface IReactiveCommand<T> extends IDisposable, IPromiseFunction<T> {
  isExecuting: boolean;
  isExecutingObservable: Rx.Observable<boolean>;
  isVisible: boolean;
  isVisibleObservable: Rx.Observable<boolean>;
  cls: string;
  icon: string;
  name: string;
  textCls: string;
  tooltip: string;
  canExecute: boolean;
  canExecuteObservable: Rx.Observable<boolean>;
  thrownExceptions: Rx.Observable<Error>;
  execute(...args): Promise<T>;
}

// TODO: Explore ReactiveCommand from RxUi
class ReactiveCommand<T> extends ReactiveBase {
  private _isExecuting: boolean;
  private _otherBusy: boolean;
  private _isVisible: boolean = true;
  private _thrownExceptions = new Subject<Error>();
  private _isExecutingObservable = new Subject<boolean>();
  private _isVisibleObservable = new Subject<boolean>();
  private _canExecuteObservable = new Subject<boolean>();

  public get isExecuting() { return this._isExecuting; }
  public get otherBusy() { return this._otherBusy; }
  public get isVisible() { return this._isVisible; }
  public get thrownExceptions(): Rx.Observable<Error> { return this._thrownExceptions.asObservable() }
  public get isExecutingObservable() { return this._isExecutingObservable.asObservable().startWith(this.isExecuting) }
  public get isVisibleObservable() { return this._isVisibleObservable.asObservable().startWith(this.isVisible) }
  public get canExecuteObservable() { return this._canExecuteObservable.asObservable().startWith(this.canExecute) }

  cls: string;
  icon: string;
  textCls: string;
  tooltip: string;

  constructor(public name: string, private action: IPromiseFunction<T>, options?: ICommandInfo) {
    super();
    if (action == null) throw new Error("action cant be null!");

    // TODO: The other way around?
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.isExecuting).subscribe(x => this._isExecutingObservable.next(x)))
      d(this.whenAnyValue(x => x.canExecute).subscribe(x => this._canExecuteObservable.next(x)))
      d(this.whenAnyValue(x => x.isVisible).subscribe(x => this._isVisibleObservable.next(x)))
    });

    if (!options) return;

    this.cls = options.cls;
    this.icon = options.icon;
    this.textCls = options.textCls;
    this.tooltip = options.tooltip;

    if (options.canExecuteObservable) this.subscriptions.subd(d => d(this.toProperty(options.canExecuteObservable.map(x => !x), x => x._otherBusy)));
    if (options.isVisibleObservable) this.subscriptions.subd(d => d(this.toProperty(options.isVisibleObservable, x => x._isVisible)));
  }

  public get canExecute() { return !this.isExecuting && !this.otherBusy; }
  public dispose() { this.subscriptions.dispose(); }

  public async execute(...args): Promise<T> {
    this._isExecuting = true;
    try {
      return await this.action(...args);
    } catch (err) {
      if (this._thrownExceptions.observers.length > 0) this._thrownExceptions.next(err);
      else throw (err); // TODO: Unhandled exception handler!!
    } finally {
      this._isExecuting = false;
    }
  }
}

export class EditConfig extends ReactiveBase {
  enabled: boolean;
  changed: boolean;
  constructor() {
    super();
    this.subscriptions.subd(d => {
      d(this.edit);
      d(this.close);
    })
  }

  get canEdit() { return !this.enabled; }
  get canClose() { return this.enabled; }

  edit = uiCommand2("Edit", async () => this.enabled = true, { isVisibleObservable: this.whenAnyValue(x => x.canEdit) });
  close = uiCommand2("Close", async () => this.enabled = false, { canExecuteObservable: this.whenAnyValue(x => x.canClose) });
}

export class BusySignalCombiner implements IDisposable {
  public readonly signal = new Subject<boolean>(); // TODO: protect
  subscribe<T>(...commands: IReactiveCommand<T>[]) { return this.combineBusySignal(...commands).subscribe(x => this.signal.next(x)); }

  private combineBusySignal<T>(...commands: IReactiveCommand<T>[]) { return this.combineBusySignalBools(...commands.map(x => x.isExecutingObservable)); }
  private combineBusySignalBools(...bools: Rx.Observable<boolean>[]) {
    var obs: Rx.Observable<boolean> = null;
    bools.forEach(x => {
      if (obs == null) obs = x;
      else obs = obs.combineLatest(x, (x, y) => x || y);
    })
    return obs;
  }

  dispose() { this.signal.unsubscribe(); }
}

export class AllSignalCombiner implements IDisposable {
  public readonly signal = new Subject<boolean>(); // TODO: protect
  subscribe<T>(...commands: IReactiveCommand<T>[]) { return this.combineBusySignal(...commands).subscribe(x => this.signal.next(x)); }

  private combineBusySignal<T>(...commands: IReactiveCommand<T>[]) { return this.combineBusySignalBools(...commands.map(x => x.isExecutingObservable)); }
  private combineBusySignalBools(...bools: Rx.Observable<boolean>[]) {
    var obs: Rx.Observable<boolean> = null;
    bools.forEach(x => {
      if (obs == null) obs = x;
      else obs = obs.combineLatest(x, (x, y) => x && y);
    })
    return obs;
  }

  dispose() { this.signal.unsubscribe(); }
}
