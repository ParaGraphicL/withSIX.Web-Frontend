import {ContentViewModel} from './base';
import {IMod, uiCommand2, MenuItem} from '../../../framework';
import {AddModsToCollections} from '../../games/add-mods-to-collections';

export class Mod extends ContentViewModel<IMod> {
  icon = "withSIX-icon-Nav-Mod";
  addToCollections;
  changelog() {
    alert("TODO");
  }

  get basketableText() { return this.isInBasket ? "Remove from Playlist" : "Add to Playlist" }
  get basketableIcon() { return this.isInBasket ? "withSIX-icon-X" : "withSIX-icon-Add" }

  setupMenuItems() {
    super.setupMenuItems();
    this.subscriptions.subd(d => {
      this.topActions.push(new MenuItem(this.addToBasket, { name: "", icon: "content-basketable-icon", textCls: "content-basketable-text", cls: "content-basketable-button" }))
      this.topMenuActions.push(new MenuItem(this.addToBasket));
      d(this.observeEx(x => x.isInBasket).subscribe(x => { this.addToBasket.name = this.basketableText; this.addToBasket.icon = this.basketableIcon }));

      if (this.isLoggedIn) {
        d(this.addToCollections = uiCommand2("Add to ...", async () => this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [this.model] } }), { icon: 'withSIX-icon-Nav-Collection' }));
        this.topMenuActions.push(new MenuItem(this.addToCollections));
      }
    });
  }
}
