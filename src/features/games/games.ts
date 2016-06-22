import {ViewModel, Query, DbQuery, handlerFor, breeze} from '../../framework'
export class Games extends ViewModel {
  games: any[];
  async activate() {
    $('#header-row').attr('style', 'background-image: url("' + this.w6.url.getAssetUrl('img/play.withSIX/header.jpg') + '");');
    $('body').removeClass('game-profile');
    this.games = await new GetGames().handle(this.mediator);
  }
}

export class GetGames extends Query<any[]> { }
@handlerFor(GetGames)
export class GetGamesHandler extends DbQuery<GetGames, any[]> {
  handle(request: GetGames) {
    return this.context.executeQuery(breeze.EntityQuery.from("Games")
      .where("parentId", breeze.FilterQueryOp.Equals, null)
      .where("public", breeze.FilterQueryOp.Equals, true) // ...
      .orderBy("name"))
      .then(data => data.results)
  }
}
