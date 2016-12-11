import { ITabModel, ServerTab, SharedValues } from "../rside-bar";
import { GetLog, GetLogs } from "./actions/other"; // todo decompose
import { Command as ScaleServer } from "./actions/scale";
import { ManagedServer, ViewModel } from "../../../framework"

export class Logs extends ViewModel {
  server: ManagedServer;
  logs: Map<string, string>;
  uploading: boolean;

  async activate(model: ManagedServer) {
    this.server = model;
    const logs = await this.request(new GetLogs(this.server.id));
    this.logs = logs.toMap(x => x);
  }

  // todo; must use command with exec block
  // I Guess we could make a generic component where we slot into the data which would handle the command binding?
  async getLog(m) {
    this.uploading = true;
    try {
      location.href = await this.request(new GetLog(m, this.server.id));
    } finally {
      this.uploading = false;
    }
  }
}
