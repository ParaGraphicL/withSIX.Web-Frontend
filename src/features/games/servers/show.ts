import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2, IPaginated, IServer, DbQuery,
} from "../../../framework";

import { ServerRenderBase } from './server-render-base';

export class Show extends ServerRenderBase {
  async activate(params, routeConfig) {
    const servers = await new GetServer(this.w6.activeGame.id, [params.serverId.replace(/-/g, ".")]).handle(this.mediator);
    await super.activateInternal(servers.items[0]);
  }
}

class GetServer extends Query<IPaginated<IServer>> {
  constructor(public gameId: string, public addresses: string[]) {
    super();
  }
}

@handlerFor(GetServer)
class GetServersHandler extends DbQuery<GetServer, IPaginated<IServer>> {
  handle(request: GetServer) {
    return this.context.getCustom("servers", {
      params: {
        filter: {
          addresses: request.addresses,
        },
        pageInfo: {
          pageSize: request.addresses.length
        }
      }
    })
  }
}
