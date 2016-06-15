import {ViewModel, Query, DbClientQuery, handlerFor, IGame} from '../../../framework';
import {Index as SettingsIndex} from '../../settings/index';

export class Games extends ViewModel {
  heading = "Library"
  model: IGamesData;
  clientEnabled: boolean;

  openGameSettings() {
    let model = { module: "games" };
    this.dialog.open({ viewModel: SettingsIndex, model: model })
  }

  async activate(params, routeConfig) {
    try {
      this.model = await new GetGames().handle(this.mediator)
      this.clientEnabled = true;
    } catch (err) {
      Tools.Debug.warn("Error trying to fetch games library", err);
      this.clientEnabled = false;
    }
  }
}


export interface IGamesData {
  games: Map<string, IGame>;
}
export class GetGames extends Query<IGamesData> { }

@handlerFor(GetGames)
class GetGamesHandler extends DbClientQuery<GetGames, IGamesData> {
  public async handle(request: GetGames): Promise<IGamesData> {
    try {
      if (!this.context.w6.miniClient.isConnected) throw new Error("client not running");
      let d: { games: IGame[] } = await this.client.getGames();
      return { games: Tools.aryToMap(d.games, x => x.id) }
    } catch (err) {
      Tools.Debug.warn(err);
      let ary: IGame[];
      if (this.context.w6.userInfo.id) {
        let r = await this.context.getCustom<{ games: IGame[] }>("games");
        ary = r.data.games;
      } else ary = [];
      return { games: Tools.aryToMap(ary, x => x.id) }
    }
    // return GetGamesHandler.designTimeData(request);
  }

  static async designTimeData(request: GetGames) {
    return {
      games: [
        {
          slug: 'arma-3',
          name: 'ARMA 3',
          isInstalled: true,
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        },
        {
          slug: 'arma-2',
          name: 'ARMA 2',
          isInstalled: true,
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        },
        {
          slug: 'GTA-5',
          name: 'GTA 5',
          isInstalled: true,
          author: "Some author",
          image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
        }
      ]
    };
  }
}
