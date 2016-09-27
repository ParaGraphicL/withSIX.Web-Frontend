import { Router, RouterConfiguration } from "aurelia-router";
import { ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IIPEndpoint, GameHelper, uiCommand2 } from "../../../framework";

import { ServerRender } from './server-render';

interface IServer {
  address: string, gameId: string
}

export class Index extends ViewModel {
  model: IServers = { addresses: [] }
  vm = "./server-item";
  async activate(params, routeConfig) {
    if (this.w6.activeGame.id === GameHelper.gameIds.Starbound) {
      this.vm = "./sb-server-item";
    }

    this.refresh();
  }

  refresh = uiCommand2("Refresh", () => this.refreshInternal())

  async refreshInternal() {
    const dsp = this.observableFromEvent<{ items: string[], gameId: string }>('server.serversPageReceived')
      .filter(x => x.gameId === this.w6.activeGame.id)
      .subscribe(x => {
        this.model
          .addresses
          .push(...x.items.filter(s => !this.model.addresses.some(s2 => s2.address === s))
            .map(s => { return { gameId: x.gameId, address: s } }));
      })
    try {
      const r = await new GetServers(this.w6.activeGame.id).handle(this.mediator);
    } finally {
      dsp.unsubscribe();
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

class GetServers extends Query<IBatchResult> {
  constructor(public gameId: string) { super(); }
}

interface IBatchResult {
  count: number;
}

@handlerFor(GetServers)
class GetServersQuery extends DbClientQuery<GetServers, IBatchResult>  {
  async handle(request: GetServers) {
    const results = await this.getAddresses(request);
    return results; //{ addresses: results.addresses.map(x => { return { address: x, gameId: request.gameId }; }) };
  }

  async getAddresses(request: GetServers) {
    // TODO Move the starbound stuff to the client?
    // if (request.gameId === GameHelper.gameIds.Starbound) {
    //   const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    //   return { addresses: Array.from(gameServers.values()).map(x => x.address)};
    // }
    // if (this.tools.env > this.tools.Environment.Staging) { return this.arma3Bs(); }
    await (<any> this.client).connection.promise(); // Puh todo
    return await this.client.hubs.server
      .getServers({ gameId: request.gameId });
  }
}
