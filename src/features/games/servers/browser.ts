import {
  Rx,
  ViewModel,
  Query,
  DbQuery,
  IPaginated,
  handlerFor,
  SortDirection,
  IFilter,
  DbClientQuery,
  uiCommand2,
  GameHelper,
  MenuItem,
  UiContext, BasketService, IBasketItem,
  InstallContents, LaunchAction, LaunchContents, LaunchGame,
  IServerInfo
} from "../../../framework";
import { ToggleServer } from "../../rside-bar/rside-bar";
import { BetaDialog } from './beta-dialog';
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
  isFavorite?: boolean;
  hasPlayed?: boolean;
  modList;
  favorites;
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
  KOTH = 4, // (king of the hill)
  RPG = 8,
  Team = 16,
  SC = 32, CTI = 64, Survive = 128, Sandbox = 256, Lastman = 512
}

enum ServerFilter {
  All,
  Verified = 1,
  Open = 2,
  Dedicated = 4,
  Local = 8,
  Favorite = 16,
  Played = 32,
}

interface IGroup<T> {
  title: string;
  active?: boolean;
  items: {
    title: string;
    titleOverride?: string;
    name?: string
    test?: boolean;
    type?: string;
    placeholder?: string;
    defaultValue?: () => any;
    value?;
    items?: { title: string; value: any }[]
    useValue?;
    range?: number[];
  }[];
  hide?: boolean;
  cutOffPoint?: number;
}

const columns = [
  {
    name: "mod",
    icon: "withSIX-icon-Nav-Mod",
  },
  {
    name: "connection",
    icon: "ping",
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
    direction: 1
  }
]

const buildFilter = (e, f, titleOverride?: string, icon?: string, subTitle?: string) => {
  return { title: <string>camelCase(e[f]), useValue: f, titleOverride, icon, subTitle }
}

const defaultBoolTechItems = () => [{
  title: "Any",
  value: null,
}, {
  title: "Enabled",
  value: true,
}, {
  title: "Disabled",
  value: false,
}];

const defaultBoolItems = () => [{
  title: "Any",
  value: null,
}, {
  title: "Yes",
  value: true,
}, {
  title: "No",
  value: false,
}];

