import {inject, Container, BindingEngine} from 'aurelia-framework';
import * as Rx from 'rxjs/Rx';
import * as RxUi from 'rxui';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Tools} from './tools';

interface IBindingEngine {
  propertyObserver<T>(obj, propertyName: string): { subscribe: (callback: (newValue: T) => any) => IDisposable }
  collectionObserver(collection): { subscribe: (callback) => IDisposable }
}

// obsolete: workaround for BindingENgine change
class BE implements IBindingEngine {
  _engine;
  get engine() {
    return this._engine || (this._engine = Container.instance.get(BindingEngine));
  }
  propertyObserver = (obj, propertyName: string) => this.engine.propertyObserver(obj, propertyName);
  collectionObserver = (collection) => this.engine.collectionObserver(collection);
}

export var bindingEngine: IBindingEngine = new BE();

export interface IDisposable {
  dispose: () => void;
}

export interface LooseDisposable {
  (fnc: IDisposable | Rx.Subscription | Function): void
}

export interface ISubscription<T> {
  subscribe(onNext: (value: T) => void): IDisposable;
}

export interface IPromiseFunction<T> {
  (...args): Promise<T>
}

export interface IFunction<T> {
  (...args): T;
}

export class Subscriptions {
  items = [];

  subd = (func: (d: LooseDisposable) => void) => func((fnc: any) => this.items.push(fnc.dispose ? fnc.dispose.bind(fnc) : (fnc.unsubscribe ? fnc.unsubscribe.bind(fnc) : fnc)));

  dispose() { this.reset(); }
  reset() {
    this.items.reverse().forEach(x => x());
    this.clear();
  }

  private clear() { this.items = []; }
}

export interface PropertyExpression<T, TProp> {
  (v: T): TProp;
}

export class ReactiveBase extends RxUi.ReactiveObject implements IDisposable {
  public subscriptions = new Subscriptions();
  get tools() { return Tools; }
  dispose() { this.subscriptions.dispose(); }
}

export class Base implements IDisposable {
  public subscriptions = new Subscriptions();

  static rx = /=>\s*\w+\.(\w+)|return\s+\w+\.(\w+)/;

  get tools() { return Tools; }

  observeEx = <T extends this, TProp>(propertyEx: (v: T) => TProp) => Base.observeEx(this, propertyEx);
  static observeEx<T, TProp>(obj: T, propertyEx: (v: T) => TProp) { return Base.observe<TProp>(obj, this.getPropertyName(propertyEx)); }

  static toProperty<T, TProp>(observer: Rx.Observable<TProp>, propertyEx: PropertyExpression<T, TProp>, ...objs: T[]): IDisposable {
    var propertyName = this.getPropertyName(propertyEx);
    let dsp = new Subscriptions();
    objs.forEach(obj => dsp.subd(d => observer.subscribe(x => obj[propertyName] = x)));
    return dsp;
  }

  toProperty<T extends this, TProp>(observer: Rx.Observable<TProp>, propertyEx: PropertyExpression<T, TProp>) { return Base.toProperty(observer, propertyEx, this) }

  static getPropertyName<T, TProp>(propertyEx: PropertyExpression<T, TProp>) {
    var p = propertyEx.toString();
    var match = p.match(this.rx);
    if (!match) throw new Error("Function signature not supported: " + p);
    return match[1] || match[2];
  }

  static delay = delay => new Promise((resolve, reject) => { setTimeout(() => resolve(), delay) });

  // deprecate in favor of observeEx variants
  observe = <T>(property: string) => Base.observe<T>(this, property);
  static observe<T>(obj, property: string): Rx.Observable<T> {
    if (obj == null) throw new Error("null obj");
    if (!property) throw new Error("null property");
    let b = bindingEngine.propertyObserver<T>(obj, property);
    return Rx.Observable.create((observer: Rx.Subject<T>) => {
      observer.next(obj[property]);
      return b.subscribe(x => observer.next(x));
    }).distinctUntilChanged();
  }

  // obsolete
  // static observe<T>(obj, property: string, handleInitial = true): ISubscription<T> {
  //   let observer = bindingEngine.propertyObserver(obj, property);
  //   return {
  //     subscribe: (onNext: (value: T) => void) => {
  //       if (handleInitial) onNext(obj[property]);
  //       return observer.subscribe(onNext);
  //     }
  //   }
  // }
  // observe = <T>(property) => Base.observe<T>(this, property);
  // static wrapSubscribable = <T>(subscribable: ISubscription<T>) =>
  //   Rx.Observable.create<T>((observer: Rx.Subject<T>) => subscribable.subscribe(x => observer.next(x)).dispose)
  //     .publish().refCount().distinctUntilChanged();

  dispose() { this.subscriptions.dispose(); }
}


interface ILS {
  on: (key: string, fn) => void;
  set: (key: string, value: any) => void;
}
export class LS implements ILS {
  ls: ILS;
  constructor() {
    this.ls = <ILS><any>require('local-storage');
  }
  on = (key: string, fn) => this.ls.on(key, fn);
  set = (key: string, value: any) => this.ls.set(key, value);
};
