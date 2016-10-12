import {
  DbClientQuery, GameHelper, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2,
} from "../../../framework";

export interface ExtendedServerInfo extends IServerInfo {
  modList: any[];
  game: string;
  map: string;
}

export class ServerRenderBase extends ViewModel {
  interval: number;
  gameId;
  model: ExtendedServerInfo;
  mods;
  links;
  clientLoaded;
  refresh = uiCommand2("Refresh", () => this.loadModel(), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("Join", () => this.launch(), { icon: "withSIX-icon-Rocket" });
  detailsShown = false;

  get address() { return this.model.queryAddress; }

  url;

  launch() {
    const act = new LaunchGame(this.w6.activeGame.id);
    act.action = LaunchAction.Join;
    act.serverAddress = this.address;
    return act.handle(this.mediator);
  }

  extractInfo(text: string) {
    let servers = [];
    text.replace(/(TS3?\s*(ip\s*)?:?\s*)(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|\w+\.[-\.\w]+)(:[0-9]{1,6})?)/ig,
      (whole, m1, m2, m3) => {
        if (!servers.some(x => x.title === m2)) { servers.push({ title: m3, type: "Teamspeak3", url: `ts3server://${m3}` }); }
        return whole;
      })
      .replace(/ts3?\.[-\w.]+/ig, (whole) => {
        if (!servers.some(x => x.title === whole)) { servers.push({ title: whole, type: "Teamspeak3", url: `ts3server://${whole}` }); };
        return whole;
      });

    return servers;
    // TS: hia3.net
    // ts3.moh-gaming.fr
    // TS arma3.zp.ua
    // TS: 138.201.206.146
    // TS3: 89.22.150.168
    // Ts3 ip : 149.202.195.113
    // TS:109.70.149.5:9019
    // TS3:5.9.23.52
    // ts.combinedarms.co.uk
    // [TS3: ts3.our-army.su]
    // MAKO:62.210.169.9:9987
    //  | ts.legion-revival.fr
    // BUT NOT!: TS3 Co-op
  }

  async activateInternal(model) {
    this.model = model;
    this.gameId = this.w6.activeGame.id;
    // await this.loadModel();
    // const details = (<any> this.model).details;
    // if (details && details.modList) { this.handleMods(details); }

    this.updateLinks();

    this.url = `/p/${this.w6.activeGame.slug}/servers/${this.address.replace(/\./g, "-")}/${this.model.name.sluggifyEntityName()}`;

    if (this.w6.miniClient.isConnected) { this.refresh(); }
    this.interval = setInterval(() => {
      if (!this.w6.miniClient.isConnected) { return; }
      if (this.refresh.canExecute) { this.refresh(); }
    }, 15 * 1000);
  }

  async handleMods(details) {
    let l: { mappings: any[] } = await new GetModInfo(this.gameId, details.modList).handle(this.mediator);
    const mappings = l.mappings.toMap(x => x.inputName);
    this.mods = details.modList.map(x => {
      return {
        mapping: mappings.get(x.name),
        name: x.name,
      };
    });
  }

  getPublisherUrl(p) {
    return p.publisher === 2 ?
      `https://starbound-servers.net/server/${p.publisherId}/` : `https://www.gametracker.com/server_info/${p.publisherId}/`;
  }

  getPublisherName(p) { return `${p.publisher === 2 ? "Starbound-Servers.net" : "GameTracker.com"}`; }

  deactivate() { clearInterval(this.interval); }

  async loadModel() {
    const m = await new GetServer(this.gameId, this.address).handle(this.mediator);
    // for now keep modlist from server as it has modID linked in..
    const modList = this.model.modList;
    Object.assign(this.model, m, { modList });
    this.clientLoaded = true;
    this.updateLinks();
  }
  updateLinks() {
    this.links = this.extractInfo(this.model.name + " " + this.model.game);
  }
}

export class GetServer extends Query<IServerInfo> {
  constructor(public gameId: string, public address: string, public includePlayers = true) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo>  {
  async handle(request: GetServer) {
    let results = await this.client.hubs.server
      .getServersInfo(<any> { addresses: [request.address], gameId: request.gameId, includePlayers: request.includePlayers });
    const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    let s = results.servers[0];
    if (s == null) { throw new Error("server could not be refreshed"); }
    return Object.assign({}, s, { additional: gameServers.get(request.address) });
  }
}

export class GetModInfo extends Query<any> {
  constructor(public gameId: string, public inputMappings: any[]) { super(); }
}

@handlerFor(GetModInfo)
class GetModInfoQuery extends DbClientQuery<GetModInfo, any>  {
  handle(request: GetModInfo) {
    return this.context.postCustom("mods/get-mod-mappings", { gameId: request.gameId, inputMappings: request.inputMappings });
  }
}