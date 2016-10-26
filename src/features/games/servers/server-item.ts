import { IIPEndpoint, IServerInfo, ViewModel, uiCommand2 } from "../../../framework";
import { GetServer } from "./server-render-base";
import { ServerRender } from "./server-render";

interface IServer {
  queryAddress: string;
  gameId: string;
}

export class ServerItem extends ViewModel {
  interval: number;
  slug: string;
  modelPartial: IServer;
  loading: boolean;
  model: IServerInfo | IServer;
  refresh = uiCommand2("", () => this.loadModel(this.modelPartial), { icon: "withSIX-icon-Reload" });
  join = uiCommand2("", async () => alert("TODO"), { icon: "withSIX-icon-Download" });

  activate(model: IServer) {
    this.modelPartial = model;
    this.model = model;
    this.slug = model.queryAddress.replace(/\./g, "-") + "/test";
    this.loading = true;
    this.refresh();
    //this.interval = setInterval(() => { if (this.refresh.canExecute) { this.refresh(); } }, 15 * 1000);
  }

  deactivate() { clearInterval(this.interval); }

  showServer() { return this.dialog.open({ model: this.model.queryAddress, viewModel: ServerRender }) }
  async loadModel(model: IServer) {
    this.model = await new GetServer(model.gameId, model.queryAddress, false).handle(this.mediator);
    this.loading = false;
  }
}
