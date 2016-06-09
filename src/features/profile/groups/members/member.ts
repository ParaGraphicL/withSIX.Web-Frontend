import {UiContext, ViewModel, Mediator, DbQuery, VoidCommand, handlerFor, IMenuItem, MenuItem, uiCommand2} from '../../../../framework'
import {IGroupMember} from './index';

export class Member extends ViewModel {
  isAdmin: boolean;
  avatarUrl: string;
  menu: IMenuItem[] = [];
  model: IGroupMember;
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
  removeMember;

  get isOwner() { return this.model.id == this.model.group.ownerId; }
  get canRemove() { return this.isAdmin && !this.isOwner; }

  activate(model: IGroupMember) {
    this.model = model;
    this.isAdmin = this.w6.userInfo.id == this.model.group.ownerId;
    this.avatarUrl = this.w6.url.calculateAvatarUrl(this.model);
    if (this.canRemove) {
      this.menu.push(new MenuItem(this.removeMember = uiCommand2("Remove", async () => {
        await new RemoveMember(this.model.group.id, this.model.id).handle(this.mediator);
        this.eventBus.publish(new GroupMemberRemoved(this.model.id));
      }, { isVisibleObservable: this.observeEx(x => x.canRemove) })));
      this.subscriptions.subd(d => d(this.removeMember));
    }
  }
}

export class GroupMemberRemoved { constructor(public id: string) { } }

export class RemoveMember extends VoidCommand { constructor(public id: string, public userId: string) { super() } }

@handlerFor(RemoveMember)
export class RemoveMemberHandler extends DbQuery<RemoveMember, void> {
  async handle(request: RemoveMember): Promise<void> {
    await this.context.deleteCustom<void>("groups/" + request.id + "/members/" + request.userId);
  }
}
