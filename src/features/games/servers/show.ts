import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2
} from "../../../framework";

export class Show extends ViewModel {
  interval: number;
  address: string;
  modelPartial: { address: IIPEndpoint; };
  gameId;
  model: IServerInfo;
  mods;
  refresh = uiCommand2("Refresh", () => this.loadModel(this.modelPartial), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("Join", () => this.launch(), { icon: "withSIX-icon-Rocket" });

  launch() {
    const act = new LaunchGame(this.w6.activeGame.id);
    act.action = LaunchAction.Join;
    act.serverAddress = this.address;
    return act.handle(this.mediator);
  }

  async activate(params, routeConfig) {
    this.address = params.serverId.replace(/-/g, ".")
    const addr = this.address.split(":");
    this.gameId = this.w6.activeGame.id;
    this.modelPartial = { address: { address: addr[0], port: parseInt(addr[1]) } };
    this.model = await this.loadModel(this.modelPartial);
    const details = (<any> this.model).details;
    if (details && details.modList) {
      let l: {mappings: any[]} = await new GetModInfo(this.gameId, details.modList).handle(this.mediator);
      const mappings = l.mappings.toMap(x => x.inputName);
      this.mods = details.modList.map(x => {
        return {
          mapping: mappings.get(x.name),
          name: x.name,
        };
      });
    }
    this.interval = setInterval(() => { if (this.refresh.canExecute) { this.refresh(); } }, 15 * 1000);
  }

    get details() { return JSON.stringify((<any> this.model).details || {}, null, '  '); }


  getPublisherUrl(p) {
    return p.publisher === 2 ?
      `https://starbound-servers.net/server/${p.publisherId}/` : `https://www.gametracker.com/server_info/${p.publisherId}/`;
  }

  getPublisherName(p) {
    return `${p.publisher === 2 ? "Starbound-Servers.net" : "GameTracker.com"}`;
  }

  deactivate() { clearInterval(this.interval); }

  loadModel(info) { return new GetServer(this.gameId, this.modelPartial.address).handle(this.mediator); }
}

export class GetServer extends Query<IServerInfo> {
  constructor(public gameId: string, public address: IIPEndpoint, public includePlayers = true) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo>  {
  async handle(request: GetServer) {
    await (<any> this.client).connection.promise(); // Puh todo
    let results = await this.client.hubs.server
      .getServersInfo(<any> { gameId: request.gameId, addresses: [request.address], includePlayers: request.includePlayers });
    const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    return Object.assign({}, results.servers[0], { additional: gameServers.get(GameHelper.toAddresss(request.address)) });
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