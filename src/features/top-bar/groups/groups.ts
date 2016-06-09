import {ViewModelWithModel, Query, DbClientQuery, handlerFor,uiCommand2, ITab} from '../../../framework';
import {NewGroupDialog} from '../../profile/groups/new-group-dialog';

export class Groups extends ViewModelWithModel<ITab> {
  async activate(model: ITab) {
    super.activate(model);
  }

  createGroup = uiCommand2("Create new group", async () => this.dialog.open({viewModel: NewGroupDialog}), {cls: "naked-button default"})
}
