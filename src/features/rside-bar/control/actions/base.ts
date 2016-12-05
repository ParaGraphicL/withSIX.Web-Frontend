import { RequestBase, ServerClient } from "../../../../framework";
import { inject } from "aurelia-framework";

@inject(ServerClient)
export abstract class ServerHandler<TRequest, TResponse> extends RequestBase<TRequest, TResponse> {
  constructor(protected client: ServerClient) { super(); }
}
