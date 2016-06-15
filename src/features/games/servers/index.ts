import {Router, RouterConfiguration} from 'aurelia-router';
import {ViewModel, handlerFor, Query, DbClientQuery, IGameSettingsEntry, IGamesSettings, IIPEndpoint} from '../../../framework';

export class Index extends ViewModel {
  model: IServers;
  async activate(params, routeConfig) {
    let gameId = "9DE199E3-7342-4495-AD18-195CF264BA5B"; // a3
    this.model = await new GetServers(gameId).handle(this.mediator);
  }

  getSlug(addr: IIPEndpoint) { return addr.address.replace(/\./g, '-') + ":" + addr.port + '/test'; }
}

interface IServers {
  addresses: { address: IIPEndpoint, gameId: string }[]
}

export class ServersModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'servers';
    config.map([
      { route: `${routeMount}`, name: 'servers', moduleId: `${mount}/index` },
      { route: `${routeMount}/:serverId/:serverSlug?`, name: 'servers-show', moduleId: `${mount}/show` }
    ])
  }
}

class GetServers extends Query<IServers> {
  constructor(public gameId: string) { super() }
}

@handlerFor(GetServers)
class GetServersQuery extends DbClientQuery<GetServers, IServers>  {
  async handle(request: GetServers) {
    await (<any>this.client).connection.promise(); // Puh todo
    let results = await this.client.hubs.server
      .getServers({ gameId: request.gameId });
    return { addresses: results.addresses.asEnumerable().select(x => { return { address: x, gameId: request.gameId } }).toArray() };
  }
}
