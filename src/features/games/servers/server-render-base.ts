import {
  BasketService, DbClientQuery, GameClientInfo, GameHelper, IServerInfo, InstallContents, LaunchAction, LaunchContents, LaunchGame,
  Query, UiContext, ViewModel, handlerFor, uiCommand2, VoidCommand
} from "../../../framework";

import { inject } from "aurelia-framework";

enum Dlcs {
  Apex = 16,
  Helicopters = 4,
  Karts = 2,
  Marksmen = 8,
  None = 0,
  Tanoa = 32,
  Zeus = 1
}

enum Arma2Dlcs {
  None = 0,
  BAF = 1,
  PMC = 2,
  ACR = 4,
  Arrowhead = 8
}

export interface ExtendedServerInfo extends IServerInfo {
  modList: any[];
  game: string;
  map: string;
  country: string;
  location: string;
  distance: number;
  connectionAddress: string;
  downloadableContent: Dlcs;
  created: Date;
  updatedAt: Date;
  hasPlayed: boolean;
}

enum HelicopterFlightModel {
  Basic,
  Advanced
}

enum Difficulty {
  Recruit,
  Regular,
  Veteran,
  Custom
}

enum AiLevel {
  Novice,
  Normal,
  Expert,
  Custom
}

export enum SessionState {
  None,
  SelectingMission,
  EditingMission,
  AssigningRoles,
  SendingMission,
  LoadingGame,
  Briefing,
  Playing,
  Debriefing,
  MissionAborted
}

@inject(UiContext, BasketService)
export class ServerRenderBase extends ViewModel {
  SessionState = SessionState;
  AiLevel = AiLevel;
  Difficulty = Difficulty;
  HelicopterFlightModel = HelicopterFlightModel;
  gameId;
  model: ExtendedServerInfo;
  mods;
  links;
  clientLoaded;
  refresh = uiCommand2("", () => this.loadModel(), { icon: "withSIX-icon-Reload", canExecuteObservable: this.observeEx(x => x.features.serverFeatures) });
  join = uiCommand2("Join", () => this.launch(), { icon: "withSIX-icon-Download", canExecuteObservable: this.observeEx(x => x.features.serverFeatures) });
  detailsShown = false;
  dlcs = [];
  gameInfo: GameClientInfo;

  constructor(ui: UiContext, protected basketService: BasketService) {
    super(ui);
  }

  get address() { return this.model.queryAddress; }

  url;

  async launch() {
    const contents = this.model.modList ? this.model.modList.map(x => x.modId).filter(x => x).uniq().map(x => {
      return { id: x };
    }) : [];
    if (contents.length > 0) {
      const contents = this.model.modList.map(x => x.modId).filter(x => x).map(x => {
        return { id: x };
      });
      const noteInfo = {
        text: `Server: ${this.model.name}`,
        url: this.url,
      };

      // TODO: Don't install if already has
      const installAct = new InstallContents(this.w6.activeGame.id, contents, noteInfo, true);
      await installAct.handle(this.mediator);
      const launchAct = new LaunchContents(this.w6.activeGame.id, contents, noteInfo, LaunchAction.Join);
      launchAct.serverAddress = this.model.connectionAddress || this.model.queryAddress;
      await launchAct.handle(this.mediator);
    } else {
      const act = new LaunchGame(this.w6.activeGame.id);
      act.action = LaunchAction.Join;
      act.serverAddress = this.model.connectionAddress || this.model.queryAddress;
      await act.handle(this.mediator);
    }
    if (this.w6.userInfo.id) await new SavePlayedServer(this.w6.activeGame.id, this.model.connectionAddress).handle(this.mediator);
    this.model.hasPlayed = true;
  }

  extractInfo(text: string) {
    let servers = [];
    text.replace(/(TS3?\s*(ip\s*)?:?\s*)(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|\w+\.[-\.\w]+)(:[0-9]{1,6})?)/ig,
      (whole, m1, m2, m3) => {
        if (!servers.some(x => x.title === m2)) { servers.push({ title: m3, type: "Teamspeak3", url: `ts3server://${m3}` }); }
        return whole;
      })
      .replace(/ts3?\.[-\w.]+/ig, (whole) => {
        if (!servers.some(x => x.title === whole)) { servers.push({ title: whole, type: "Teamspeak3", url: `ts3server://${whole}` }); };
        return whole;
      });

