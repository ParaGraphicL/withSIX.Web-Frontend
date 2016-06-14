import {ViewModel, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem} from '../../framework';
import {CreateCollectionDialog} from './collections/create-collection-dialog';

export class Stream extends ViewModel {
  gameUrl: string;
  model;
  async activate() {
    this.model = await new GetStream(this.w6.activeGame.slug).handle(this.mediator);
    this.gameUrl = `/p/${this.w6.activeGame.slug}`;
    this.handleAngularHeader();
  }

  deactivate() {
    super.deactivate();
    this.reverseAngularHeader();
  }

  get item() { return this.model.postItems[0]; }
  adItem = 3;
  maxTags = 3;

  addMod = uiCommandWithLogin2("Mod", async () => this.legacyMediator.openAddModDialog(this.w6.activeGame.slug), { icon: "icon withSIX-icon-Nav-Mod" })
  addMission = uiCommandWithLogin2("Mission", async () => this.navigateInternal(this.w6.url.play + '/' + this.w6.activeGame.slug + '/missions/new'), { icon: "icon withSIX-icon-Nav-Mission" });
  addCollection = uiCommandWithLogin2("Collection", async () => this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.w6.activeGame } }), { icon: "icon withSIX-icon-Nav-Collection" })

  addContentMenu: IMenuItem[] = [
    new MenuItem(this.addCollection),
    new MenuItem(this.addMod),
    new MenuItem(this.addMission)
  ]
}

export class GetStream extends Query<{}> {
  constructor(public gameSlug: string, public streamType = 0) { super() }
}

@handlerFor(GetStream)
export class GetStreamHandler extends DbQuery<GetStream, {}> {
  handle(request: GetStream) {
    return this.context.getCustom("games/" + request.gameSlug + "/stream?streamType=" + request.streamType)
      .then(result => result.data)
  }
}
