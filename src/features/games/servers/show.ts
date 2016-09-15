import {uiCommand2, ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IServerInfo, IIPEndpoint} from "../../../framework";
export class Show extends ViewModel {
  interval: number;
  modelPartial: { address: IIPEndpoint; };
  gameId = "9DE199E3-7342-4495-AD18-195CF264BA5B"; // a3 TODO
  model: IServerInfo;
  async activate(params, routeConfig) {
    let addr = params.serverId.replace(/-/g, ".").split(":");
    this.modelPartial = { address: { address: addr[0], port: parseInt(addr[1]) } };
    this.model = await this.loadModel(this.modelPartial);
    this.interval = setInterval(() => { if (this.refresh.canExecute) this.refresh(); }, 15 * 1000);
  }

  deactivate() { clearInterval(this.interval); }

  loadModel(info) { return new GetServer(this.gameId, this.modelPartial.address).handle(this.mediator); }

  refresh = uiCommand2("Refresh", () => this.loadModel(this.modelPartial), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("Join", async () => alert("TODO"), { icon: "withSIX-icon-Rocket" });
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
    return results.servers[0];
  }
}
