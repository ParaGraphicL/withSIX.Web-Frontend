import {UiContext,ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor} from '../../../framework'
import {GroupDeleted} from './group';
import {NewGroupDialog} from './new-group-dialog';

export interface IGroup {
  id: string;
  name: string;
  isAdmin: boolean;
  avatarUrl: string;
  avatarUpdatedAt: Date;
}

export class Groups extends ViewModel {
  groups: IGroup[];
  async activate() {
    this.groups = await new GetGroups().handle(this.mediator);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(GroupDeleted, (evt: GroupDeleted) => Tools.removeEl(this.groups, this.groups.asEnumerable().firstOrDefault(x => x.id == evt.id))))
    });
  }

  createNewGroup() {
    this.dialog.open({viewModel: NewGroupDialog});
  }
}

export class GetGroups extends Query<IGroup[]> {
  constructor() { super(); }
}

@handlerFor(GetGroups)
export class GetGroupsHandler extends DbQuery<GetGroups, IGroup[]> {
  async handle(request: GetGroups): Promise<IGroup[]> {
    var r = await this.context.getCustom<IGroup[]>("groups");
    return r.data;
  }
}
