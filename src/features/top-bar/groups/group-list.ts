//import {GetGames, IGamesData} from '../../profile/library/games';
import {ViewModel} from '../../../framework';
import {GetGroups, IGroup} from '../../profile/groups/groups';

export class GroupList extends ViewModel {
  groups: IGroup[];
  async activate() {
    this.groups = await new GetGroups().handle(this.mediator);
  }
}
