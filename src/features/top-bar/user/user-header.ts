import {ViewModel} from '../../../framework';

export class UserHeader extends ViewModel {
  get avatarUrl() {
    let i = this.w6.userInfo;
    // dummy calls so that we refresh when this info updates
    let p = i.avatarURL;
    let d = i.avatarUpdatedAt;
    return i.getAvatarUrl(48);
  }
}
