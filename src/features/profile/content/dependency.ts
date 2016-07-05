import {MenuItem, UiContext, uiCommand2, ViewModel, IMenuItem, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand, IShowDependency, IDependency, ItemState} from '../../../framework';
import {inject, bindable} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {EditDependency} from './edit-dependency';
import {AddModsToCollections} from '../../games/add-mods-to-collections';

@inject(UiContext)
export class Dependency extends ViewModel {
  @bindable showingEditVersion;
  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
  addToCollections;
  url: string;

  constructor(ui: UiContext) { super(ui); }

  model: IShowDependency;
  type: string;
  activate(model: IShowDependency) {
    this.model = model;
    this.type = 'mod'; // todo; col.
    if (this.model.id) this.url = `/p/${this.w6.activeGame.slug}/${this.type}s/${this.model.id.toShortId()}/${this.model.name.sluggifyEntityName()}`;

    this.subscriptions.subd(d => {
      d(this.changeVersion);
      d(this.remove);
      if (this.model.id && this.isLoggedIn) {
        d(this.addToCollections = uiCommand2("Add to ...", async () => {
          this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [{ id: this.model.id, name: this.model.name, packageName: this.model.dependency }] } })
        }, { icon: 'withSIX-icon-Nav-Collection' }));
        this.topMenuActions.push(new MenuItem(this.addToCollections));
      }
    })
  }

  get contentState() { return this.isLocked && this.model.constraint != this.model.version ? ItemState[ItemState.UpdateAvailable].toLowerCase() : 'uptodate'; }
  get isLocked() { return this.model.constraint ? true : false; }
  get versionInfo() {
    if (!this.isLocked) return this.model.version;
    if (this.model.constraint === this.model.version) return this.model.version;
    return `${this.model.constraint}/${this.model.version}`;
  }

  changeVersion = uiCommand2("Change version", async () => this.dialog.open({ viewModel: EditDependency, model: this.model }), { icon: "icon withSIX-icon-Edit-Pencil" })
  remove = uiCommand2("Remove", async () => this.eventBus.publish(new RemoveDependencyEvent(this.model)), { icon: "icon withSIX-icon-Square-X" })

  topMenuActions: IMenuItem[] = [
    new MenuItem(this.changeVersion),
    new MenuItem(this.remove)
  ]

  //get image() { return this.model.image || this.defaultAssetUrl; }
}

export class RemoveDependencyEvent {
  constructor(public model: IDependency) { }
}

// export class DependencyChangedEvent {
//   constructor(public model: IDependency) {}
// }