    return servers;
    // TS: hia3.net
    // ts3.moh-gaming.fr
    // TS arma3.zp.ua
    // TS: 138.201.206.146
    // TS3: 89.22.150.168
    // Ts3 ip : 149.202.195.113
    // TS:109.70.149.5:9019
    // TS3:5.9.23.52
    // ts.combinedarms.co.uk
    // [TS3: ts3.our-army.su]
    // MAKO:62.210.169.9:9987
    //  | ts.legion-revival.fr
    // BUT NOT!: TS3 Co-op
  }

  isDlcInstalled(dlc: string) { return this.gameInfo.isDlcInstalled(dlc); }
  addDlc(dlc: number, t) { this.dlcs.push({ isInstalled: this.isDlcInstalled(t[dlc]), name: t[dlc] }); }

  async activateInternal(model) {
    this.model = model;
    this.gameId = this.w6.activeGame.id;
    this.gameInfo = await this.basketService.getGameInfo(this.gameId); // hack
    // await this.loadModel();
    // const details = (<any> this.model).details;
    // if (details && details.modList) { this.handleMods(details); }

    const lc = this.gameId.toLowerCase();
    if (lc === GameHelper.gameIds.Arma3.toLowerCase()) {
      let e = this.model.downloadableContent;
      if (e === Dlcs.None) {

      } else {
        if (e & Dlcs.Apex) { this.addDlc(Dlcs.Apex, Dlcs); }
        if (e & Dlcs.Helicopters) { this.addDlc(Dlcs.Helicopters, Dlcs); }
        if (e & Dlcs.Karts) { this.addDlc(Dlcs.Karts, Dlcs); }
        if (e & Dlcs.Marksmen) { this.addDlc(Dlcs.Marksmen, Dlcs); }
        if (e & Dlcs.Tanoa) { this.addDlc(Dlcs.Tanoa, Dlcs); }
        if (e & Dlcs.Zeus) { this.addDlc(Dlcs.Zeus, Dlcs); }
      }
    } else if (lc === GameHelper.gameIds.Arma2Co.toLowerCase()) {
      let e = <Arma2Dlcs><any>this.model.downloadableContent;
      if (e === Arma2Dlcs.None) {

      } else {
        if (e & Arma2Dlcs.Arrowhead) { this.addDlc(Arma2Dlcs.Arrowhead, Arma2Dlcs); }
        if (e & Arma2Dlcs.PMC) { this.addDlc(Arma2Dlcs.PMC, Arma2Dlcs); }
        if (e & Arma2Dlcs.BAF) { this.addDlc(Arma2Dlcs.BAF, Arma2Dlcs); }
        if (e & Arma2Dlcs.ACR) { this.addDlc(Arma2Dlcs.ACR, Arma2Dlcs); }
      }
    }


    this.updateLinks();

    this.url = `/p/${this.w6.activeGame.slug}/servers/${this.address.replace(/\./g, "-")}/${this.model.name.sluggifyEntityName()}`;

    if (this.w6.miniClient.isConnected && this.features.serverFeatures) { this.refresh(); }
    this.subscriptions.subd(d => {
      const interval = setInterval(() => {
        if (!this.w6.miniClient.isConnected || !this.features.serverFeatures) { return; }
        if (this.refresh.canExecute) { this.refresh(); }
      }, 15 * 1000);
      d(() => clearTimeout(interval));
    });
  }

  async handleMods(details) {
    let l: { mappings: any[] } = await new GetModInfo(this.gameId, details.modList).handle(this.mediator);
    const mappings = l.mappings.toMap(x => x.inputName);
    this.mods = details.modList.map(x => {
      return {
        mapping: mappings.get(x.name),
        name: x.name,
      };
    });
  }

  getPublisherUrl(p) {
    return p.publisher === 2 ?
      `https://starbound-servers.net/server/${p.publisherId}/` : `https://www.gametracker.com/server_info/${p.publisherId}/`;
  }

  getPublisherName(p) { return `${p.publisher === 2 ? "Starbound-Servers.net" : "GameTracker.com"}`; }
  get hasMods() { return this.model.modList.length > 0; }

  async loadModel() {
    try {
      const m = await new GetServer(this.gameId, this.address).handle(this.mediator);
      // for now keep modlist from server as it has modID linked in..
      const { modList, country, distance, location, created } = this.model;
      Object.assign(this.model, m, { modList, country, distance, location, created, updatedAt: new Date() });
      this.clientLoaded = true;
      this.updateLinks();
    } catch (err) {
      this.tools.Debug.warn("error while trying to refresh server", err);
    }
  }
  updateLinks() {
    this.links = this.extractInfo(this.model.name + " " + this.model.game);
  }
}

export class GetServer extends Query<IServerInfo> {
  constructor(public gameId: string, public address: string, public includeRules = false, public includePlayers = false) { super(); }
}

@handlerFor(GetServer)
class GetServerQuery extends DbClientQuery<GetServer, IServerInfo>  {
  async handle(request: GetServer) {
    let results = await this.client.hubs.server
      .getServersInfo(<any>{
        addresses: [request.address], gameId: request.gameId, includePlayers: request.includePlayers, includeRules: request.includeRules
      });
    const gameServers = await GameHelper.getGameServers(request.gameId, this.context);
    let s = results.servers[0];
    if (s == null) { throw new Error("server could not be refreshed"); } // TODO: Not found error?
    return Object.assign({}, s, { additional: gameServers.get(request.address) });
  }
}

export class GetModInfo extends Query<any> {
  constructor(public gameId: string, public inputMappings: any[]) { super(); }
}

@handlerFor(GetModInfo)
class GetModInfoQuery extends DbClientQuery<GetModInfo, any>  {
  handle(request: GetModInfo) {
    return this.context.postCustom("mods/get-mod-mappings", { gameId: request.gameId, inputMappings: request.inputMappings });
  }
}

export class SavePlayedServer extends VoidCommand {
  constructor(public gameId: string, public endpoint: string) { super(); }
}

@handlerFor(SavePlayedServer)
class SavePlayedServerHandler extends DbClientQuery<SavePlayedServer, void> {
  handle(message: SavePlayedServer) { return this.context.postCustom<void>(`games/${message.gameId}/favorite-servers/played`, message); }
}
