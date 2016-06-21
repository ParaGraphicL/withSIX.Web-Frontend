import {ViewModelOf, Command, DbQuery, handlerFor, uiCommand2, MenuItem, IMenuItem} from '../../../../framework'
import {AddModsToCollections} from '../../../games/add-mods-to-collections';

export interface IMod {
  id: string;
  name: string;
  packageName: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  groupId: string;
  avatar?: string;
  avatarUpdatedAt?: Date;
}

export class Mod extends ViewModelOf<IMod> {
  url: string;
  avatarUrl: string;
  addToCollections;
  menuItems: IMenuItem[] = [];
  activate(model: IMod) {
    super.activate(model);
    this.url = `/p/${model.gameSlug}/mods/${model.id.toShortId()}/${model.name.sluggifyEntityName()}`;
    this.avatarUrl = this.w6.url.getUsercontentUrl2(model.avatar, model.avatarUpdatedAt);
    this.subscriptions.subd(d => {
      // TODO: This should only be here if group admin instead?
      if (this.isLoggedIn)
        d(this.addToCollections = uiCommand2("Add to ...", async () => this.dialog.open({ viewModel: AddModsToCollections, model: { gameId: this.model.gameId, mods: [{ id: this.model.id, name: this.model.name, packageName: this.model.packageName, groupId: this.model.groupId }] } }), { icon: 'withSIX-icon-Nav-Collection' }));


    });
    if (this.isLoggedIn)
      this.menuItems.push(new MenuItem(this.addToCollections));
  }

  get defaultAssetUrl() { return this.assets.defaultAssetUrl }
  get defaultBackUrl() { return this.assets.defaultBackUrl }
}
