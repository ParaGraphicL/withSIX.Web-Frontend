import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2, IPaginated, IServer, DbQuery,
} from "../../../framework";

import { ServerRenderBase } from "../../games/servers/server-render-base";

export class Show extends ServerRenderBase {
  async activate(model: { address: string }) {
    const servers = await new GetServer(this.w6.activeGame.id, [model.address]).handle(this.mediator);
    if (servers.items.length === 0) { throw new this.tools.NotFoundException("The specified server could not be found!", { status: 404, statusText: "NotFound" }); };
    await super.activateInternal(servers.items[0]);
  }
}

export class GetServer extends Query<IPaginated<IServer>> {
  constructor(public gameId: string, public addresses: string[]) {
    super();
  }
}

@handlerFor(GetServer)
class GetServersHandler extends DbQuery<GetServer, IPaginated<IServer>> {
  handle(request: GetServer) {
    return this.context.postCustom("/servers", {
      gameId: request.gameId,
      filter: {
        addresses: request.addresses,
      },
      pageInfo: {
        pageSize: request.addresses.length
      }
    })
  }
}
