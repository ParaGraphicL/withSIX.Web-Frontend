import {ViewModel, Query, DbClientQuery, handlerFor, IGame, IMenuItem, MenuItem, uiCommand2, OpenFolder, FolderType} from '../../../framework';
import {Index as SettingsIndex} from '../../settings/index';
import {LaunchGame} from '../../profile/content/game';

export class Game extends ViewModel {
  model: IGame;
  image: string;
  bgUrl: string;
  menuItems: IMenuItem[] = [];
  defaultBackUrl = this.w6.url.getAssetUrl('img/play.withSIX/games/stream-bg.jpg');
  itemStateClass = 'uptodate';
  openConfigFolder: ICommand<void>;

  activate(model: IGame) {
    this.model = model;
    let base = 'img/play.withSIX/games/' + model.slug;
    this.image = this.w6.url.getAssetUrl(`${base}/logo-overview.png`);
    this.bgUrl = this.w6.url.getAssetUrl(`${base}/headers/header.png`);
    this.subscriptions.subd(d => {
      d(this.openFolder);
      d(this.openStream);
      d(this.openLibrary);
      d(this.openSettings);
      if (this.model.slug.startsWith('Arma')) {
        d(this.openConfigFolder = uiCommand2("Open config folder", () => new OpenFolder(this.model.id, Tools.emptyGuid, FolderType.Config).handle(this.mediator), { icon: 'icon withSIX-icon-Folder' }));
      }
    })
    this.menuItems.push(new MenuItem(this.launch));
    this.menuItems.push(new MenuItem(this.openSettings));
    this.menuItems.push(new MenuItem(this.openStream));
    this.menuItems.push(new MenuItem(this.openLibrary));
    this.menuItems.push(new MenuItem(this.openFolder));
    if (this.openConfigFolder) this.menuItems.push(new MenuItem(this.openConfigFolder));
  }

  launch = uiCommand2("Launch", () => new LaunchGame(this.model.id).handle(this.mediator), { icon: "icon withSIX-icon-Hexagon-Play" });
  openFolder = uiCommand2("Open folder", () => new OpenFolder(this.model.id).handle(this.mediator), { icon: 'icon withSIX-icon-Folder' })
  openStream = uiCommand2('Stream', async () => this.navigateInternal(`/p/${this.model.slug}`), { icon: 'icon withSIX-icon-Nav-Stream' });
  openLibrary = uiCommand2('Library', async () => this.navigateInternal(`/me/library/${this.model.slug}`), { icon: 'icon withSIX-icon-Nav-Collection' });
  openSettings = uiCommand2('Settings', async () => {
    let model = { module: "games", games: { id: this.model.id } };
    this.dialog.open({ viewModel: SettingsIndex, model: model })
  }, { icon: 'icon withSIX-icon-Settings' });
}
