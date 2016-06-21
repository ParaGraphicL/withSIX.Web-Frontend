import {UiContext, ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor, uiCommand2} from '../../../../framework'
import {ICollection} from './collection';
import {CreateCollectionDialog} from '../../../games/collections/create-collection-dialog';

interface IGroup {
  id: string;
  collections: ICollection[];
}

export class Index extends ViewModel {
  group: IGroup;
  async activate(params, routeConfig) {
    this.group = await new GetGroupCollections(this.tools.fromShortId(params.id)).handle(this.mediator);
  }

  headerName = "Collections";

  create = uiCommand2("Create", async () => {
    // TODO: Game selection
    let result = await this.dialog.open({
      viewModel: CreateCollectionDialog,
      model: {
        game: this.w6.activeGame,
        model: { groupId: this.group.id }
      }
    });
  })
}

export class GetGroupCollections extends Query<IGroup> { constructor(public id: string) { super(); } }
@handlerFor(GetGroupCollections)
export class GetGroupCollectionsHandler extends DbQuery<GetGroupCollections, IGroup> {
  async handle(request: GetGroupCollections): Promise<IGroup> {
    var r = await this.context.getCustom<ICollection[]>("groups/" + request.id + '/collections');
    r.forEach(x => { let xAny = (<any>x); xAny.gameSlug = x.game.slug; xAny.author = xAny.author.displayName });
    return {
      id: request.id,
      collections: r
    };
  }
}
