import { IBasketItem, MenuItem, uiCommand2, ViewModelOf } from "../../../framework";
import { EditPlaylistItem } from "../../side-bar/actions";
import { ToggleModInServer } from "../actions";

interface IContentInServer extends IBasketItem {
  latestStableVersion: string;
}

export class Mod extends ViewModelOf<IContentInServer> {
  items;
  activate(model) {
    super.activate(model);
    this.subd((d) => {
      d(this.edit = uiCommand2("Select version", () =>
        this.dialog.open({ viewModel: EditPlaylistItem, model: this.model }),
        { icon: "withSIX-icon-X" }));
      d(this.remove = uiCommand2("Remove", () => this.request(new ToggleModInServer(this.model)),
        { icon: "withSIX-icon-Edit-Pencil" }));
    });
    this.items = [
      new MenuItem(this.edit),
      new MenuItem(this.remove),
    ];
  }
  get versionLocked() { return this.model.constraint && this.model.constraint !== this.model.latestStableVersion; };
  get displayVersion() { return this.model.constraint || this.model.latestStableVersion; }

  edit;
  remove;
}
