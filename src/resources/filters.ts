import {bindable, inject} from 'aurelia-framework';
import {ViewModel, bindingEngine, ReactiveList, ListFactory, IFilterInfo, SortDirection, IFilter, ISort} from '../services/lib';

export class Filters<T> extends ViewModel {
  @bindable items: T[] = [];
  @bindable filters: IFilter<T>[] = [];
  @bindable sort: ISort<T>[] = [];
  @bindable customSort: (item1: T, item2: T) => number;
  @bindable searchFields: string[] = [];
  @bindable viewTypes: ViewType[] = [ViewType.Card, ViewType.List];
  @bindable selectedViewType: ViewType;
  @bindable typeaheadOptions: ITypeahead<T>;
  @bindable searchInputPlaceholder: string;
  @bindable customHandler: (info: IFilterInfo<T>) => Promise<{ items: T[]; inlineCount: number }>;
  sortOrder: ISort<T>;
  searchInput: string;
  enabledFilters: IFilter<T>[] = [];
  enabledAndFilters: IFilter<T>[] = [];
  filteredItems: T[] = [];
  _searchInput: string;
  _debouncer = new Debouncer(v => this.updateFilteredItems(), 250);
  viewTypeEnum = ViewType;

  typeaheadSelect: (e: T) => void;

  bind(bindingContext) {
    // to workaround aurelia not picking up the changed selection..
    this.typeaheadSelect = (e: T) => {
      var selector = this.typeaheadOptions && this.typeaheadOptions.selector ? this.typeaheadOptions.selector : this.typeaheadOptions.display;
      this.searchInput = selector(e);
      if (this.typeaheadOptions && this.typeaheadOptions.select) {
        this.typeaheadOptions.select(e);
      }
    }
    this.selectedViewType = this.viewTypes.asEnumerable().firstOrDefault();
    if (this.sort) this.sortOrder = this.sort.asEnumerable().firstOrDefault();
    if (this.filters) this.enabledFilters = this.filters.asEnumerable().toArray();

    this.updateFilteredItems();

    this.subscriptions.subd(d => {
      d(this.observeEx(x => x.searchInput)
        .skip(1)
        .subscribe(x => this.initiateUpdate()));
      d(this.observeEx(x => x.sortOrder)
        .skip(1)
        .subscribe(x => this.initiateUpdate()));
      d(bindingEngine.collectionObserver(this.items)
        //.where(x => this.customHandler == null)
        .subscribe(x => { if (!this.customHandler) this.initiateUpdate() }));
      d(bindingEngine.collectionObserver(this.enabledFilters)
        .subscribe(x => this.initiateUpdate()));
    });
  }

  unbind() { this.subscriptions.dispose(); }

  public getIconForViewType(type: ViewType) {
    switch (type) {
      case ViewType.Card: return "withSIX-icon-Display-Grid";
      case ViewType.List: return "withSIX-icon-Display-List";
    }
  }

  customCount: number;
  get totalCount() { return this.customCount == null ? this.items.length : this.customCount }


  public async updateFilteredItems() {
    if (this.customHandler) {
      let r = await this.customHandler({ search: { input: this.searchInput, fields: this.searchFields }, sortOrder: this.sortOrder, enabledFilters: this.enabledFilters })
      this.filteredItems = r.items;
      this.customCount = r.inlineCount
    } else {
      this.filteredItems = this.orderItems(this.filterItems()).toArray();
    }
    Tk.Debug.log("updatedFilteredItems", this.filteredItems.length);
  }

  public toggleDirection(): void {
    this.sortOrder.direction = this.sortOrder.direction == SortDirection.Desc ? SortDirection.Asc : SortDirection.Desc;
    this.initiateUpdate();
  }

  public orderItems(items: Enumerable<any>): Enumerable<any> {
    if (!this.customSort && !this.sortOrder) return items;
    let start = 0;

    if (this.customSort && !this.sortOrder) { // TODO: We can't do 'thenBy' yet...
      start = 1;
      items = items.orderBy(x => x, this.customSort);
    }

    if (!this.sortOrder) return items;
    var sortOrders = [this.sortOrder];
    sortOrders.forEach((s, i) => {
      if ((i + start) == 0) {
        items = s.direction == SortDirection.Desc
          ? items.orderByDescending(x => x[s.name] || '')
          : items.orderBy(x => x[s.name] || '');
      } else {
        items = s.direction == SortDirection.Desc
          ? (<OrderedEnumerable<any>>items).thenByDescending(x => x[s.name])
          : (<OrderedEnumerable<any>>items).thenBy(x => x[s.name]);
      }
    });
    return items;
  }

  public filterItems(): Enumerable<any> {
    var e = this.items.asEnumerable();
    var searchInput = this.searchInput && this.searchInput.trim();
    if (searchInput) {
      e = e.where(x => this.searchFields.asEnumerable().any(v => x[v] && x[v].containsIgnoreCase(searchInput))).toArray().asEnumerable();
    }
    if (this.filters && this.filters.asEnumerable().any()) {
      e = e.where(x => this.enabledFilters.asEnumerable().any(f => f.filter(x)));
      if (this.enabledAndFilters.length > 0)
        e = e.where(x => this.enabledAndFilters.asEnumerable().all(f => f.filter(x)));
    }
    return e;
  }

  initiateUpdate = () => this._debouncer.update();
}


export interface ITypeahead<T> {
  // todo; find out how to keep the this bind properly so we can use methods instead!
  substringMatcher: (query: string, searchEntity, scope) => Promise<T[]>;
  display?: (e: T, query?: string) => string;
  selector?: (e: T, query?: string) => string;
  select?: (e: T) => void;
}

export enum ViewType {
  Card,
  List
}

export class Debouncer {
  timeoutId;
  constructor(private updateFn, private debounceTime: number) { }

  static debouncePromise<T>(fn: (...args) => Promise<T>, wait, immediate?): (...args) => Promise<T> {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      var resolve;
      var promise = new Promise<T>(r => resolve = r).then(x => fn.apply(context, args));
      if (immediate) {
        immediate = false;
        resolve();
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; resolve(); }, wait);
      return promise;
    };
  };

  update() {
    Tk.Debug.log("debounce: Update");
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      Tk.Debug.log("debounce: Execute");
      this.updateFn();
    }, this.debounceTime);
  }
}
