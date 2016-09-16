import { IIPEndpoint, IServerInfo, ViewModel, uiCommand2 } from "../../../framework";
import { GetServer } from "./show";

interface IServer {
  address: IIPEndpoint;
  gameId: string;
}

export class ServerItem extends ViewModel {
  interval: number;
  slug: string;
  modelPartial: IServer;
  loading: boolean;
  model: IServerInfo | IServer;
  refresh = uiCommand2("", () => this.loadModel(this.modelPartial), {icon: "withSIX-icon-Reload"});
  join = uiCommand2("", async () => alert("TODO"), {icon: "withSIX-icon-Rocket"});

  activate(model: IServer) {
    this.modelPartial = model;
    this.model = model;
    this.slug = model.address.address.replace(/\./g, "-") + ":" + model.address.port + "/test";
    this.loading = true;
    this.refresh();
    this.interval = setInterval(() => { if (this.refresh.canExecute) { this.refresh(); } }, 15 * 1000);
  }

  deactivate() { clearInterval(this.interval); }

  async loadModel(model: IServer) {
    this.model = await new GetServer(model.gameId, model.address).handle(this.mediator);
    this.loading = false;
  }
}
