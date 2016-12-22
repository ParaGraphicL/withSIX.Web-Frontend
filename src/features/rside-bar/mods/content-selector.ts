import { ViewModel } from "../../../framework";

export class ContentSelector extends ViewModel {
  modParams;
  collectionParams;
  activate() {
    this.modParams = { gameSlug: this.w6.activeGame.slug, mini: true, itemType: "mod2" };
    this.collectionParams = { gameSlug: this.w6.activeGame.slug, mini: true, itemType: "collection2" };
  }

  handleModsClick($event) { ($event.data || ($event.data = {})).ignoreClose = true; }

}