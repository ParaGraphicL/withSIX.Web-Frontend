import { GameHelper,  IIPEndpoint, IServerInfo, LaunchAction, LaunchGame, ViewModel, uiCommand2 } from "../../../framework";
import { GetServer } from "./server-render-base";
import { ServerRender } from "./server-render";

export class SbServerItem extends ViewModel {
  model: {
    name; numPlayers; maxPlayers; missionName; mapName;
  } = <any>{}
  address: string;
  slug: string;
  loading: boolean;
  modelPartial;
  model2: {
    info: {
      name; numPlayers; maxPlayers; mission;
    }
  } = <any> {};
  mods = [];

  refresh = uiCommand2("", () => this.loadModel(this.modelPartial), {icon: "withSIX-icon-Reload"});
  join = uiCommand2("", () => this.launch(), { icon: "withSIX-icon-Rocket" });

  showServer() {
    return this.dialog.open({model: this.address, viewModel: ServerRender})
  }

  launch() {
    const act = new LaunchGame(this.w6.activeGame.id);
    act.action = LaunchAction.Join;
    act.serverAddress = this.address;
    return act.handle(this.mediator);
  }

  activate(model: { address: string, gameId: string }) {
    this.modelPartial = model;
    const w6Cheat = <any> window.w6Cheat;
    const servers = w6Cheat.servers || (w6Cheat.servers = {});
    const gameServers: Map<string, any> = servers[model.gameId];
    this.model2 = gameServers.get(this.address = model.address);
    this.slug = `${this.address.replace(/\./g, "-")}/${this.name ? this.name.sluggifyEntityName() : "no-name"}`;
    this.refresh();
  }

  get name() { return this.model.name || this.model2.info.name; };
  get numPlayers() { return this.model.numPlayers || this.model2.info.numPlayers; };
  get maxPlayers() { return this.model.maxPlayers || this.model2.info.maxPlayers; };
  get mission() { return this.model.missionName || this.model2.info.mission; };
  get mapName() { return this.model.mapName; }

  async loadModel(model: IServer) {
    this.model = await new GetServer(model.gameId, model.address, false).handle(this.mediator);
    this.loading = false;
  }
}

interface IServer {
  address: string;
  gameId: string;
}
