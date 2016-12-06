import { RequestBase, ServerClient, ServerStore } from "../../../../framework";
import { inject } from "aurelia-framework";

@inject(ServerClient, ServerStore)
export abstract class ServerHandler<TRequest, TResponse> extends RequestBase<TRequest, TResponse> {
  constructor(protected client: ServerClient, protected store: ServerStore) { super(); }
}
