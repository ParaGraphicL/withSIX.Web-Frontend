import { inject } from 'aurelia-framework';
import { Query, DbClientQuery, handlerFor, ISort, IContent, IMissionsData, IMission, TypeScope, ContentDeleted } from '../../../../framework';
import { BaseGame } from '../../lib';

export class Index extends BaseGame {
  heading = "Missions"
  gameName: string;
  sort: ISort<IContent>[] = [{ name: "name" }, { name: "packageName" }]
  searchFields = ["name", "packageName"];

  activate(params, routeConfig) {
    super.activate(params, routeConfig);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
    })
    // TODO
    return new GetMissions(this.game.id).handle(this.mediator)
      .then(x => this.items = x.items);
  }

  createNew() { this.navigateInternal(`${this.w6.url.play}/${this.game.slug}/missions/new`); }

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      var item = list.asEnumerable().firstOrDefault(x => x.id == id);
      if (item) this.tools.removeEl(list, item);
    }
    deleteIfHas(this.items, evt.id);
  }
}

class GetMissions extends Query<IMissionsData> {
  constructor(public id: string) { super() }
}

@handlerFor(GetMissions)
class GetMissionsHandler extends DbClientQuery<GetMissions, IMissionsData> {
  // TODO: Merge all data from client, and web queries etc... :S
  public async handle(request: GetMissions): Promise<IMissionsData> {
    try {
      let r = await this.client.getGameMissions(request)
      return <any>r;
    } catch (err) {
      this.tools.Debug.warn("Error while trying to get collections from client", err);
      return <any>{ items: [], pageNumber: 1, total: 0, pageSize: 24 };
    }
  }
}
