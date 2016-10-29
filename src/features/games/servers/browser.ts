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
  UiContext, BasketService, IBasketItem,
  InstallContents, LaunchAction, LaunchContents, LaunchGame,
} from "../../../framework";
import { inject } from 'aurelia-framework';
import { camelCase } from '../../../helpers/utils/string';
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
  All,
  HideFullServers = 1,
  HideEmptyServers = 2,
  ServersWithFriendsOnly = 4
}

enum Distance {
  All,
  Nearby = 1,
  Medium = 2,
  Far = 4
}

enum MissionMode {
  All,
  COOP = 1,
  CTF = 2, // (capture the flag)
  KOTH = 4 // (king of the hill)
}

enum ServerFilter {
  All,
  Verified = 1,
  Open = 2,
  Dedicated = 4,
  Local = 8
}

interface IGroup<T> {
  title: string;
  items: {
    title: string;
    titleOverride?: string;
    name?: string
    type?: string;
    placeholder?: string;
    defaultValue?: () => any;
    value?;
    items?: { title: string; value: any }[]
    useValue?;
    range?: number[];
  }[];
  cutOffPoint?: number;
}

const columns = [
  {
    name: "mod",
    icon: "withSIX-icon-Nav-Mod",
  },
  {
    name: "connection",
    icon: "withSIX-icon-Connection-Med",
  },
  {
    name: "name",
    text: "Name",
  },
  {
    name: "players",
    text: "Players",
    icon: "withSIX-icon-Users-Group",
    direction: 1
  },
  {
    name: "favorites",
    icon: "withSIX-icon-Star-Outline",
  }
]

const buildFilter = (e, f, titleOverride?: string, icon?: string) => {
  return { title: <string>camelCase(e[f]), useValue: f, titleOverride, icon }
}

const defaultBoolItems = () => [{
  title: "Any",
  value: null,
}, {
  title: "On",
  value: true,
}, {
  title: "Off",
  value: false,
}];

// Groups are AND, GroupItems are OR
const filterTest: IGroup<IServer>[] = [
  {
    title: "Keyword",
    items: [
      { title: "", name: "search", type: "text", placeholder: "Search" }
    ]
  },
  {
    title: "Mods",
    items: [
      buildFilter(ModFlags, ModFlags.ModsInPlaylist),
      buildFilter(ModFlags, ModFlags.NoMods),
      buildFilter(ModFlags, ModFlags.HostedOnWithSIX, "Hosted on withSIX"),
      buildFilter(ModFlags, ModFlags.HostedOnSteamworks),
      //buildFilter(ModFlags, ModFlags.PrivateRepositories),
    ]
  },
  {
    title: "Players",
    items: [{
      title: "",
      name: "playerRange",
      range: [0, 300],
      defaultValue: () => [0, 300],
      value: [0, 300] // todo def value
    },
    buildFilter(PlayerFilters, PlayerFilters.HideFullServers),
    buildFilter(PlayerFilters, PlayerFilters.HideEmptyServers),
      //buildFilter(PlayerFilters, PlayerFilters.ServersWithFriendsOnly),
    ]
  },
  {
    title: "Location",
    items: [
      buildFilter(Distance, Distance.Nearby, "Nearby (< 500km)"),
      buildFilter(Distance, Distance.Medium, "Medium (< 2000km)"),
      buildFilter(Distance, Distance.Far, "Far (> 2000km)"),
    ],
  },
  {
    title: "Mission",
    items: [
      buildFilter(MissionMode, MissionMode.COOP, "COOP"),
      buildFilter(MissionMode, MissionMode.CTF, "CTF (capture the flag)"),
      buildFilter(MissionMode, MissionMode.KOTH, "KOTH (king of the hill)"),
      //{ title: "Some other mode 1" },
      //{ title: "Some other mode 2" },
    ],
    cutOffPoint: 3
  }, {
    title: "Server",
    items: [
      //buildFilter(ServerFilter, ServerFilter.Verified, undefined, "withSIX-icon-Verified"),
      //buildFilter(ServerFilter, ServerFilter.Locked, undefined, "withSIX-icon-Lock"),
      buildFilter(ServerFilter, ServerFilter.Open, "No password", "withSIX-icon-Lock-Open"),
      //buildFilter(ServerFilter, ServerFilter.Dedicated, undefined, "withSIX-icon-Cloud"),
      //buildFilter(ServerFilter, ServerFilter.Local),
    ]
  }, {
    title: "Gameplay",
    items: [
      {
        name: "crosshair",
        title: "Weapon Crosshair",
        items: defaultBoolItems()
      },
      {
        name: "battleye",
        title: "BattlEye",
        items: defaultBoolItems()
      },
      {
        name: "thirdPerson",
        title: "3rd Person Camera",
        items: defaultBoolItems()
      },
      {
        name: "flightModel",
        title: "Flight Model",
        items: [{
          title: "Any",
          value: null,
        }, {
          title: "Standard",
          value: 0,
        }, {
          title: "Advanced",
          value: 1,
        }]
      },
      {
        name: "aiLevel",
        title: "AI Level",
        items: [{
          title: "Any",
          value: null,
        }, {
          title: "Novice",
          value: 0,
        }, {
          title: "Normal",
          value: 1,
        }, {
          title: "Expert",
          value: 2,
        }, {
          title: "Custom",
          value: 1,
        }]
      },
      {
        name: "difficulty",
        title: "Difficulty",
        items: [
          {
            title: "Any",
            value: null,
          }, {
            title: "Recruit",
            value: 0,
          }, {
            title: "Regular",
            value: 1,
          }, {
            title: "Veteran",
            value: 2,
          }, {
            title: "Custom",
            value: 3,
          }
        ]
      }
    ]
  }
]

