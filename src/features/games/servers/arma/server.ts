import { SessionState, SavePlayedServer } from "../server-render-base";
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
  VoidCommand,
  InstallContents, LaunchAction, LaunchContents, LaunchGame,
  UiContext, BasketService, GameClientInfo, ItemState
} from "../../../../framework";

import { inject } from 'aurelia-framework';

interface IExtendedServer extends IServer {
  modState: string;
}

@inject(UiContext, BasketService)
export class Server extends ViewModel {
  constructor(ui, private basketService: BasketService) { super(ui); }
  model: IExtendedServer;
  gameInfo: GameClientInfo;
  SessionState = SessionState;
  state;
  async activate(model: IExtendedServer) {
    this.model = model;

    this.gameInfo = await this.basketService.getGameInfo(this.w6.activeGame.id);
    this.subscriptions.subd(d => {
      this.updateState();
      d(this.eventBus.subscribe('refreshContentInfo-' + this.w6.activeGame.id, _ => this.updateState()));
      // TODO: should be able to get to events in a -* way...
      this.model.modList.filter(x => x.modId).forEach(x => {
        d(this.eventBus.subscribe('contentInfoStateChange-' + x.modId, _ => this.updateState()));
      });
    });
  }

  join = uiCommand2("Join", () => this.launch(), {
    icon: "withSIX-icon-Download", canExecuteObservable: this.observeEx(x => x.features.serverFeatures)
  });
  toggleFavorite = uiCommand2("", () => this.toggleFavoriteInternal());

  async toggleFavoriteInternal() {
    if (!this.w6.userInfo.id) {
      this.w6.openLoginDialog();
      return;
    }
    if (this.model.isFavorite) {
      await new RemoveFavorite(this.w6.activeGame.id, this.model.connectionAddress).handle(this.mediator);
      this.model.isFavorite = false;
      this.tools.removeEl(this.model.favorites, this.model.connectionAddress);
    } else {
      await new AddFavorite(this.w6.activeGame.id, this.model.connectionAddress).handle(this.mediator);
      this.model.isFavorite = true;
      this.model.favorites.push(this.model.connectionAddress);
    }
  }

  updateState() {
    if (this.model.modList.length === 0) {
      this.model.modState = "uptodate";
      return;
    }
    const modStates = this.model.modList.map(x => this.gameInfo.clientInfo.content[x.modId]);
    if (modStates.some(x => x && x.state === ItemState.UpdateAvailable)) {
      this.model.modState = "update";
      return;
    }

    if (modStates.some(x => !x || x.state === ItemState.NotInstalled)) {
      this.model.modState = "install";
      return;
    }
    this.model.modState = "uptodate";
  }

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
    if (this.w6.userInfo.id) await new SavePlayedServer(this.w6.activeGame.id, this.model.connectionAddress).handle(this.mediator);
    this.model.hasPlayed = true;
  }

  // workaround for Table->Tr->Compose problem
  get modState() { return this.model.modState; }
  set modState(value) { this.model.modState = value; }

  isVerified;

  get hasMods() { return this.model.modList.length > 0; }
  get serverType() {
    if (this.isVerified) { return "VERIFIED"; }
    return this.model.isDedicated ? 'DEDI' : 'LOCAL';
  }

  getUrl = () => `/p/${this.w6.activeGame.slug}/servers/${this.model.queryAddress.replace(/\./g, "-")}/${this.model.name.sluggifyEntityName()}`
}

class AddFavorite extends VoidCommand {
  constructor(public gameId: string, public endpoint: string) { super(); }
}

@handlerFor(AddFavorite)
class AddFavoriteHandler extends DbClientQuery<AddFavorite, void> {
  handle(message: AddFavorite) { return this.context.postCustom<void>(`games/${message.gameId}/favorite-servers`, message); }
}

class RemoveFavorite extends VoidCommand {
  constructor(public gameId: string, public endpoint: string) { super(); }
}

@handlerFor(RemoveFavorite)
class RemoveFavoriteHandler extends DbClientQuery<RemoveFavorite, void> {
  handle(message: RemoveFavorite) {
    return this.context.deleteCustom<void>(`games/${message.gameId}/favorite-servers/${message.endpoint}`);
  }
}

