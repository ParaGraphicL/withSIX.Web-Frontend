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
} from "../../../framework";
import { FilteredBase } from "../../filtered-base";
import { ServerRender } from "./server-render";
import { SessionState } from "./server-render-base";

export interface IServer {
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
  updatedAt: Date;
  created: Date;
  modList;
}

enum ModLevel {
  Default,
  Supported,
  withSIX
}

enum ModFlags {
  All,
  ModsInPlaylist = 1, // then we have to send the current items in playlist also with
  NoMods = 2,
  HostedOnWithSIX = 4,
  HostedOnSteamworks = 8,
  PrivateRepositories = 16
}

enum PlayerFilters {
  HideFullServers,
  ServersWithFriendsOnly
}

enum Distance {
  All,
  Nearby = 1,
  Medium = 2,
  Far = 4
}

enum MissionMode {
  All,
  COOP,
  CTF, // (capture the flag)
  KOTH // (king of the hill)
}

enum ServerFilter {
  Verified,
  Locked,
  Dedicated,
  Local
}

interface IGroup<T> {
  title: string;
  items: {
    title: string;
    name?: string
    type?: string;
    placeholder?: string;
    value?;
    range?: number[];
  }[];
  cutOffPoint?: number;
}

// Groups are AND, GroupItems are OR
const filterTest: IGroup<IServer>[] = [
  {
    title: "Keyword",
    items: [
      { title: "", type: "text", placeholder: "Search" }
    ]
  },
  {
    title: "Mods",
    items: [
      { title: ModFlags[ModFlags.ModsInPlaylist] },
      { title: ModFlags[ModFlags.NoMods] },
      { title: ModFlags[ModFlags.HostedOnWithSIX] },
      { title: ModFlags[ModFlags.HostedOnSteamworks] },
      { title: ModFlags[ModFlags.PrivateRepositories] },
    ]
  },
  {
    title: "Players",
    items: [{
      title: "",
      name: "playerRange",
      range: [0, 300],
      value: [0, 0]
    },
    { title: PlayerFilters[PlayerFilters.HideFullServers] },
    { title: PlayerFilters[PlayerFilters.ServersWithFriendsOnly] },
    ]
  },
  {
    title: "Location",
    items: [
      { title: "Nearby (< 100km)", value: Distance.Nearby },
      { title: "Medium (< 500km)", value: Distance.Medium },
      { title: "Far (> 500km)", value: Distance.Far },
    ],
  },
  {
    title: "Mission",
    items: [
      { title: MissionMode[MissionMode.COOP] },
      { title: "CTF (capture the flag)" },
      { title: "KOTH (king of the hill)" },
      { title: "Some other mode 1" },
      { title: "Some other mode 2" },
    ],
    cutOffPoint: 3
  }, {
    title: "Server",
    items: [
      { title: ServerFilter[ServerFilter.Verified] },
      { title: ServerFilter[ServerFilter.Locked] },
      { title: ServerFilter[ServerFilter.Dedicated] },
      { title: ServerFilter[ServerFilter.Local] }
    ]
  },
]


export class Index extends FilteredBase<IServer> {
  filterTest = filterTest;
  static getStandardFilters = () => [{
    title: "Has Players",
    name: "hasPlayers",
    filter: _ => true,
  }, {
    title: "Dedicated",
    name: "isDedicated",
    filter: _ => true,
  }, {
    title: "Open",
    name: "isOpen",
    filter: _ => true,
  }, {
    title: "Has free slots",
    name: "hasFreeSlots",
    filter: _ => true,
  }, {
    title: "Mods",
    name: "hasMods",
    values: [{
      title: "Has Mods",
      value: true,
    }, {
      title: "Has no Mods",
      value: false,
    }],
    filter: _ => true,
    value: null,
  },
  {
    filter: _ => true,
    name: "modLevel",
    title: "Mod support level",
    values: [{
      title: "Supported mods only",
      value: ModLevel.Supported,
    },
    {
      title: "withSIX mods only",
      value: ModLevel.withSIX,
    }],
    value: null,
  },
  {
    title: "Continent",
    name: "areaLimit",
    values: [{
      title: "Europe",
      value: "EU",
    }, {
      title: "Norh America",
      value: "NA",
    }, {
      title: "South America",
      value: "SA",
    }, {
      title: "Oceania",
      value: "OC",
    }, {
      title: "Asia",
      value: "AS",
    }],
    value: null,
    filter: _ => true,
  }]
  static getStandardSort = () => [{
    name: "currentPlayers",
    title: "Players",
    direction: SortDirection.Desc,
  }, {
    name: "name",
    title: "Name",
    direction: SortDirection.Asc,
  }, {
    name: "distance",
    title: "Distance",
    direction: SortDirection.Asc,
  }, {
    name: "country",
    title: "Country",
    direction: SortDirection.Asc,
  },]
  filters: IFilter<IServer>[] = Index.getStandardFilters();
  sort = Index.getStandardSort();
  searchFields = ["name"];

  SessionState = SessionState;


  defaultEnabled: IFilter<IServer>[] = [
    {
      name: "Fresh",
      filter: item => moment().subtract("hours", 1).isBefore(item.updatedAt),
      type: "and"
    }
  ];

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
    this.enabledFilters = this.defaultEnabled;
    await super.activate(params);
  }

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

  async refreshServerInfo(servers: IServer[]) {
    const dsp = this.observableFromEvent<{ items: IServer[], gameId: string }>("server.serverInfoReceived")
      .subscribe(evt => {
        evt.items.forEach(x => {
          let s = servers.filter(f => f.queryAddress === x.queryAddress)[0];
          if (s == null) return;
          Object.assign(s, x, { country: s.country, distance: s.distance, modList: s.modList, updatedAt: new Date(), created: s.created });
        });
      });
    try {
      await new GetServer(this.w6.activeGame.id, servers.map(x => x.queryAddress)).handle(this.mediator);
    } finally {
      dsp.unsubscribe();
      this.filteredComponent.refresh();
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
    //return this.context.getCustom("servers", { params: request })
    // TODO: we prefer Get, but need some plumbing on the server ;-)
    return this.context.postCustom("/servers", request)
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