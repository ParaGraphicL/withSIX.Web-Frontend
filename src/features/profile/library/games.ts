import {ViewModel, Query, DbClientQuery, handlerFor, IGame, ItemState} from "../../../framework";
import {Index as SettingsIndex} from "../../settings/index";

export class Games extends ViewModel {
  heading = "library";
  model: IGamesData;
  clientEnabled: boolean;

  openGameSettings() {
    let model = { module: "games" };
    this.dialog.open({ model, viewModel: SettingsIndex });
  }

  async activate(params, routeConfig) {
    try {
      this.model = await new GetGames().handle(this.mediator);
      this.clientEnabled = true;
    } catch (err) {
      this.tools.Debug.warn("Error trying to fetch games library", err);
      this.clientEnabled = false;
    }
  }
}


export interface IGamesData {
  games: IGame[];
}
export class GetGames extends Query<IGamesData> { }

@handlerFor(GetGames)
class GetGamesHandler extends DbClientQuery<GetGames, IGamesData> {
  public async handle(request: GetGames): Promise<IGamesData> {
    try {
      let d: { games: IGame[] } = await this.client.getGames();
      d.games.forEach(x => (<any> x).state = ItemState.Uptodate);
      return d;
    } catch (err) {
      this.tools.Debug.warn(err);
      let ary: IGame[];
      if (this.w6.userInfo.id) {
        let r = await this.context.getCustom<{ games: IGame[] }>("games");
        r.games.forEach(x => (<any> x).state = ItemState.NotInstalled);
        ary = r.games;
      } else { ary = []; }
      return { games: ary };
    }
  }
}
