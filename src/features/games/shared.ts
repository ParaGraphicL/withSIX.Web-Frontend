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
}
