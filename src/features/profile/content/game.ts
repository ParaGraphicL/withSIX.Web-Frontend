import {MenuItem, ViewModel, uiCommand2, OpenFolder, ItemState, IMenuItem} from '../../../framework';
import {Query, DbClientQuery, handlerFor, VoidCommand, IGame, FolderType} from '../../../framework';
import {Index as SettingsIndex} from '../../settings/index';

export class Game extends ViewModel {
  image: string;
  bgUrl: string;
  url: string;
  public model: IGame;
  icon = "withSIX-icon-Joystick";
  get itemStateClass() { return this.isInstalled ? 'uptodate' : 'notinstalled' };
  openConfigFolder: ICommand<void>;

  hasStats: boolean;

  get isInstalled() { return (<any>this).model.state == ItemState.Uptodate }

  activate(model: IGame) {
    this.model = model;
    this.hasStats = (<any>model).collectionsCount != null;
    let isInstalledObservable = this.observeEx(x => x.isInstalled);
    this.subscriptions.subd(d => {
      d(this.launch = uiCommand2("Launch", () => new LaunchGame(this.model.id).handle(this.mediator), { icon: "icon withSIX-icon-Hexagon-Play", isVisibleObservable: isInstalledObservable }));
      d(this.openFolder = uiCommand2("Open folder", () => new OpenFolder(this.model.id).handle(this.mediator), { icon: 'icon withSIX-icon-Folder', isVisibleObservable: isInstalledObservable }));
      if (this.model.slug.startsWith('Arma'))
        d(this.openConfigFolder = uiCommand2("Open config folder", () => new OpenFolder(this.model.id, this.tools.emptyGuid, FolderType.Config).handle(this.mediator), { icon: 'icon withSIX-icon-Folder', isVisibleObservable: isInstalledObservable }));
    })
    let base = 'img/play.withSIX/games/' + model.slug;
    this.image = this.w6.url.getAssetUrl(`${base}/logo-overview.png`);
    this.bgUrl = this.w6.url.getAssetUrl(`${base}/headers/header.png`);
    this.url = window.location.pathname == '/p' || window.location.pathname.startsWith("/p/") ? `/p/${model.slug}` : `/me/library/${model.slug}`

    this.bottomActions = [
      new MenuItem(this.launch)
    ]

    this.topMenuActions = [
      new MenuItem(this.launch),
      new MenuItem(this.openStream),
      new MenuItem(this.openLibrary),
      new MenuItem(this.openSettings),
      new MenuItem(this.openFolder)
    ]
    if (this.openConfigFolder) this.topMenuActions.push(new MenuItem(this.openConfigFolder));
  }

  launch: ICommand<void>;
  openFolder: ICommand<void>;
  openStream = uiCommand2('Stream', async () => this.navigateInternal(`/p/${this.model.slug}`), { icon: 'icon withSIX-icon-Nav-Stream' });
  openLibrary = uiCommand2('Library', async () => this.navigateInternal(`/me/library/${this.model.slug}`), { icon: 'icon withSIX-icon-Nav-Collection' });
  openSettings = uiCommand2('Settings', async () => {
    let model = { module: "games", games: { id: this.model.id } };
    this.dialog.open({ viewModel: SettingsIndex, model: model })
  }, { icon: 'icon withSIX-icon-Settings' });

  bottomActions: IMenuItem[];
  topMenuActions: IMenuItem[];
}

export enum LaunchType {
  Default
}

export class LaunchGame extends VoidCommand {
  constructor(public id: string, public launchType: LaunchType = LaunchType.Default) { super(); }
}

@handlerFor(LaunchGame)
class LaunchGameHandler extends DbClientQuery<LaunchGame, void> {
  public handle(request: LaunchGame): Promise<void> {
    return this.client.launchGame({ id: request.id, launchType: request.launchType });
  }
}
