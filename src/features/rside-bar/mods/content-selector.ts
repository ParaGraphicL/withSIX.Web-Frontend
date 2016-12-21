import { ViewModel } from "../../../framework";

export class ContentSelector extends ViewModel {
  modParams;
  activate() {
    this.modParams = { gameSlug: this.w6.activeGame.slug, mini: true };
  }

  handleModsClick($event) { ($event.data || ($event.data = {})).ignoreClose = true; }

}