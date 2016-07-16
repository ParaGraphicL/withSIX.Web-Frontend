import {inject} from 'aurelia-framework'
import {UiContext, ViewModel, Mediator, IMenuItem, MenuItem, uiCommand2, handlerFor, DbQuery, VoidCommand} from '../../../framework'
import {DeleteGroup, LeaveGroup} from './home/index';

interface IGroup {
  id: string;
  name: string;
  ownerId: string;
  avatarUrl: string;
  avatarUpdatedAt: Date;
  backgroundUrl: string;
  backgroundUpdatedAt: Date;
}

export class Group extends ViewModel {
  model: IGroup;
  shortId: string;
  slug: string;
  menu: IMenuItem[] = [];

  get avatarUrl() { return this.w6.url.processAssetVersion(this.model.avatarUrl, this.model.avatarUpdatedAt) }
  get backgroundUrl() { return this.w6.url.processAssetVersion(this.model.backgroundUrl, this.model.backgroundUpdatedAt) }

  get isAdmin() { return this.model.ownerId == this.w6.userInfo.id }

  activate(model) {
    this.model = model;
    this.shortId = model.id.toShortId();
    this.slug = model.name.sluggifyEntityName();
    this.subscriptions.subd(d => {
      d(this.deleteGroup);
      d(this.leaveGroup);
    });
    this.menu.push(new MenuItem(this.isAdmin ? this.deleteGroup : this.leaveGroup))
  }

  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }

  deleteGroup = uiCommand2("Delete", async () => {
    if (!(await this.confirm("Do you really want to delete the group?")))
      return;
    await new DeleteGroup(this.model.id).handle(this.mediator);
    this.eventBus.publish(new GroupDeleted(this.model.id));
  });

  leaveGroup = uiCommand2("Leave", async () => {
    if (!(await this.confirm("Do you really want to leave the group?")))
      return;
    await new LeaveGroup(this.model.id).handle(this.mediator);
    this.eventBus.publish(new GroupDeleted(this.model.id));
  });
}

export class GroupDeleted { constructor(public id: string) { } }
