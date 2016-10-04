import {bindable, inject} from 'aurelia-framework';
import {ViewModel, bindingEngine, ReactiveList, ListFactory, IFilterInfo, SortDirection, IFilter, ISort, Tools,  Rx} from '../services/lib';

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
  @bindable customHandler: (arg: { info: IFilterInfo<T> }) => Promise<{ items: T[]; inlineCount: number }>;
  @bindable autoEnableFilters: boolean;
  sortOrder: ISort<T>;
  searchInput: string;
  enabledFilters: IFilter<T>[] = [];
  enabledAndFilters: IFilter<T>[] = [];
  filteredItems: T[] = [];
  _searchInput: string;
  _debouncer = new Debouncer(v => this.updateFilteredItems(), 250);
  viewTypeEnum = ViewType;

  typeaheadSelect: (e: T) => void;
  collectionObserver: Rx.Subscription;

  bind(bindingContext) {
    // to workaround aurelia not picking up the changed selection..
    this.typeaheadSelect = (e: T) => {
      var selector = this.typeaheadOptions && this.typeaheadOptions.selector ? this.typeaheadOptions.selector : this.typeaheadOptions.display;
      this.searchInput = selector(e);
      if (this.typeaheadOptions && this.typeaheadOptions.select) {
        this.typeaheadOptions.select(e);
      }
    }
    this.selectedViewType = this.viewTypes[0];
    if (this.sort) this.sortOrder = this.sort[0];
    if (this.filters && this.autoEnableFilters) this.enabledFilters = Array.from(this.filters);

    this.updateFilteredItems();

    // this.collectionObserver = Base.observeCollection(this.items)
    //   //.filter(x => this.customHandler == null)
    //   .subscribe(x => { if (!this.customHandler) this.initiateUpdate() })

    this.handleItemsChange(this.items);

    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.searchInput)
        .skip(1)
        .subscribe(x => this.initiateUpdate()));
      d(this.whenAnyValue(x => x.sortOrder)
        .skip(1)
        .subscribe(x => this.initiateUpdate()));
      d(() => this.collectionObserver ? this.collectionObserver.unsubscribe() : null);
      d(ViewModel.observeCollection(this.enabledFilters)
        .subscribe(x => this.initiateUpdate()));
    });
  }

  itemsChanged(value) {
    this.handleItemsChange(value);
    if (!this.customHandler) this.initiateUpdate();
  }

  handleItemsChange(value) {
    let old = this.collectionObserver;
    this.collectionObserver = value
      ? ViewModel.observeCollection(value).subscribe(x => { if (!this.customHandler) this.initiateUpdate() })
      : null;
    if (old) old.unsubscribe();
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
      const filterInfo: IFilterInfo<T> = { search: { input: this.searchInput, fields: this.searchFields }, sortOrder: this.sortOrder, enabledFilters: this.enabledFilters }
      const r = await this.customHandler({info: filterInfo})
      this.filteredItems = r.items
      this.customCount = r.inlineCount || (<any>r).total;
    } else {
      this.filteredItems = this.orderItems(this.filterItems())
    }
    this.tools.Debug.log("updatedFilteredItems", this.filteredItems.length);
  }

  public toggleDirection(): void {
    this.sortOrder.direction = this.sortOrder.direction == SortDirection.Desc ? SortDirection.Asc : SortDirection.Desc;
    this.initiateUpdate();
  }

  public orderItems(items: any[]): any[] {
    if (!this.customSort && !this.sortOrder) return items;

    // TODO: Don't build these functions dynamically
    // TODO: Consider using 'thenBy' library
    let sortOrders: ISort<T>[] = [];
    if (this.sortOrder) sortOrders.push(this.sortOrder);
    let sortFunctions = sortOrders.map((x, i) => (a, b) => {
      let order = x.direction == SortDirection.Desc ? -1 : 1;
      if (x.customSort) return x.customSort(a, b) * order;
      if (a[x.name] > b[x.name]) return 1 * order;
      if (a[x.name] < b[x.name]) return (1 * -1) * order;
      return 0;
    });
    if (this.customSort != null) sortFunctions.unshift(this.customSort);

    return Array.from(items).sort((a, b) => {
      for (var i in sortFunctions) {
        let r = sortFunctions[i](a, b);
        if (r) return r;
      }
      return 0;
    });

    // TODO: Linq orderBy comes back with the wrong order, however we loose some stuff here now..

    // return items.orderBy(x => x, (a, b) => {
    //   for (var i in sortFunctions) {
    //     let r = sortFunctions[i](a, b);
    //     if (r) return r;
    //   }
    //   return 0;
    // })

    // let start = 0;
    //
    // if (this.customSort && !this.sortOrder) { // TODO: We can't do 'thenBy' yet...
    //   start = 1;
    //   items = items.orderBy(x => x, this.customSort);
    // }
    //
    // if (!this.sortOrder) return items;
    // var sortOrders = [this.sortOrder];
    // sortOrders.forEach((s, i) => {
    //   if ((i + start) == 0) {
    //     items = s.direction === SortDirection.Desc
    //       ? items.orderByDescending(x => x[s.name] || '')
    //       : items.orderBy(x => x[s.name] || '');
    //   } else {
    //     items = s.direction === SortDirection.Desc
    //       ? (<OrderedEnumerable<any>>items).thenByDescending(x => x[s.name])
    //       : (<OrderedEnumerable<any>>items).thenBy(x => x[s.name]);
    //   }
    // });
    // return items;
  }

  public filterItems(): any[] {
    var e = this.items;
    var searchInput = this.searchInput && this.searchInput.trim();
    if (searchInput) {
      e = e.filter(x => this.searchFields.some(v => x[v] && x[v].containsIgnoreCase(searchInput)));
    }
    if (this.filters && this.filters.some(x => true)) {
      e = e.filter(x => this.enabledFilters.some(f => f.filter(x, f.value)));
      if (this.enabledAndFilters.length > 0)
        e = e.filter(x => this.enabledAndFilters.every(f => f.filter(x, f.value)));
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

  get tools() { return Tools; }

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
    this.tools.Debug.log("debounce: Update");
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.tools.Debug.log("debounce: Execute");
      this.updateFn();
    }, this.debounceTime);
  }
}
