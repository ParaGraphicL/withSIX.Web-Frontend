import { W6Context } from "../w6context";
import { inject } from "aurelia-framework";

@inject(W6Context)
export class ServerFileUploader {
  constructor(private context: W6Context) { }
  uploadFile(directory: string, fileName: string, fileContent: string, serverId?: string) {
    return this.context.postCustom<void>(this.buildPath(directory, fileName, serverId), { fileContent });
  }
  deleteFile(directory: string, fileName: string, serverId?: string) {
    return this.context.deleteCustom<void>(this.buildPath(directory, fileName, serverId));
  }
  getFiles(directory: string, fileType: string, serverId?: string) {
    return this.context.getCustom<string[]>(this.buildPath(directory, fileType, serverId));
  }
  getFile(directory: string, fileType: string, serverId?: string) {
    return this.context.getCustom<string>(this.buildPath(directory, fileType, serverId));
  }
  buildPath(directory: string, fileName: string, serverId?: string) {
    const serverFrag = serverId ? `/servers/${serverId}` : "";
    return `/server-manager${serverFrag}/files/${directory}/${fileName}`;
  }
}
