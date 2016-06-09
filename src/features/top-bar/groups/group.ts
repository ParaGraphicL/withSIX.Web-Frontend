import {ViewModel, Query, DbClientQuery, handlerFor, uiCommand2} from '../../../framework';
import {IGroup} from '../../profile/groups/groups';

export class Group extends ViewModel {
  model: IGroup;
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
  image: string;
  activate(model: IGroup) {
    this.model = model;
    this.image = this.model.avatarUrl ? this.w6.url.processAssetVersion(this.model.avatarUrl, this.model.avatarUpdatedAt) : this.defaultAssetUrl;
  }
}
