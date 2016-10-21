import { ISort, IFilter, IFilterInfo, SortDirection, ITypeahead, ViewType, Filters, PaginatedViewModel } from '../framework';
export class FilteredBase<T> extends PaginatedViewModel<T> {
  sort: ISort<T>[] = []
  searchFields = [];
  filters: IFilter<T>[] = [];
  typeahead: ITypeahead<T>;
  filteredComponent: Filters<T>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[] = [ViewType.Card];
  viewType = ViewType.Card;
  filterInfo: IFilterInfo<T>;
  params;

  async activate(params) {
    if (this.w6.userInfo.isManager) { if (this.sort.some(x => x.name === 'stat.totalInstall')) this.sort.push({ name: "stat.install", title: "Installs (Local)", direction: SortDirection.Desc }) }
    this.filterInfo = { search: { input: null, fields: this.searchFields }, enabledFilters: this.enabledFilters, sortOrder: this.sort[0] }
    await super.activate(params);
  }

  enabledFilters = [];

  first = true;

  async handleFilter(info: IFilterInfo<T>) {
    if (this.first) {
      this.first = false;
      return this.model; // pff
    }
    this.filterInfo = info;
    this.model = await this.getMore()
    return this.model;
  }
}
