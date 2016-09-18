import {
  GameHelper, uiCommand2, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IServerInfo, IIPEndpoint, ViewModel,
} from "../../../framework";

export class Show extends ViewModel {
  interval: number;
  modelPartial: { address: IIPEndpoint; };
  gameId;
  model: IServerInfo;
  refresh = uiCommand2("Refresh", () => this.loadModel(this.modelPartial), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("Join", async () => alert("TODO"), { icon: "withSIX-icon-Rocket" });

  async activate(params, routeConfig) {
    let addr = params.serverId.replace(/-/g, ".").split(":");
    this.gameId = this.w6.activeGame.id;
    this.modelPartial = { address: { address: addr[0], port: parseInt(addr[1]) } };
    this.model = await this.loadModel(this.modelPartial);
    this.interval = setInterval(() => { if (this.refresh.canExecute) { this.refresh(); } }, 15 * 1000);
  }

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
  constructor(public gameId: string, public address: IIPEndpoint) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo>  {
  async handle(request: GetServer) {
    await (<any> this.client).connection.promise(); // Puh todo
    let results = await this.client.hubs.server
      .getServersInfo(<any> { gameId: request.gameId, addresses: [request.address], includePlayers: true });
    const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    return Object.assign({}, results.servers[0], { additional: gameServers.get(GameHelper.toAddresss(request.address)) });
  }
}
