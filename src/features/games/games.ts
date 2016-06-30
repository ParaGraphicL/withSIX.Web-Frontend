import {ViewModel, Query, DbClientQuery, handlerFor, breeze, ItemState, IGame, IBreezeGame} from '../../framework'
export class Games extends ViewModel {
  games: IGame[];
  async activate() {
    $('#header-row').attr('style', 'background-image: url("' + this.w6.url.getAssetUrl('img/play.withSIX/header.jpg') + '");');
    $('body').removeClass('game-profile');
    this.games = await new GetGames().handle(this.mediator);
    this.handleGameStates();
  }

  async handleGameStates() {
    let d = await new GetInstalledGames().handle(this.mediator);
    this.games.forEach(x => {
      if (d.has(x.id)) (<any>x).state = (<any>d.get(x.id)).state;
    })
  }
}

export class GetGames extends Query<IGame[]> { }
@handlerFor(GetGames)
export class GetGamesHandler extends DbClientQuery<GetGames, IGame[]> {
  async handle(request: GetGames): Promise<IGame[]> {
    let r = await this.context.executeQuery<IBreezeGame>(breeze.EntityQuery.from("Games")
      .where("parentId", breeze.FilterQueryOp.Equals, null)
      .where("public", breeze.FilterQueryOp.Equals, true) // ...
      .orderBy("name"));
    return <IGame[]><any>r.results;
  }
}

export class GetInstalledGames extends Query<Map<string, IGame>> { }

@handlerFor(GetInstalledGames)
class GetInstalledGamesHandler extends DbClientQuery<GetInstalledGames, Map<string, IGame>> {
  public async handle(request: GetInstalledGames): Promise<Map<string, IGame>> {
    try {
      let d: { games: IGame[] } = await this.client.getGames();
      d.games.forEach(x => (<any>x).state = ItemState.Uptodate)
      return this.tools.aryToMap(d.games, x => x.id);
    } catch (err) {
      return new Map<string, IGame>();
    }
  }
}
