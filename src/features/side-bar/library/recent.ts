import {
  ViewModelWithModel, VoidCommand, DbClientQuery, handlerFor, IGame, IMenuItem, MenuItem, uiCommand2,
  IGameHome
} from '../../../framework';
import { GetGameHome } from '../../profile/library/home/index';
import { IHomeD } from './library';

export class Recent extends ViewModelWithModel<IHomeD> {
  menuItems: IMenuItem[] = [];

  async activate(model: IHomeD) {
    if (this.model === model) return;
    super.activate(model);

    let home: IGameHome = { recent: [], updates: [], newContent: [], installedMissionsCount: null, installedModsCount: null };

    try {
      home = await new GetGameHome(this.w6.activeGame.id).handle(this.mediator);
    } catch (err) {
      this.tools.Debug.warn("Can't connect to client", err);
    }
    this.model.recent.length = 0;
    this.model.updates.length = 0;
    this.model.newContent.length = 0;
    home.recent.forEach(x => this.model.recent.push(x));
    home.updates.forEach(x => this.model.updates.push(x));
    home.newContent.forEach(x => this.model.newContent.push(x));

    this.model.installedMissionsCount = home.installedMissionsCount;
    this.model.installedModsCount = home.installedModsCount;
    this.model.homeLoaded = true;
    this.subd(d => {
      d(this.clearRecent = uiCommand2("Clear recent", async () => {
        await new ClearRecent(this.w6.activeGame.id).handle(this.mediator);
        //this.model.recent = [];
      }, {
          isVisibleObservable: this.observeEx(x => x.hasItems)
        }));
    });

    this.menuItems.push(new MenuItem(this.clearRecent));
  }

  clearRecent;

  get hasItems() { return this.model.recent.length > 0; }
}

class ClearRecent extends VoidCommand {
  constructor(public id: string) { super() }
}

@handlerFor(ClearRecent)
class ClearRecentHandler extends DbClientQuery<ClearRecent, void> {
  handle(request: ClearRecent) {
    return this.client.clearRecent(request.id);
  }
}
