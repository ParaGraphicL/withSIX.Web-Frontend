import { inject } from "aurelia-framework";
import { GQLClient, handlerFor, IBasketItem, RequestBase, ServerClient, ServerStore, VoidCommand } from "../../../../framework";

@inject(ServerClient, ServerStore, GQLClient)
export abstract class ServerHandler<TRequest, TResponse> extends RequestBase<TRequest, TResponse> {
  constructor(protected client: ServerClient, protected store: ServerStore, protected gcl: GQLClient) { super(); }
}

export class ToggleModInServer extends VoidCommand { constructor(public mod: IBasketItem) { super(); } }

@handlerFor(ToggleModInServer)
export class ToggleModInServerHandler extends ServerHandler<ToggleModInServer, void> {
  async handle(req: ToggleModInServer) { this.store.activeGame.activeServer.toggleMod(req.mod); }
}