// Groups are AND, GroupItems are OR
const filterTest: () => IGroup<IServer>[] = () => [
  {
    title: "Keyword",
    items: [
      { title: "", name: "search", type: "text", placeholder: "Search" },
      //{ title: "ip", name: "ipSearch", type: "text", placeholder: "ip(:port)" },
    ]
  },
  {
    title: "Mods",
    items: [
      buildFilter(ModFlags, ModFlags.ModsInPlaylist),
      buildFilter(ModFlags, ModFlags.NoMods),
      buildFilter(ModFlags, ModFlags.HostedOnWithSIX, "Hosted on withSIX", undefined, "(recommended)"),
      buildFilter(ModFlags, ModFlags.HostedOnSteamworks),
      //buildFilter(ModFlags, ModFlags.PrivateRepositories),
    ]
  },
  {
    title: "Players",
    items: [{
      title: "",
      name: "playerRange",
      type: "range",
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
    cutOffPoint: 3,
    items: [
      buildFilter(Distance, Distance.Nearby, "Nearby (< 500km)"),
      buildFilter(Distance, Distance.Medium, "Medium (< 2000km)"),
      buildFilter(Distance, Distance.Far, "Far (> 2000km)"),
      // TODO: Auto complete or selector?
      { title: "Country", name: "country", type: "text", placeholder: "Country Code", test: true },
      { title: "Continent", name: "continent", type: "text", placeholder: "Continent Code", test: true },
    ],
  },
  {
    title: "Mission",
    items: [
      buildFilter(MissionMode, MissionMode.COOP, "COOP"),
      buildFilter(MissionMode, MissionMode.CTF, "CTF (capture the flag)"),
      buildFilter(MissionMode, MissionMode.KOTH, "KOTH (king of the hill)"),
      buildFilter(MissionMode, MissionMode.RPG, "RPG (role playing game)"),
      buildFilter(MissionMode, MissionMode.CTI, "CTI (capture the island)"),
      buildFilter(MissionMode, MissionMode.Sandbox, "Sandbox"),
      buildFilter(MissionMode, MissionMode.SC, "SC (sector control)"),
      buildFilter(MissionMode, MissionMode.Survive, "Survive"),
      buildFilter(MissionMode, MissionMode.Team, "Team DeathMatch"),
      buildFilter(MissionMode, MissionMode.Lastman, "LMS (last man standing)"),

    ],
    cutOffPoint: 3
  }, {
    title: "Server",
    hide: true,
    items: [
      //buildFilter(ServerFilter, ServerFilter.Verified, undefined, "withSIX-icon-Verified"),
      //buildFilter(ServerFilter, ServerFilter.Locked, undefined, "withSIX-icon-Lock"),
      buildFilter(ServerFilter, ServerFilter.Open, "No password", "withSIX-icon-Lock-Open"),
      buildFilter(ServerFilter, ServerFilter.Favorite, "Favorites only", "withSIX-icon-Star"),
      buildFilter(ServerFilter, ServerFilter.Played, "Played only", "withSIX-icon-Joystick"),
      //buildFilter(ServerFilter, ServerFilter.Dedicated, undefined, "withSIX-icon-Cloud"),
      //buildFilter(ServerFilter, ServerFilter.Local),
      { title: "", name: "ipendpoint", type: "text", placeholder: "IP address" },
    ]
  }, {
    title: "Gameplay",
    hide: true,
    items: [
      {
        name: "crosshair",
        type: "value",
        title: "Weapon Crosshair",
        value: null,
        items: defaultBoolTechItems()
      },
      {
        name: "battleye",
        type: "value",
        title: "BattlEye",
        value: null,
        items: defaultBoolItems()
      },
      {
        name: "thirdPerson",
        type: "value",
        title: "3rd Person Camera",
        value: null,
        items: defaultBoolTechItems()
      },
      {
        name: "flightModel",
        type: "value",
        title: "Flight Model",
        value: null,
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
        type: "value",
        value: null,
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
        type: "value",
        value: null,
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
  },
  /*
  {
    title: "Advanced",
    items: [
    ]
  }*/
]

export interface IOrder {
  name: string;
  direction?: number;
}

interface IPageModel<T> {
  pageNumber: number;
  total: number;
  items: T[];
  pageSize: number;
}


@inject(UiContext, BasketService)
export class Browser extends ViewModel {

  reload;
  refresh;
  createServer;
  createLocalServer;
  connectHostedServer;
  clear;
  model: IPageModel<IServer>;
  filterTest = filterTest();
  columns = columns;
  activeOrder: IOrder = columns[3];
  trigger = 0;


  filters: IFilter<IServer>[] = Browser.getStandardFilters();
  sort = Browser.getStandardSort();
  searchFields = ["name"];

  SessionState = SessionState;

  addServerItems = [];


  defaultEnabled: Array<IFilter<IServer>> = [{
    name: "Fresh",
    filter: item => moment().subtract("hours", 1).isBefore(item.updatedAt),
    type: "and"
  }];

  triggerPage = 1;

  params;
  isActive: boolean;

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


  constructor(ui, private basketService: BasketService) { super(ui) }

  toggleOrder(c) {
    if (this.activeOrder === c) {
      c.direction = c.direction ? 0 : 1;
      this.trigger++;
    } else {
      this.activeOrder = c;
      this.trigger++;
    }
  }

  async activate(params) {
    this.params = params;

    if (!this.w6.userInfo.id) { this.filterTest[5].items.removeEl(this.filterTest[5].items[2]); this.filterTest[5].items.removeEl(this.filterTest[5].items[1]) }
    if (this.w6.activeGame.id !== GameHelper.gameIds.Arma3.toLowerCase()) {
      this.filterTest[1].items.removeEl(this.filterTest[1].items[3]);
      this.filterTest[6].items.removeEl(this.filterTest[6].items[3]);
    }
    if (this.params.modId) { this.filterTest[1].items.removeEl(this.filterTest[1].items[1]); }


    this.baskets = this.basketService.getGameBaskets(this.w6.activeGame.id);
    if (this.w6.userInfo.id) {
      const info = await new GetFavorites(this.w6.activeGame.id).handle(this.mediator);
      this.favorites = info.servers;
      this.history = info.history;
    } else {
      this.favorites = [];
      this.history = [];
    }
    //this.trigger++; // todo; Command, awaitable, observable
    this.model = {
      items: [], pageNumber: 1, total: 0, pageSize: 16
    }
    this.filteredItems = this.order(this.model.items);

    this.subscriptions.subd(d => {
      const list = this.listFactory.getList(this.filterTest.map(x => x.items).flatten(), ["value"]);
      d(list);
      const hasPending: Rx.Subject<number> = new Rx.BehaviorSubject(0);
      this.toProperty(hasPending.map(x => x === 1), x => x.isActive);

      let page = 0;
      const pageStream = this.observeEx(x => x.triggerPage)
        .map(x => ++page)
        .do<number>((pageNumber) => hasPending.next(pageNumber))
        .concatMap(async (pageNumber) => {
          try {
            return await this.getMore(pageNumber);
          } catch (err) {
            this.toastr.warning("Failed to retrieve servers");
            return { page: 1, total: 0, items: [], perPage: 16 };
          }
        })
        .do<IPageModel<IServer>>((response) => hasPending.next(0));
      d(list.itemChanged
        .map(x => 0)
        .merge(this.observeEx(x => x.trigger))
        .switchMap((e) => {
          page = 0;
          return pageStream;
        })
        .subscribe(x => {
          if (page > 1) {
            const m = this.model;
            m.total = x.total;
            m.pageNumber = x.pageNumber;
            m.items.push(...x.items);
          } else {
            this.model = x;
          }
          this.filteredItems = this.order(this.model.items);
        }));

      d(this.loadMore = uiCommand2("Load more", this.addPage, {
        canExecuteObservable: this.morePagesAvailable.merge(hasPending.map(x => !x)),
        isVisibleObservable: this.morePagesAvailable,
      }));
      d(this.reload = uiCommand2("", async () => this.trigger++, {
        canExecuteObservable: hasPending.map(x => !x),
        cls: "unprominent",
        icon: "withSIX-icon-Reload",
      }));
      d(this.refresh = uiCommand2("Refresh", () => this.refreshServerInfo(this.model.items), {
        canExecuteObservable: this.observeEx(x => x.features.serverFeatures)
      }));
      d(this.createServer = uiCommand2("Host server withSIX", async () => this.openServerBlade()));
      d(this.createLocalServer = uiCommand2("Host local server", async () => this.openServerBlade(), {
        canExecuteObservable: Rx.Observable.of(false)
      }));
      d(this.connectHostedServer = uiCommand2("Connect hosted server", async () => this.openServerBlade(), {
        canExecuteObservable: Rx.Observable.of(false)
      }));
      d(this.clear = uiCommand2("CLEAR", async () => this.clearFilters(), {
        cls: "text-button",
        icon: "withSIX-icon-X",
      }));
      if (this.features.serverFeatures) {
        const ival = setInterval(() => { if (this.w6.miniClient.isConnected) { this.refresh(); } }, 60 * 1000);
        d(() => clearInterval(ival));
      }
    });


    this.addServerItems.push(
      new MenuItem(this.createLocalServer),
      new MenuItem(this.connectHostedServer),
      new MenuItem(this.createServer),
    );

    this.handleBetaDialog();
  }

  async handleBetaDialog() {
    if (this.w6.settings.serversBetaDialog) { return; }
    const model = { dontShowAgain: false };
    const r = await this.dialog.open({ viewModel: BetaDialog, model });
    if (r.output) { this.w6.updateSettings(s => s.serversBetaDialog = true); }
  }

  favorites: string[];
  history: string[];

  baskets: { active: { model: { items: IBasketItem[] } } }

  async getMore(page = 1) {
    const filter = {}
    //const searchFilter = this.filterTest[0].items[0].value;
    //const filterValid = !searchFilter || searchFilter.length > 2;
    const groups: IGroup<IServer>[] = this.filterTest; // filterValid ?  : JSON.parse(JSON.stringify(this.filterTest));
    //if (!filterValid) groups[0].items[0].value = null;

    // TODO!
    // value check because rangebox makes strings
    const checkF = (f) => !f.range || (f.value[0] != f.range[0] || f.value[1] != f.range[1])

    groups.forEach(g => {
      const filters = g.items.filter(f => f.value != null && f.value !== "" && f.type && checkF(f));
      const flags = g.items
        .filter(f => f.value && !f.type);
      if (filters.length === 0 && flags.length === 0) {
        g.active = false;
        return;
      }
      let flag = 0;
      flags.map(f => f.useValue).forEach(f => {
        flag += f;
      });
      const filt: { flag?: number } = flag === 0 ? {} : { flag };
      let hasActiveFilters = false;
      filters
        .forEach(f => {
          if (checkF(f)) {
            filt[f.name] = f.value;
            hasActiveFilters = true;
          }
        });
      if (filt.flag > 0 || hasActiveFilters) {
        filter[g.title] = filt;
        g.active = true;
      } else {
        g.active = false;
      }
    });

    if (this.filterTest[1].items[0].value) {
      filter["Mods"].modIds = this.baskets.active.model.items.map(x => x.id);
    }

    if (this.params) {
      if (this.params.steamId) {
        (<any>filter).mod = { id: this.params.steamId, type: "Steam" };
      } else if (this.params.modId) {
        let id;
        try { id = this.params.modId.fromShortId() } catch (err) { id = this.params.modId; };
        (<any>filter).mod = { id, type: "withSIX" };
      }
    }

    const orders = [];
    if (this.activeOrder) { orders.push({ column: this.activeOrder.name, direction: this.activeOrder.direction }); }
    const sort = { orders, }

    const servers = await new GetServers(this.w6.activeGame.id, filter, sort, {
      page, pageSize: this.model.pageSize
    }).handle(this.mediator);

    if (this.w6.miniClient.isConnected && this.features.serverFeatures) this.refreshServerInfo(servers.items);
    return servers;
  }



  openServerBlade = () => this.isLoggedIn ? this.eventBus.publish(new ToggleServer(0)) : this.w6.openLoginDialog();

  clearGroup = (grp) => {
    grp.items.forEach(f => f.value = f.defaultValue ? f.defaultValue() : null);
    grp.active = false;
  }

  clearFilters() { this.filterTest.forEach(x => this.clearGroup(x)); }

  //get filteredItems() { return this.filteredComponent.filteredItems; }
  //get filteredTotalCount() { return this.filteredComponent.totalCount; }
  filteredItems;
  get filteredTotalCount() { return this.model.total; }

  getGroupLength = (g: IGroup<IServer>) => g.items.filter(x => !x.test || this.features.isTestEnvironment).length;

  async refreshServerInfo(servers: IServer[]) {
    const dsp = this.observableFromEvent<{ items: IServer[], gameId: string }>("server.serverInfoReceived")
      .subscribe(evt => {
        evt.items.forEach(x => {
          let s = servers.filter(f => f.queryAddress === x.queryAddress)[0];
          if (s == null) return;
          const { modList, country, distance, created } = s;
          Object.assign(s, x, { modList, country, distance, created, updatedAt: new Date() });
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

  order(items: IServer[]): IServer[] {
    items.forEach(x => {
      if (!x.favorites) {
        x.favorites = this.favorites;
        x.hasPlayed = this.history.some(h => h === x.connectionAddress);
        x.isFavorite = this.favorites.some(f => f === x.connectionAddress);
      }
    });
    const anHourAgo = moment().subtract("hours", 1);
    items = items.filter(x => x.isFavorite || moment(x.updatedAt).isAfter(anHourAgo));
    let sortOrders: any[] = [];
    if (this.activeOrder) {
      if (this.activeOrder.name === 'players') {
        sortOrders.push({ name: 'currentPlayers', direction: this.activeOrder.direction });
      }
      if (this.activeOrder.name === 'connection' && this.w6.miniClient.isConnected) {
        sortOrders.push({ name: 'ping', direction: this.activeOrder.direction });
      }
    }

    if (sortOrders.length === 0) return items;

    let sortFunctions = sortOrders.map((x, i) => (a, b) => {
      let order = x.direction === SortDirection.Desc ? -1 : 1;
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

  morePagesAvailable = this.whenAnyValue(x => x.inlineCount).combineLatest(this.whenAnyValue(x => x.page), (c, p) => p < this.totalPages);
  loadMore;

  addPage = async () => {
    if (!this.morePagesAvailable) return; // TODO: makes no sense, its an obvservable!
    this.triggerPage++;
    /*
    const m = <any>this.model;
    let r = <any>await this.getMore(m.pageNumber + 1);
    m.total = r.total;
    m.pageNumber = r.pageNumber;
    m.items.push(...r.items);
    this.filteredItems = this.order(this.model.items)
    */
  }

  // adapt to pageModel instead of Breeze
  get totalPages() {
    return this.inlineCount / this.model.pageSize
  }
  get inlineCount() {
    return this.model.total
  }
  get page() {
    return this.model.pageNumber
  }

  showServer(server: IServer, $event) {
    if ($event.path.some((x) => x instanceof HTMLButtonElement || x instanceof HTMLAnchorElement)) {
      return;
    }
    return this.dialog.open({
      model: server,
      viewModel: ServerRender,
    });
  }
}

class GetServers extends Query<IPageModel<IServer>> {
  constructor(public gameId: string, public filter?: {
    name?: string; currentPlayers?: number; isDedicated?: boolean
  }, public order?: {
    orders: {
      column: string; direction: number
    }[]
  }, public pageInfo?: {
    page: number, pageSize: number
  }) {
    super();
  }
}

@handlerFor(GetServers)
class GetServersHandler extends DbQuery<GetServers, IPageModel<IServer>> {
  handle(request: GetServers) {
    //return this.context.getCustom("servers", { params: request })
    // TODO: we prefer Get, but need some plumbing on the server ;-)
    return this.context.postCustom("/servers", request)
  }
}

export class GetServer extends Query<IServer[]> {
  constructor(public gameId: string, public addresses: string[], public includeRules = false, public includePlayers = false) { super(); }
}

interface IServerFavorites {
  servers: string[]; history: string[];
}


class GetFavorites extends Query<IServerFavorites> {
  constructor(public gameId) { super(); }
}

@handlerFor(GetFavorites)
class GetFavoritesHandler extends DbClientQuery<GetFavorites, IServerFavorites> {
  handle(message: GetFavorites) {
    return this.context.getCustom(`games/${message.gameId}/favorite-servers`);
  }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo[]>  {
  async handle(request: GetServer) {
    let results = await this.client.hubs.server
      .getServersInfo(<any>{
        addresses: request.addresses, gameId: request.gameId, includePlayers: request.includePlayers, request: request.includeRules
      });
    return results.servers;
  }
}