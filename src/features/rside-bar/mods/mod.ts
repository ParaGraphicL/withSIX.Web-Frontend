import { IBasketItem, ViewModelOf } from "../../../framework";
import { EditPlaylistItem } from "../../side-bar/actions";
import { ToggleModInServer } from "../actions";

interface IContentInServer extends IBasketItem {
  latestStableVersion: string;
}

export class Mod extends ViewModelOf<IContentInServer> {
  get versionLocked() { return this.model.constraint && this.model.constraint !== this.model.latestStableVersion; };
  get displayVersion() { return this.model.constraint || this.model.latestStableVersion; }
  edit() { return this.dialog.open({ viewModel: EditPlaylistItem, model: this.model }); }
  remove() { return this.request(new ToggleModInServer(this.model)); }
}
