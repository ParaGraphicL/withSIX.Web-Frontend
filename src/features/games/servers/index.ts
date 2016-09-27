import { Router, RouterConfiguration } from "aurelia-router";
import { ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IIPEndpoint, GameHelper } from "../../../framework";

import { ServerRender } from './server-render';

interface IServer {
  address: string, gameId: string
}

export class Index extends ViewModel {
  model: IServers;
  vm = "./server-item";
  async activate(params, routeConfig) {
    this.model = await new GetServers(this.w6.activeGame.id).handle(this.mediator);
    if (this.w6.activeGame.id === GameHelper.gameIds.Starbound) {
      this.vm = "./sb-server-item";
    }
  }

  showServer(server: IServer) {
    return this.dialog.open({model: server.address, viewModel: ServerRender})
  }

  getSlug(addr: string) { return addr.replace(/\./g, "-") + "/test"; }
}

interface IServers {
  addresses: IServer[];
}

export class ServersModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + "servers";
    config.map([
      { route: `${routeMount}`, name: "servers", moduleId: `${mount}/index` },
      { route: `${routeMount}/:serverId/:serverSlug?`, name: "servers-show", moduleId: `${mount}/show` },
    ]);
  }
}

export interface ISP {
  publisher: ServerPublisher;
  publisherId: string;
}

enum ServerPublisher {
  withSIX,
  Steam,
  ListForge,
  Gametracker
}

class GetServers extends Query<IServers> {
  constructor(public gameId: string) { super(); }
}

@handlerFor(GetServers)
class GetServersQuery extends DbClientQuery<GetServers, IServers>  {
  async handle(request: GetServers) {
    const results = await this.getAddresses(request);
    return { addresses: results.addresses.map(x => { return { address: x, gameId: request.gameId }; }) };
  }

  async getAddresses(request: GetServers) {
    if (request.gameId === GameHelper.gameIds.Starbound) {
      const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
      return { addresses: Array.from(gameServers.values()).map(x => x.address)};
    }
    // if (this.tools.env > this.tools.Environment.Staging) { return this.arma3Bs(); }
    await (<any> this.client).connection.promise(); // Puh todo
    return await this.client.hubs.server
      .getServers({ gameId: request.gameId });
  }

  arma3Bs = () => {
    const addrs = [
      { "address": "213.136.91.14", "port": 2303 }, { "address": "213.136.91.14", "port": 2323 }, { "address": "85.131.163.77", "port": 2303 }, { "address": "85.10.211.100", "port": 2631 }, { "address": "213.136.77.161", "port": 2303 }, { "address": "80.241.222.167", "port": 2331 }, { "address": "85.10.196.54", "port": 2303 }, { "address": "193.200.241.45", "port": 2303 }, { "address": "5.189.173.177", "port": 2313 }, { "address": "213.133.111.8", "port": 2303 }, { "address": "5.189.177.199", "port": 2303 }, { "address": "5.189.138.2", "port": 2303 }, { "address": "85.10.192.241", "port": 2303 }, { "address": "5.189.149.245", "port": 2303 }, { "address": "5.189.170.46", "port": 27416 }, { "address": "85.10.204.28", "port": 2341 }, { "address": "213.136.79.148", "port": 2303 }, { "address": "213.136.72.197", "port": 2303 }, { "address": "188.104.122.174", "port": 2303 }, { "address": "5.189.138.85", "port": 2303 }];
    return {
      addresses: addrs.concat(addrs).concat(addrs).concat(addrs),
    };
  }
}
