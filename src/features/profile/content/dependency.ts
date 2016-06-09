import {MenuItem, UiContext, uiCommand2, ViewModel, IMenuItem, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand} from '../../../framework';
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

  constructor(ui: UiContext) { super(ui); }

  model: IShowDependency;
  activate(model: IShowDependency) {
    this.model = model;
    this.subscriptions.subd(d => {
      d(this.changeVersion);
      d(this.remove);
      if (this.model.id && this.w6.userInfo.id)
        d(this.addToCollections = uiCommand2("Add to ...", async () => {
          this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [{ id: this.model.id, name: this.model.name, packageName: this.model.dependency }] } })
        }, { icon: 'withSIX-icon-Nav-Collection' }));
    })
    if (this.model.id) this.topMenuActions.push(new MenuItem(this.addToCollections));
  }

  get isLocked() { return this.model.constraint ? true : false; }

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

export interface IDependency {
  dependency: string;
  id?: string;
  constraint?: string;
  isRequired?: boolean;
  type: string;
  availableVersions?: string[];
}

export interface IShowDependency extends IDependency {
  name?: string;
  image?: string;
  newlyAdded?: boolean;
  gameId: string;
  //avatarUpdatedAt?: Date;
}
