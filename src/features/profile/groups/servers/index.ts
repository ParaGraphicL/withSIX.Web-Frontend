import {UiContext,ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor} from '../../../../framework'

interface IGroup {
  id: string;
  mods;
}

export class Index extends ViewModel {
  group: IGroup;
  async activate(params, routeConfig) {
    this.group = await new GetGroupMods(this.tools.fromShortId(params.id)).handle(this.mediator);
  }
}

export class GetGroupMods extends Query<IGroup> {
  constructor(public id: string) { super(); }
}
@handlerFor(GetGroupMods)
export class GetGroupModsHandler extends DbQuery<GetGroupMods, IGroup> {
  async handle(request: GetGroupMods): Promise<IGroup> {
    //var r = await this.context.getCustom<IGroup>("groups/" + request.id + '/mods');
    //return r.data;
    return <IGroup>{};
  }
}
