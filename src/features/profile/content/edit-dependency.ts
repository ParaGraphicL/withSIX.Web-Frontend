import {inject, bindable} from 'aurelia-framework';
import {IDependency} from './dependency';
import {Dialog, uiCommand2} from '../../../framework';

import VersionCompare from 'version_compare';

export class EditDependency extends Dialog<IDependency> {
  constraint: string; isOptional: boolean;
  versions: any[];
  static autoUpdateStr = "autoupdate";

  activate(model: IDependency) {
    super.activate(model);
    this.isOptional = !model.isRequired;
    this.constraint = model.constraint;
    this.versions = [EditDependency.autoUpdateStr];

    if (this.model.availableVersions) this.versions = this.versions.asEnumerable().concat(this.model.availableVersions.asEnumerable().orderByDescending(x => x, this.tools.versionCompare)).toArray();
  }

  get versionSelected() { return this.constraint != EditDependency.autoUpdateStr; }

  save = uiCommand2('Save', async () => {
    this.model.constraint = this.constraint == EditDependency.autoUpdateStr ? null : this.constraint;
    this.model.isRequired = !this.isOptional;
    this.controller.ok(null);
  }, {
      cls: "ok"
    });
}

Dialog.workaround(EditDependency, "features/profile/content/edit-dependency", "EditDependency");
