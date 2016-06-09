import {UiContext,ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor, uiCommand2} from '../../../../framework'
import {ICollection} from './collection';
import {CreateCollectionDialog} from '../../../games/collections/create-collection-dialog';

interface IGroup {
  id: string;
  collections: ICollection[];
}

export class Index extends ViewModel {
  group: IGroup;
  async activate(params, routeConfig) {
    this.group = await new GetGroupCollections(Tools.fromShortId(params.id)).handle(this.mediator);
  }

  headerName = "Collections";

  create = uiCommand2("Create", async () => {
    // TODO: Game selection
    let result = await this.dialog.open({
        viewModel: CreateCollectionDialog,
        model: {
          game: {id: "9DE199E3-7342-4495-AD18-195CF264BA5B", slug: "arma-3"},
          model: { groupId: this.group.id}
        }
      });
  })
}

export class GetGroupCollections extends Query<IGroup> { constructor(public id: string) { super(); } }
@handlerFor(GetGroupCollections)
export class GetGroupCollectionsHandler extends DbQuery<GetGroupCollections, IGroup> {
  async handle(request: GetGroupCollections): Promise<IGroup> {
    var r = await this.context.getCustom<ICollection[]>("groups/" + request.id + '/collections');
    return {
      id: request.id,
      collections: r.data
    };
  }
}
