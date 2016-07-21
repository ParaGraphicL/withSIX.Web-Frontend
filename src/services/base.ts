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

export class Base implements IDisposable {
  public subscriptions = new Subscriptions();

  static rx = /=>\s*\w+\.(\w+)|return\s+\w+\.(\w+)/;

  get tools() { return Tools; }

  observeEx = <T extends this, TProp>(propertyEx: (v: T) => TProp) => Base.observeEx(this, propertyEx);
  static observeEx<T, TProp>(obj: T, propertyEx: (v: T) => TProp) { return Base.observe<TProp>(obj, this.getPropertyName(propertyEx), true); }

  static bindObservableTo<T, TProp>(observer: Rx.Observable<TProp>, propertyEx: PropertyExpression<T, TProp>, ...objs: T[]): IDisposable {
    var propertyName = this.getPropertyName(propertyEx);
    let dsp = new Subscriptions();
    objs.forEach(obj => dsp.subd(d => observer.subscribe(x => obj[propertyName] = x)));
    return dsp;
  }

  toProperty<T extends this, TProp>(observer: Rx.Observable<TProp>, propertyEx: PropertyExpression<T, TProp>) { return Base.bindObservableTo(observer, propertyEx, this) }

  static getPropertyName<T, TProp>(propertyEx: PropertyExpression<T, TProp>) {
    var p = propertyEx.toString();
    var match = p.match(this.rx);
    if (!match) throw new Error("Function signature not supported: " + p);
    return match[1] || match[2];
  }

  static delay = delay => new Promise((resolve, reject) => { setTimeout(() => resolve(), delay) });

  // deprecate in favor of observeEx variants
  observe = <T>(property: string, triggerInitial: boolean) => Base.observe<T>(this, property, triggerInitial);
  static observe<T>(obj, property: string, triggerInitial: boolean): Rx.Observable<T> {
    if (obj == null) throw new Error("null obj");
    if (!property) throw new Error("null property");
    let b = bindingEngine.propertyObserver<T>(obj, property);
    let o = Rx.Observable.create((observer: Rx.Subject<T>) => b.subscribe(x => observer.next(x)).dispose);
    // TODO: Why not just startWith?
    if (triggerInitial) return Rx.Observable.of(obj[property]).concat(o).distinctUntilChanged();
    else return o.distinctUntilChanged();
  }

  public static getChanges<T>(x: ChangeNotification<T>[], source: T[]) {
    var added: T[] = [];
    var removed: T[] = [];
    x.forEach(x => {
      if (x.addedCount > 0) added.push(...source.slice(x.index).slice(0, x.addedCount)) // XXX:
      if (x.removed.length > 0) removed.push(...x.removed);
    });
    return { added, removed };
  }

  public static observeCollection<T>(col: T[]): Rx.Observable<ChangeNotification<T>[]> {
    return Rx.Observable.create((observer: Rx.Subject<any>) =>
      bindingEngine.collectionObserver(col)
        .subscribe(x => {
          if (x.length > 0) observer.next(x)
        }).dispose);
  }

  dispose() { this.subscriptions.dispose(); }
}

interface ChangeNotification<T> {
  addedCount: number; index: number; removed: T[]
}


export class ReactiveBase extends RxUi.ReactiveObject implements IDisposable {
  __overrideReactiveMode = true;
  public subscriptions = new Subscriptions();
  public static observeCollection = Base.observeCollection;
  get tools() { return Tools; }
  dispose() { this.subscriptions.dispose(); }
  _pc;
  get propertyChanged() { return this._pc; }
  set propertyChanged(value) { this._pc = value; }
  reactivePropertyChanged;
  constructor() {
    super();
    let v = <any>this;
    // TODO: Or remove property..
    this.reactivePropertyChanged = super.propertyChanged;
    this.propertyChanged = (name, newValue, oldValue) => {
      v._propertyChanged.next(new RxUi.PropertyChangedEventArgs(this, name, newValue));
    }
  }
  // TODO: deprecate in favor of calling whenAnyValue directly..
  observeEx = <T extends this, TProp>(propertyEx: (v: T) => TProp) => this.whenAnyValue(propertyEx);
}


RxUi.RxApp.globalViewBindingHelper = {
  observeProp<T>(obj: Object, property: string, emitCurrentVal: boolean, callback: (args: RxUi.PropertyChangedEventArgs<T>) => void): Function {
    //let s = Base.observe<T>(obj, property, emitCurrentVal).subscribe(x => callback(new RxUi.PropertyChangedEventArgs<T>(obj, property, x)));
    //return () => s.unsubscribe();
    let cb = x => callback(new RxUi.PropertyChangedEventArgs<T>(obj, property, x));
    if (emitCurrentVal) cb(obj[property]);
    let s = bindingEngine.propertyObserver<T>(obj, property).subscribe(cb);
    return () => s.dispose();
  }
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
