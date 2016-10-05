import { ViewModel, Query, DbQuery, IPaginated, handlerFor, SortDirection, IFilter } from '../../../framework';
import { FilteredBase } from '../../filtered-base';


interface IServer {
  address: string;
  name: string;
  mission: string;
  currentPlayers: number;
  maxPlayers: number;
}
export class Index extends FilteredBase<IServer> {
  filters: IFilter<IServer>[] = [
    {
      title: "Has Players",
      name: "hasPlayers",
      filter: () => true,
    },
    {
      title: "Dedicated",
      name: "isDedicated",
      filter: () => true,
    },
    {
      title: "Open",
      name: "isOpen",
      filter: () => true,
    },
    {
      title: "Continent",
      name: "areaLimit",
      values: [
        { title: "Europe", value: "EU" },
        { title: "Norh America", value: "NA" },
        { title: "South America", value: "SA" },
        { title: "Oceania", value: "OC" },
        { title: "Asia", value: "AS" }
      ],
      filter: () => true,
    }
  ]
  sort = [
    { name: "currentPlayers", title: "Players", direction: SortDirection.Desc },
    { name: "name", title: "Name", direction: SortDirection.Asc },
    { name: "distance", title: "Distance", direction: SortDirection.Asc },
    { name: "country", title: "Country", direction: SortDirection.Asc },
  ]
  searchFields = ["name"];
  // TODO Custom filters
  getMore(page = 1) {
    // todo; filters and order
    const search = this.filterInfo.search;
    let filters = undefined;
    if (search.input || this.filterInfo.enabledFilters.length > 0) {
      const f: { search?: string; minPlayers?: number; isDedicated?: boolean } = {};
      if (search.input) f.search = search.input;
      this.filterInfo.enabledFilters.forEach(x => {
        if (x.name === "hasPlayers") f.minPlayers = 1;
        else f[x.name] = x.value ? x.value.value || x.value : true;
      })
      filters = f
    }
    const so = this.filterInfo.sortOrder;
    const sort = so ? { orders: [{ column: so.name, direction: so.direction }] } : undefined;
    return new GetServers(this.w6.activeGame.id, filters, sort, { page }).handle(this.mediator);
  }

  addPage = async () => {
    if (!this.morePagesAvailable) return;
    const m = <any>this.model;
    let r = <any> await this.getMore(m.pageNumber + 1);
    m.total = r.total;
    m.pageNumber = r.pageNumber;
    m.items.push(...r.items);
  }

  // adapt to pageModel instead of Breeze
  get totalPages() { return this.inlineCount / (<any> this.model).pageSize }
  get inlineCount() { return (<any> this.model).total }
  get page() { return (<any>this.model).pageNumber }
}

class GetServers extends Query<IPaginated<IServer>> { 
  constructor(public gameId: string, public filter?: { name?: string; currentPlayers?: number; isDedicated?: boolean}, public order?: { orders: { column: string; direction: number }[] }, public pageInfo?: { page: number }) { super(); }
}

@handlerFor(GetServers)
class GetServersHandler extends DbQuery<GetServers, IPaginated<IServer>> {
  handle(request: GetServers) {
    return this.context.getCustom("servers", { params: request })
  }
}