export interface IOrder {
  name: string;
  direction?: number;
}


@inject(UiContext, BasketService)
export class Index extends FilteredBase<IServer> {
  constructor(ui, private basketService: BasketService) { super(ui) }

  filterTest = filterTest;
  columns = columns;
  activeOrder: IOrder = columns[3];
  toggleOrder(c) {
    if (this.activeOrder === c) {
      c.direction = c.direction ? 0 : 1;
      this.trigger++;
    } else {
      this.activeOrder = c;
      this.trigger++;
    }
  }
  trigger = 0;
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
    this.subscriptions.subd(d => {
      const list = this.listFactory.getList(this.filterTest.map(x => x.items).flatten(), ["value"]);
      d(list);
      d(list.itemChanged.map(x => 1)
        .merge(this.observeEx(x => x.trigger).map(x => 1))
        .subscribe(x => {
          // todo: rather just ignore the keyword!
          const f = this.filterTest[0].items[0];
          if (f.value && f.value.trim().length < 2) { f.value = null; }
          this.handleFilter(this.filterInfo)
            .then(x => this.filteredItems = this.order(this.model.items));
        }));
    })
    setInterval(() => { if (this.w6.miniClient.isConnected) { this.refresh(); } }, 60 * 1000);
    this.enabledFilters = this.defaultEnabled;
    this.baskets = this.basketService.getGameBaskets(this.w6.activeGame.id);
    await super.activate(params);
    this.filteredItems = this.order(this.model.items)
  }

  baskets: { active: { model: { items: IBasketItem[] } } }

  getId = 0;


  async getMore(page = 1) {
    /*
    const search = this.filterInfo.search;
    let filters = undefined;
    if (search.input || this.filterInfo.enabledFilters.length > 0) {
      const f: { search?: string; minPlayers?: number; isDedicated?: boolean } = {};
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
    */

    const filter = {}
    this.filterTest.filter(x => x.items.some(f => f.value)).forEach(x => {
      let flag = 0;
      x.items.filter(f => f.value && !(f.value instanceof Array)).map(f => f.useValue).forEach(f => {
        flag += f;
      });
      const filt = { flag };
      const filters = x.items.filter(f => f.value && (f.value instanceof Array) || f.type === "text");
      filters.forEach(f => {
        // TODO!
        if (!f.range || (f.value[0] !== 0 && f.value[1] !== 300)) { filt[f.name] = f.value; }
      });
      if (filt.flag > 0 || filters.length > 0) { filter[x.title] = filt; }
    })

    if (this.filterTest[1].items[0].value) {
      filter["Mods"].modIds = this.baskets.active.model.items.map(x => x.id);
    }

    const orders = [];
    if (this.activeOrder) { orders.push({ column: this.activeOrder.name, direction: this.activeOrder.direction }); }
    const sort = { orders, }

    const id = ++this.getId;
    const servers = await new GetServers(this.w6.activeGame.id, filter, sort, {
      page
    }).handle(this.mediator);

    if (id !== this.getId) throw new this.tools.AbortedException("old data");

    if (this.w6.miniClient.isConnected) this.refreshServerInfo(servers.items);
    return servers;
  }

  refresh = uiCommand2("Refresh", () => this.refreshServerInfo(this.model.items));
  reload = uiCommand2("Reload", async () => this.model = await this.getMore());

  clear = uiCommand2("Clear", async () => this.clearFilters());

  clearFilters() {
    this.filterTest.forEach(x => {
      x.items.forEach(f => f.value = f.defaultValue ? f.defaultValue() : null)
    });
  }

  //get filteredItems() { return this.filteredComponent.filteredItems; }
  //get filteredTotalCount() { return this.filteredComponent.totalCount; }
  filteredItems;
  get filteredTotalCount() { return this.model.total; }

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
    } catch (err) {
      this.tools.Debug.warn("error while trying to refresh servers", err);
    } finally {
      dsp.unsubscribe();
      //this.filteredComponent.refresh();
      this.filteredItems = this.order(this.model.items)
    }
  }

  order(items) {
    let sortOrders: any[] = [];
    if (this.activeOrder && this.activeOrder.name === 'players') sortOrders.push({ name: 'currentPlayers', direction: this.activeOrder.direction });
    let sortFunctions = sortOrders.map((x, i) => (a, b) => {
      let order = x.direction == SortDirection.Desc ? -1 : 1;
      if (x.customSort) return x.customSort(a, b) * order;
      if (a[x.name] > b[x.name]) return 1 * order;
      if (a[x.name] < b[x.name]) return (1 * -1) * order;
      return 0;
    });
    //if (this.customSort != null) sortFunctions.unshift(this.customSort);

    return Array.from(items).sort((a, b) => {
      for (var i in sortFunctions) {
        let r = sortFunctions[i](a, b);
        if (r) return r;
      }
      return 0;
    });
  }

  addPage = async () => {
    if (!this.morePagesAvailable) return;
    const m = <any>this.model;
    let r = <any>await this.getMore(m.pageNumber + 1);
    m.total = r.total;
    m.pageNumber = r.pageNumber;
    m.items.push(...r.items);
    this.filteredItems = this.order(this.model.items)
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