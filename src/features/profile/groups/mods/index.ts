import {UiContext,ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor, uiCommand2} from '../../../../framework'
import {IMod} from './mod';

interface IGroup {
  id: string;
  mods: IMod[];
}

export class Index extends ViewModel {
  group: IGroup;
  headerName = "Mods"
  async activate(params, routeConfig) {
    this.group = await new GetGroupMods(this.tools.fromShortId(params.id)).handle(this.mediator);
  }

  create = uiCommand2("Create", async () => {
    // TODO: Game selection..
    this.legacyMediator.openAddModDialog('arma-3', {groupId: this.group.id})
  })
}

export class GetGroupMods extends Query<IGroup> { constructor(public id: string) { super(); } }
@handlerFor(GetGroupMods)
export class GetGroupModsHandler extends DbQuery<GetGroupMods, IGroup> {
  async handle(request: GetGroupMods): Promise<IGroup> {
    var r = await this.context.getCustom<IMod[]>("groups/" + request.id + '/contents');
    r.data.forEach(x => x.groupId = request.id);
    return {
      id: request.id,
      mods: r.data
    };
  }
}
