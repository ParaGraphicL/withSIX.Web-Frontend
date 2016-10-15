import {
  ViewModel,
  Query,
  DbQuery,
  IPaginated,
  handlerFor,
  SortDirection,
  IFilter,
  DbClientQuery,
  uiCommand2,
  InstallContents, LaunchAction, LaunchContents, LaunchGame,
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
  modList;
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
    title: "Has free slots",
    name: "hasFreeSlots",
    filter: () => true
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
        let modId;
        try { modId = params.modId.fromShortId() } catch (err) { modId = params.modId };
        this.defaultEnabled.push({
          name: "mod",
          value: { id: modId, type: "withSIX" },
          filter: () => true
        })
      }
    }
    setInterval(() => { if (this.w6.miniClient.isConnected) { this.refresh(); } }, 60 * 1000);
    await super.activate(params);
  }

  getUrl = (s) => `/p/${this.w6.activeGame.slug}/servers/${s.queryAddress.replace(/\./g, '-')}/${s.name.sluggifyEntityName()}`

  // TODO Custom filters
  async getMore(page = 1) {
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
    const servers = await new GetServers(this.w6.activeGame.id, filters, sort, {
      page
    }).handle(this.mediator);
    if (this.w6.miniClient.isConnected) this.refreshServerInfo(servers.items);
    return servers;
  }

  refresh = uiCommand2("Refresh", () => this.refreshServerInfo(this.model.items));
  reload = uiCommand2("Reload", async () => this.model = await this.getMore());
  join = uiCommand2("Join", () => this.launch(this.selectedServer), { icon: "withSIX-icon-Rocket" });

  selectedServer: IServer;

  selectServer = (s: IServer) => this.selectedServer = s;

  async launch(s: IServer) {
    const contents = s.modList ? s.modList.map(x => x.modId).filter(x => x).uniq().map(x => {
      return { id: x };
    }) : [];
    if (contents.length > 0) {
      const noteInfo = {
        text: `Server: ${s.name}`,
        url: this.getUrl(s),
      };

      // TODO: Don't install if already has
      const installAct = new InstallContents(this.w6.activeGame.id, contents, noteInfo, true);
      await installAct.handle(this.mediator);
      const launchAct = new LaunchContents(this.w6.activeGame.id, contents, noteInfo, LaunchAction.Join);
      launchAct.serverAddress = s.connectionAddress || s.queryAddress;
      await launchAct.handle(this.mediator);
    } else {
      const act = new LaunchGame(this.w6.activeGame.id);
      act.action = LaunchAction.Join;
      act.serverAddress = s.connectionAddress || s.queryAddress;
      await act.handle(this.mediator);
    }
  }

  async refreshServerInfo(servers: IServer[]) {
    const dsp = this.observableFromEvent<{ items: IServer[], gameId: string }>('server.serverInfoReceived')
      .subscribe(evt => {
        evt.items.forEach(x => {
          let s = servers.filter(f => f.queryAddress === x.queryAddress)[0];
          if (s == null) return;
          Object.assign(s, x, { country: s.country, distance: s.distance, modList: s.modList });
        });
      });
    try {
      await new GetServer(this.w6.activeGame.id, servers.map(x => x.queryAddress)).handle(this.mediator);
    } finally {
      dsp.unsubscribe();
    }
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
      model: server,
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

export class GetServer extends Query<IServer[]> {
  constructor(public gameId: string, public addresses: string[], public includeRules = false, public includePlayers = false) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServer[]>  {
  async handle(request: GetServer) {
    let results = await this.client.hubs.server
      .getServersInfo(<any>{
        addresses: request.addresses, gameId: request.gameId, includePlayers: request.includePlayers, request: request.includeRules
      });
    return results.servers;
  }
}