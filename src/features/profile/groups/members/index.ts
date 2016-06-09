import {UiContext,ViewModel, Mediator, DbQuery, Query, VoidCommand, handlerFor, IFindModel, FindModel, Debouncer} from '../../../../framework'
import {GroupMemberRemoved} from './member';

interface IGroup {
  id: string;
  members: IGroupMember[];
  ownerId: string;
}

export interface IGroupMember extends IAvatarInfo {
  id: string;
  userName: string;
  group: { id: string; ownerId: string }
}

interface IUser {
  id: string;
  userName: string;
}

export class Index extends ViewModel {
  group: IGroup;
  addUserModel: IFindModel<IUser>
  get isAdmin() { return this.w6.userInfo.id == this.group.ownerId; }
  headerName = "Members";

  async activate(params, routeConfig) {
    await this.refreshGroup(Tools.fromShortId(params.id));

    var debouncer = Debouncer.debouncePromise<IUser[]>(async (q: string) => {
      if (!q || q.length < 2) return [];
      var data = await new UserSearchQuery(q).handle(this.mediator)
      return data;
    }, 250);
    this.subscriptions.subd(d => {
      d(this.addUserModel = new FindModel(q => debouncer(q), this.addMember, i => i.userName));
      d(this.eventBus.subscribe(GroupMemberRemoved, (evt: GroupMemberRemoved) => Tools.removeEl(this.group.members, this.group.members.asEnumerable().firstOrDefault(x => x.id == evt.id))))
    });
  }

  addMember = async (selUser: IUser) => {
   let user = selUser || this.addUserModel.selectedItem; // hmm?
   await new AddMember(this.group.id, user.id).handle(this.mediator);
   await this.refreshGroup(this.group.id);
 }

 async refreshGroup(id: string) {
   this.group = await new GetGroupMembers(id).handle(this.mediator);
   this.group.id = id;
 }
}

export class UserSearchQuery extends Query<IUser[]> { constructor(public q: string) { super() } }

@handlerFor(UserSearchQuery)
export class UserSearchQueryHandler extends DbQuery<UserSearchQuery, IUser[]> {
  async handle(request: UserSearchQuery): Promise<IUser[]> {
    var r = await this.context.getCustom<{items: IUser[]}>("user/search?userName=" + request.q);
    return r.data.items;
  }
}

export class GetGroupMembers extends Query<IGroup> { constructor(public id: string) { super(); } }

@handlerFor(GetGroupMembers)
export class GetGroupMembersHandler extends DbQuery<GetGroupMembers, IGroup> {
  async handle(request: GetGroupMembers): Promise<IGroup> {
    let r = await this.context.getCustom<IGroup>("groups/" + request.id + '/members');
    let group = r.data;
    let groupInfo = {id: request.id, ownerId: group.ownerId};
    group.members.forEach(x => {
      x.group = groupInfo;
    });
    return group;
  }
}

export class AddMember extends VoidCommand { constructor(public id: string, public userId: string) { super() } }

@handlerFor(AddMember)
export class AddMemberHandler extends DbQuery<AddMember, void> {
  async handle(request: AddMember): Promise<void> {
    await this.context.postCustom<void>("groups/" + request.id + "/members/" + request.userId);
  }
}
