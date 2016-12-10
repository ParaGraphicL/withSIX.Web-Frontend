import { ServersApi } from "./servers-api";
import { W6Context } from "../w6context";
import { inject } from "aurelia-framework";
import { ServerFileUploader } from "./server-file-uploader";

export interface IServerClient {
  servers: ServersApi;
}

@inject(ServersApi, ServerFileUploader)
export class ServerClient implements IServerClient {
  constructor(public servers: ServersApi, public uploader: ServerFileUploader) { }
}
