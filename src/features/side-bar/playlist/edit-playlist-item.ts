import {inject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {breeze, IBasketItem, ModsHelper, IBreezeMod, Base, uiCommand2, Dialog, Query, DbQuery, handlerFor, Mediator, ProcessingState} from '../../../framework';
import VersionCompare from 'version_compare';

export class EditPlaylistItem extends Dialog<IBasketItem> {
  constraint: string;
  versions: string[];
  static autoUpdateStr = "autoupdate";

  async activate(model: IBasketItem) {
    super.activate(model);
    this.constraint = model.constraint || EditPlaylistItem.autoUpdateStr;
    var data = await new GetAvailableVersions(this.model.id).handle(this.mediator);
    this.versions = data.versions;
  }

  save = uiCommand2('Save', async () => {
    this.model.constraint = this.constraint == EditPlaylistItem.autoUpdateStr ? null : this.constraint;
    this.controller.ok(null);
  }, {
      cls: "ok"
    });

  get versionSelected() { return this.constraint != EditPlaylistItem.autoUpdateStr; }
}

interface IAvailableVersions {
  versions: any[];
}

class GetAvailableVersions extends Query<IAvailableVersions> {
  constructor(public id: string) { super(); }
}


@handlerFor(GetAvailableVersions)
class GetAvailableVersionsHandler extends DbQuery<GetAvailableVersions, IAvailableVersions> {
  async handle(request: GetAvailableVersions): Promise<IAvailableVersions> {
    let query = breeze.EntityQuery.from("Mods")
      .where("id", breeze.FilterQueryOp.Equals, request.id)
      .expand('updates')
      .select('updates');
    let versions = [EditPlaylistItem.autoUpdateStr];
    try {
      let data = await this.context.executeQuery<IBreezeMod>(query)
      let updates = data.results[0].updates;
      versions = versions.concat(updates
        .filter(x => x.currentState == ProcessingState[ProcessingState.Finished])
        .asEnumerable()
        .orderByDescending(x => x, ModsHelper.versionCompare)
        .toArray()
        .map(x => ModsHelper.getFullVersion(x)));
    } catch (err) {
      this.tools.Debug.warn("failure to retrieve versions for mod ", request.id, err);
    }
    return { versions: versions }
  }
}
