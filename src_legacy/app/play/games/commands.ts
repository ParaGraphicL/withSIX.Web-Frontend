module MyApp.Play.Games {

  export class OpenAddModDialogQuery extends DbQueryBase {
    static $inject = ['dbContext', '$modal', 'logger'];
    static $name = 'OpenAddModDialog';

    constructor(context: W6Context, private $modal, private logger) { super(context); }

    public execute = [
      'gameSlug', 'info',
      (gameSlug, info: { type?: string, folder?: string, groupId?: string }) => {
        let game = this.context.w6.activeGame;
        Debug.log(this.$modal);
        return DialogQueryBase.openDialog(this.$modal, AddModDialogController, {
          resolve: {
            game: () => Promise.resolve({ id: game.id, slug: game.slug, name: game.slug.replace("-", " ").toUpperCaseFirst() }), // this.findBySlug("Games", gameSlug, "getGame")
            info: () => info
          }
        });
      }
    ];
  }

  registerCQ(OpenAddModDialogQuery);

  export class OpenAddCollectionDialogQuery extends DbQueryBase {
    static $inject = ['dbContext', '$modal', 'logger'];
    static $name = 'OpenAddCollectionDialog';

    constructor(context: W6Context, private $modal, private logger) { super(context); }

    public execute = [
      'gameSlug',
      (gameSlug) => {

        Debug.log(this.$modal);
        return DialogQueryBase.openDialog(this.$modal, AddCollectionDialogController, {
          resolve: {
            game: () => this.findBySlug("Games", gameSlug, "getGame")
          }
        });
      }
    ];
  }

  registerCQ(OpenAddCollectionDialogQuery);

  export class GetGamesQuery extends DbQueryBase {
    static $name = "GetGames";

    public execute = [
      () => this.context.executeQuery(breeze.EntityQuery.from("Games")
        .where("parentId", breeze.FilterQueryOp.Equals, null)
        .where("public", breeze.FilterQueryOp.Equals, true) // ...
        .orderBy("name"))
        .then(data => data.results)
    ];
  }

  registerCQ(GetGamesQuery);

  export class GetGameQuery extends DbQueryBase {
    static $name = "GetGame";
    static $inject = ['dbContext', 'aur.basketService'];

    constructor(context: W6Context, private basketService) {
      super(context);
    }

    public execute = ['gameSlug', async (gameSlug) => {
      let game = await this.findBySlug("Games", gameSlug, "getGame");

      return { game: game, gameInfo: await this.basketService.getGameInfo(game.id) };
    }
    ];
  }

  registerCQ(GetGameQuery);

  export class NewModCommand extends DbCommandBase {
    static $name = 'NewMod';
    public execute = ['data', data => this.context.postCustom<{ result: string }>("mods", data, { requestName: 'postNewMod' }).then(r => r.data.result)];
  }

  registerCQ(NewModCommand);
  export class NewImportedCollectionCommand extends DbCommandBase {
    static $name = 'NewImportedCollection';
    public execute = ['data', data => this.context.postCustom("collections/import-repo", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
  }

  registerCQ(NewImportedCollectionCommand);

  export class NewMultiImportedCollectionCommand extends DbCommandBase {
    static $name = 'NewMultiImportedCollection';
    public execute = ['data', data => this.context.postCustom("collections/import-server", data, { requestName: 'postNewCollection' })/*.then(r => r.data['result'])*/];
  }

  registerCQ(NewMultiImportedCollectionCommand);

  export class GetCheckLinkQuery extends DbCommandBase {
    static $name = 'GetCheckLink';
    public execute = ['linkToCheck', linkToCheck => this.context.getCustom<BooleanResult>("cool/checkLink", { requestName: 'checkLink', params: { linkToCheck: linkToCheck } }).then(result => result.data.result)];
  }

  registerCQ(GetCheckLinkQuery);
}
