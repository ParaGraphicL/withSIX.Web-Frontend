import {ISort, IFilter, IFilterInfo, SortDirection, ITypeahead, ViewType, Filters, PaginatedViewModel} from '../../framework';
export class FilteredBase<T> extends PaginatedViewModel<T> {
  sort: ISort<T>[] = []
  searchFields = [];
  filters: IFilter<T>[] = [];
  typeahead: ITypeahead<T>;
  filteredComponent: Filters<T>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[] = [ViewType.Card];
  viewType = ViewType.Card;
  filterInfo: IFilterInfo<T> = { search: { input: null, fields: this.searchFields }, enabledFilters: [], sortOrder: this.sort.asEnumerable().firstOrDefault() }

  first = true;

  handleFilter = async (info: IFilterInfo<T>) => {
    if (this.first) {
      this.first = false;
      return this.model; // pff
    }
    this.filterInfo = info;
    this.model = await this.getMore()
    return this.model;
  }

  public static handleQuery = <T>(query: breeze.EntityQuery, f: IFilterInfo<T>) => {
    let si = f.search.input && f.search.input.trim();
    if (si) {
      var p = null;
      f.search.fields.forEach(x => {
        let l = new breeze.Predicate(`toLower(${x})`, breeze.FilterQueryOp.Contains, si);
        if (p == null) p = l;
        else p = p.or(l)
      })
      query = query.where(p);
    };
    // f.enabledFilters // TODO
    if (f.sortOrder) query = f.sortOrder.direction == SortDirection.Desc ? query.orderByDesc(f.sortOrder.name) : query.orderBy(f.sortOrder.name);
    return query;
  }
}
