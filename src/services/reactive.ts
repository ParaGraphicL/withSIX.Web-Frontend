import {Base, Subscriptions, IDisposable, ISubscription, IPromiseFunction, bindingEngine} from './base';
import {LegacyMediator, Mediator} from './mediator';
import {W6} from './withSIX';
import {Toastr} from './toastr';
import * as Rx from 'rx';
import {Container, inject, PropertyObserver} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Validation, ValidationResult} from 'aurelia-validation';
import {GlobalErrorHandler} from './legacy/logger';


export class ObservableEventAggregator extends EventAggregator {
  observableFromEvent = <T>(evt: Function | string) => ObservableEventAggregator.observableFromEvent<T>(evt, this);
  static observableFromEvent = <T>(evt: Function | string, eventBus: EventAggregator) =>
    Rx.Observable.create<T>((observer) => eventBus.subscribe(evt, x => observer.onNext(x)))
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

export class ReactiveList<T> extends Base implements Rx.Disposable {
  items: T[];

  allObservable: ObserveAll<T>;
  prepare(items: T[], properties?: string[]) {
    if (!(items instanceof Array) /* && !(items instanceof Map) */) throw new Error("Currently only Array supported");

    this.allObservable = new ObserveAll<T>(properties);
    this.items = items;
    //if (this.items.asEnumerable().any(x => x == null)) this.tools.Debug.warn("Has null items", this.items);
    items.filter(x => x != null).forEach(this.observeItem);
    this.subscriptions.subd(d => {
      var sub = bindingEngine.collectionObserver(this.items)
        .subscribe(x => {
          // TODO: Make item observation optional..
          if (x.length == 0) return;

          var added: T[] = [];
          var removed: T[] = [];
          x.forEach(x => {
            if (x.addedCount > 0) this.items.asEnumerable().skip(x.index).take(x.addedCount).toArray().forEach(x => added.push(x))// XXX:
            if (x.removed.length > 0) x.removed.forEach(x => removed.push(x));
          });
          if (added.length > 0) this.itemsAdded.onNext(added);
          if (removed.length > 0) this.itemsRemoved.onNext(removed);
        });
      d(sub);
      d(this.itemsAdded.subscribe(evt => evt.filter(x => x != null).forEach(x => this.observeItem(x))));
      d(this.itemsRemoved.subscribe(evt => evt.filter(x => x != null).forEach(x => { this.changedSubs.get(x).dispose(); this.changedSubs.delete(x); })));
      d(() => this.changedSubs.forEach((v, k) => { v.dispose(); this.changedSubs.delete(k) }));
    });
  }

  observeItem = (x: T) => this.changedSubs.set(x, this.observeItemInternal(x));
  observeItemInternal = (x: T) => this.allObservable.generateObservable(x).subscribe(evt => { try { this.itemChanged.onNext(evt) } catch (err) { this.tools.Debug.warn("uncaught err handling observable", err) } });

  dispose() {
    this.subscriptions.dispose();
    this.itemsAdded.dispose();
    this.itemsRemoved.dispose();
    this.itemChanged.dispose();
  }

  get modified() { return Rx.Observable.merge(this.itemsAdded.select(x => 0), this.itemsRemoved.select(x => 0), this.itemChanged.select(x => 0)) }

  itemsAdded = new Rx.Subject<T[]>();
  itemsRemoved = new Rx.Subject<T[]>();
  itemChanged = new Rx.Subject<IPropertyChange<T>>();
  changedSubs = new Map<T, IDisposable>();
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

    if (this.properties)
      return Rx.Observable.merge(this.properties.map(p => this.observeProperty(x, p)));

    let obs: Rx.Observable<IPropertyChange<T>>[] = [];
    this.properties = [];
    // Observes all properties... sucks impl??
    for (let i in x) {
      if (x.hasOwnProperty(i)) {
        this.properties.push(i); // cache
        obs.push(this.observeProperty(x, i))
      }
    }
    return Rx.Observable.merge(obs);
  }

  // observeItemInternal(x: T, callback): IDisposable {
  //   if (x == null) throw new Error("x is null");
  //   return this.generateObservable(x).subscribe(evt => {
  //     this.tools.Debug.log("$$$ propertyObserver: ", evt.item, evt.propertyName, evt.change);
  //     callback(evt);
  //   });
  // }

  observeProperty = (x: T, p: string) => Base.observe<T>(x, p)
    .skip(this.includeInitial ? 0 : 1)
    .select(evt => { return { item: x, propertyName: p, change: evt } })
}

export interface ICommandInfo {
  canExecuteObservable?: ISubscription<boolean> | Rx.Observable<boolean>;
  isVisibleObservable?: ISubscription<boolean> | Rx.Observable<boolean>;
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

export var uiCommand2 = function <T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo): ICommand<T> { // Rx.Observable<boolean>
  let command = new UiCommandInternal<T>(name, action, options);
  let eh: GlobalErrorHandler = Container.instance.get(GlobalErrorHandler);
  command.thrownExceptions.subscribe(x => eh.handleUseCaseError(x, 'unhandled'));

  // TODO: Optimize?
  let f = (...args) => command.execute(...args);
  let f2 = <ICommand<T>>f;
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

export var uiCommandWithLogin2 = function <T>(name: string, action: IPromiseFunction<T>, options?: ICommandInfo): ICommand<T> {
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

interface ICommand<T> extends IDisposable, IPromiseFunction<T> {
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

class UiCommandInternal<T> extends Base {
  isExecuting = false;
  otherBusy = false;
  isVisible = true;
  cls: string;
  icon: string;
  textCls: string;
  tooltip: string;
  public thrownExceptions = new Rx.Subject<Error>();
  public isExecutingObservable = this.observeEx(x => x.isExecuting);
  public isVisibleObservable = this.observeEx(x => x.isVisible);
  public canExecuteObservable = this.observeEx(x => x.canExecute);

  constructor(public name: string, private action: IPromiseFunction<T>, options?: ICommandInfo) {
    super();
    if (action == null) throw new Error("action cant be null!");
    if (!options) return;

    this.cls = options.cls;
    this.icon = options.icon;
    this.textCls = options.textCls;
    this.tooltip = options.tooltip;

    if (options.canExecuteObservable) this.subscriptions.subd(d => d(options.canExecuteObservable.subscribe(x => this.otherBusy = !x)));
    if (options.isVisibleObservable) this.subscriptions.subd(d => d(options.isVisibleObservable.subscribe(x => this.isVisible = x)));
  }

  public get canExecute() { return !this.isExecuting && !this.otherBusy; }
  public dispose() { this.subscriptions.dispose(); }

  public async execute(...args): Promise<T> {
    this.isExecuting = true;
    try {
      return await this.action(...args);
    } catch (err) {
      if (this.thrownExceptions.hasObservers) this.thrownExceptions.onNext(err);
      else throw (err); // TODO: Unhandled exception handler!!
    } finally {
      this.isExecuting = false;
    }
  }
}


export class EditConfig extends Base {
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

  edit = uiCommand2("Edit", async () => this.enabled = true, { isVisibleObservable: this.observeEx(x => x.canEdit) });
  close = uiCommand2("Close", async () => this.enabled = false, { canExecuteObservable: this.observeEx(x => x.canClose) });
}
