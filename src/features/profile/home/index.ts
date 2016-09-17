import {
  UiContext, ViewModel, uiCommand2, Query, DbQuery, DbClientQuery, handlerFor, IContent, TypeScope, IGame,
  IContentStatusChange, IContentStateChange, ItemState, IContentState,
  InstallContents, ContentDeleted, GameChanged, IBreezeMod, breeze
} from "../../../framework";
import { GetGames } from "../library/games";
import { inject } from "aurelia-framework";

@inject(UiContext)
export class Index extends ViewModel {
  heading = "home";
  clientEnabled: boolean;
  model: IHomeData;

  updateAll = uiCommand2("Update all", async () => {
    const commands = Array.from(this.model.updates.values()).asEnumerable()
      .groupBy(x => x.gameId, x => x.id,
        (key, elements) => new InstallContents(key, elements.map(x => { return { id: x }; }), { text: "Available updates" }, true))
      .toArray();
    for (let c of commands) { await c.handle(this.mediator); }
  }, { cls: "warn", icon: "withSIX-icon-Hexagon-Upload2" });

  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    try {
      this.model = await new GetHome().handle(this.mediator);
      this.clientEnabled = true;
    } catch (err) {
      this.tools.Debug.warn("Error trying to fetch overall home", err);
      this.clientEnabled = false;
      try {
        let x = await new GetGames().handle(this.mediator);
        this.model = <IHomeData> { games: x.games.toMap(x => x.id) };
      } catch (err) {
        this.tools.Debug.warn("Error trying to fetch games", err);
      }
    }
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
      d(this.eventBus.subscribe("content.contentInstalled", this.handleContentInstalled));
      d(this.eventBus.subscribe("content.recentItemRemoved", (args: string) => {
        this.model.recent.delete(args);
        [this.model.newContent.get(args), this.model.updates.get(args)]
          .filter(x => x != null)
          .forEach(x => x.lastUsed = null);
      }));
      d(this.eventBus.subscribe("content.recentItemUsed", (gameId, id, usedAt) => {
        if (!this.model.recent.has(id)) { return; }
        const c = this.model.recent.get(id);
        c.lastUsed = usedAt;
      }));
      d(this.eventBus.subscribe("content.recentItemAdded",
        (evt, gameId, recentContent) => this.model.recent.set(recentContent.id, recentContent)));
      d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
      d(this.eventBus.subscribe("status.contentStatusChanged", this.handleContentStatusChanged));
    });
  }

  contentDeleted = (evt: ContentDeleted) => {
    this.model.newContent.delete(evt.id);
    this.model.updates.delete(evt.id);
    this.model.recent.delete(evt.id);
  }

  handleContentStatusChanged = (stateChange: IContentStatusChange) => this.handleStateChange(stateChange);
  handleContentStateChanged = (stateChange: IContentStateChange) =>
    angular.forEach(stateChange.states, state => this.handleStateChange(state));
  handleContentInstalled = (evt, gameId, installedContent) => this.model.newContent.set(installedContent.id, installedContent)

  handleStateChange(state: IContentState) {
    if (state.state === ItemState.NotInstalled) {
      this.model.newContent.delete(state.id);
      this.model.updates.delete(state.id);
    } else if (state.state === ItemState.Uptodate) {
      this.model.updates.delete(state.id);
    }
  }
}

interface IHomeData {
  updates: Map<string, IContent>;
  newContent: Map<string, IContent>;
  recent: Map<string, IContent>;
  games: Map<string, IGame>;
}
class GetHome extends Query<IHomeData> { }

@handlerFor(GetHome)
class GetHomeHandler extends DbClientQuery<GetHome, IHomeData> {
  public async handle(request: GetHome): Promise<IHomeData> {
    const home: {
      updates: IContent[];
      newContent: IContent[];
      recent: IContent[];
      games: IGame[];
    } = await this.client.getHome();

    // TODO: Collections
    await this.handleModAugments(home.newContent.concat(home.recent).concat(home.updates));

    return {
      games: home.games.toMap(x => x.id),
      newContent: this.tools.enumToMap(home.newContent.asEnumerable().orderByDescending(x => x.lastInstalled || ""), x => x.id),
      recent: this.tools.enumToMap(home.recent.asEnumerable().orderByDescending(x => x.lastUsed || ""), x => x.id),
      updates: this.tools.enumToMap(home.updates.asEnumerable().orderByDescending(x => x.updatedVersion || ""), x => x.id),
    };
  }
}
