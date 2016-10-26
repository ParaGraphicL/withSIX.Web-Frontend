import { SessionState } from "../server-render-base";
import { IServer } from "../browser";
import {
  ViewModel,
  Query,
  DbQuery,
  IPaginated,
  handlerFor,
  SortDirection,
  IFilter,
  DbClientQuery,
  uiCommand2,
  InstallContents, LaunchAction, LaunchContents, LaunchGame,
} from "../../../../framework";

export class Server extends ViewModel {
  model;
  SessionState = SessionState;
  activate(model) {
    this.model = model;
  }
  join = uiCommand2("Join", () => this.launch(), { icon: "withSIX-icon-Download" });

  async launch() {
    const contents = this.model.modList ? this.model.modList.map(x => x.modId).filter(x => x).uniq().map(x => {
      return { id: x };
    }) : [];
    if (contents.length > 0) {
      const noteInfo = {
        text: `Server: ${this.model.name}`,
        url: this.getUrl(),
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
  }

  isVerified;

  get hasMods() { return this.model.modList.length > 0; }
  get serverType() {
    if (this.isVerified) { return "VERIFIED"; }
    return this.model.isDedicated ? 'DEDI' : 'LOCAL';
  }

  getUrl = () => `/p/${this.w6.activeGame.slug}/servers/${this.model.queryAddress.replace(/\./g, "-")}/${this.model.name.sluggifyEntityName()}`
}