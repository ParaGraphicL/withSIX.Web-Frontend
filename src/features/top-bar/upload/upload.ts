import {ViewModelWithModel, UiContext, MenuItem, uiCommandWithLogin2, uiCommand2, Debouncer, IMenuItem, ITab, Client} from '../../../framework';
import {CreateCollectionDialog} from '../../games/collections/create-collection-dialog';
import {inject} from 'aurelia-framework';

@inject(UiContext, Client)
export class Upload extends ViewModelWithModel<ITab> {
  uploadMenu: IMenuItem[] = [];
  constructor(ui, private client: Client) { super(ui); }
  activate(model) {
    super.activate(model);
    this.uploadMenu.push(new MenuItem(this.uploadMod));
    this.uploadMenu.push(new MenuItem(this.uploadMission));
    this.uploadMenu.push(new MenuItem(this.createCollection));
  }

  get gameSupportsMissions() { return this.w6.activeGame.id != "be87e190-6fa4-4c96-b604-0d9b08165cc5" }

  uploadMod = uiCommandWithLogin2("New Mod", () => this.legacyMediator.openAddModDialog(this.w6.activeGame.slug), {
    icon: "icon withSIX-icon-Nav-Mod-Add"
  });
  uploadMission = uiCommandWithLogin2("New Mission", async () => this.navigateInternal(`/p/${this.w6.activeGame.slug}/missions/new`), {
    isVisibleObservable: this.observeEx(x => x.gameSupportsMissions),
    icon: "icon withSIX-icon-Nav-Mission-Add"
  });
  createCollection = uiCommandWithLogin2("New Collection", () => this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.w6.activeGame } }), {
    icon: "icon withSIX-icon-Nav-Collection-Add"
  });

  updateContent = uiCommand2("Update content", async () => this.navigateInternal('/me/content/mods'), { cls: "naked-button default" });
}
