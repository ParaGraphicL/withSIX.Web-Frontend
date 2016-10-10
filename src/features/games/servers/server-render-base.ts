import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2
} from "../../../framework";

export interface ExtendedServerInfo extends IServerInfo {
  modList: any[];
}

export class ServerRenderBase extends ViewModel {
  interval: number;
  gameId;
  model: ExtendedServerInfo;
  mods;
  refresh = uiCommand2("Refresh", () => this.loadModel(), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("Join", () => this.launch(), { icon: "withSIX-icon-Rocket" });
  detailsShown = false;

  get address() { return this.model.queryAddress; }

  launch() {
    const act = new LaunchGame(this.w6.activeGame.id);
    act.action = LaunchAction.Join;
    act.serverAddress = this.address;
    return act.handle(this.mediator);
  }

  async activateInternal(model) {
    this.model = model;
    this.gameId = this.w6.activeGame.id;
    // await this.loadModel();
    // const details = (<any> this.model).details;
    // if (details && details.modList) { this.handleMods(details); }

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

  get details() { return JSON.stringify((<any>this.model).details || {}, null, '  '); }

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
  }
  clientLoaded;
}

export class GetServer extends Query<IServerInfo> {
  constructor(public gameId: string, public address: string, public includePlayers = true) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo>  {
  async handle(request: GetServer) {
    await (<any>this.client).connection.promise(); // Puh todo
    let results = await this.client.hubs.server
      .getServersInfo(<any>{ gameId: request.gameId, addresses: [request.address], includePlayers: request.includePlayers });
    const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    return Object.assign({}, results.servers[0], { additional: gameServers.get(request.address) });
  }
}

export class GetModInfo extends Query<any> {
  constructor(public gameId: string, public inputMappings: any[]) { super(); }
}

@handlerFor(GetModInfo)
class GetModInfoQuery extends DbClientQuery<GetModInfo, any>  {
  handle(request: GetModInfo) {
    return this.context.postCustom("mods/get-mod-mappings", { gameId: request.gameId, inputMappings: request.inputMappings })
  }
}