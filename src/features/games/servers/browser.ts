import {
  ViewModel,
  Query,
  DbQuery,
  IPaginated,
  handlerFor,
  SortDirection,
  IFilter
} from '../../../framework';
import {
  FilteredBase
} from '../../filtered-base';
import {
  ServerRender
} from './server-render';

interface IServer {
  queryAddress: string;
  connectionAddress: string;
  name: string;
  mission: string;
  currentPlayers: number;
  maxPlayers: number;
  country: string;
  continent: string;
  distance: number;
  isPasswordProtected: boolean;
  isDedicated: boolean;
  version: string;
}
export class Index extends FilteredBase<IServer> {
  static getStandardFilters = () => [{
    title: "Has Players",
    name: "hasPlayers",
    filter: () => true,
  }, {
    title: "Dedicated",
    name: "isDedicated",
    filter: () => true,
  }, {
    title: "Open",
    name: "isOpen",
    filter: () => true,
  }, {
    title: "Mods",
    name: "hasMods",
    values: [{
      title: "Has Mods",
      value: true,
    }, {
      title: "Has no Mods",
      value: false
    }],
    filter: () => true
  }, {
    title: "Continent",
    name: "areaLimit",
    values: [{
      title: "Europe",
      value: "EU"
    }, {
      title: "Norh America",
      value: "NA"
    }, {
      title: "South America",
      value: "SA"
    }, {
      title: "Oceania",
      value: "OC"
    }, {
      title: "Asia",
      value: "AS"
    }],
    filter: () => true,
  }]
  static getStandardSort = () => [{
    name: "currentPlayers",
    title: "Players",
    direction: SortDirection.Desc
  }, {
    name: "name",
    title: "Name",
    direction: SortDirection.Asc
  }, {
    name: "distance",
    title: "Distance",
    direction: SortDirection.Asc
  }, {
    name: "country",
    title: "Country",
    direction: SortDirection.Asc
  },]
  filters: IFilter<IServer>[] = Index.getStandardFilters();
  sort = Index.getStandardSort();
  searchFields = ["name"];

  getEnabledFilters() {
    return this.defaultEnabled;
  }

  defaultEnabled = [];

  async activate(params) {
    if (params) {
      if (params.steamId) {
        this.defaultEnabled.push({
          name: "mod",
          value: { id: params.steamId, type: "Steam" },
          filter: () => true
        })
      } else if (params.modId) {
        this.defaultEnabled.push({
          name: "mod",
          value: { id: params.modId.fromShortId(), type: "withSIX" },
          filter: () => true
        })
      }
    }
    await super.activate(params);
  }

  // TODO Custom filters
  getMore(page = 1) {
    // todo; filters and order
    const search = this.filterInfo.search;
    let filters = undefined;
    if (search.input || this.filterInfo.enabledFilters.length > 0) {
      const f: {
        search?: string; minPlayers?: number; isDedicated?: boolean
      } = {};
      if (search.input) f.search = search.input;
      this.filterInfo.enabledFilters.forEach(x => {
        if (x.name === "hasPlayers") f.minPlayers = 1;
        else f[x.name] = x.value != null ? (x.value.value != null ? x.value.value : x.value) :
          true;
      })
      filters = f
    }
    const so = this.filterInfo.sortOrder;
    const sort = so ? {
      orders: [{
        column: so.name,
        direction: so.direction
      }]
    } : undefined;
    return new GetServers(this.w6.activeGame.id, filters, sort, {
      page
    }).handle(this.mediator);
  }

  addPage = async () => {
    if (!this.morePagesAvailable) return;
    const m = <any>this.model;
    let r = <any>await this.getMore(m.pageNumber + 1);
    m.total = r.total;
    m.pageNumber = r.pageNumber;
    m.items.push(...r.items);
  }

  // adapt to pageModel instead of Breeze
  get totalPages() {
    return this.inlineCount / (<any>this.model).pageSize
  }
  get inlineCount() {
    return (<any>this.model).total
  }
  get page() {
    return (<any>this.model).pageNumber
  }

  showServer(server: IServer) {
    return this.dialog.open({
      model: server.queryAddress,
      viewModel: ServerRender
    })
  }
}

class GetServers extends Query<IPaginated<IServer>> {
  constructor(public gameId: string, public filter?: {
    name?: string; currentPlayers?: number; isDedicated?: boolean
  }, public order?: {
    orders: {
      column: string; direction: number
    }[]
  }, public pageInfo?: {
    page: number
  }) {
    super();
  }
}

@handlerFor(GetServers)
class GetServersHandler extends DbQuery<GetServers, IPaginated<IServer>> {
  handle(request: GetServers) {
    return this.context.getCustom("servers", {
      params: request
    })
  }
}
