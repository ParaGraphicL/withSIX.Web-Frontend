import { ServersApi } from "./servers-api";
import { W6Context } from "../w6context";
import { inject } from "aurelia-framework";

export interface IServerClient {
  servers: ServersApi;
}

@inject(W6Context)
export class ServerClient implements IServerClient {
  servers: ServersApi;
  constructor(ctx: W6Context) {
    this.servers = new ServersApi(ctx);
  }
}