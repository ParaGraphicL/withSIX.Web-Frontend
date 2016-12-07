import { Router, RouterConfiguration } from "aurelia-router";
import { ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IIPEndpoint, GameHelper, uiCommand2 } from "../../../framework";

import { ServerRender } from './server-render';

interface IServer {
  queryAddress: string, gameId: string
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

  deactivate() {
    if (this.cancel) this.cancel();
    super.deactivate();
  }

  refresh = uiCommand2("Refresh", () => this.refreshInternal())

  cancel;

  async refreshInternal() {
    const dsp = this.observableFromEvent<{ items: string[], gameId: string }>('server.serversPageReceived')
      .filter(x => x.gameId === this.w6.activeGame.id)
      .subscribe(x => {
        this.model
          .addresses
          .push(...x.items.filter(s => !this.model.addresses.some(s2 => s2.queryAddress === s))
            .map(s => ({ gameId: x.gameId, queryAddress: s })));
      })
    try {
      const req = new GetServers(this.w6.activeGame.id);
      const p = req.handle(this.mediator);
      this.cancel = uiCommand2("Cancel", async () => { try { await req.cancel() } catch (err) { } });
      const r = await p;
    } finally {
      dsp.unsubscribe();
      this.cancel = null;
    }
  }

  showServer(server: IServer) {
    return this.dialog.open({ model: server.queryAddress, viewModel: ServerRender })
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
      //{ route: `${routeMount}`, name: "servers", moduleId: `${mount}/index` },
      { route: `${routeMount}`, name: "servers", moduleId: `${mount}/index2` },
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
  public cancel: () => Promise<void>; // TODO: this is a bad approach
}

interface IBatchResult {
  count: number;
}

@handlerFor(GetServers)
class GetServersQuery extends DbClientQuery<GetServers, IBatchResult>  {
  async handle(request: GetServers) {
    // TODO Move the starbound stuff to the client?
    // if (request.gameId === GameHelper.gameIds.Starbound) {
    //   const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    //   return { addresses: Array.from(gameServers.values()).map(x => x.address)};
    // }
    // if (this.tools.env > this.tools.Environment.Staging) { return this.arma3Bs(); }
    //return this.getAddresses(request); //{ addresses: results.addresses.map(x => ({ address: x, gameId: request.gameId })) };
    const cp = this.client.hubs.server
      .getServers({ gameId: request.gameId });;
    request.cancel = cp.cancel;
    return await cp;
  }
}
