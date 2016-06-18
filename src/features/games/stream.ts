import {ViewModel, Query, DbQuery, handlerFor, uiCommandWithLogin2, IMenuItem, MenuItem} from '../../framework';
import {CreateCollectionDialog} from './collections/create-collection-dialog';

interface IStream { contentItems: any[]; postItems: any[] }

export class Stream extends ViewModel {
  gameUrl: string;
  model: IStream;
  async activate(params) {
    this.model = await new GetStream(params.gameSlug).handle(this.mediator);
    this.gameUrl = `/p/${params.gameSlug}`;
    this.handleFooterIf(false);
    // setInterval(() => {
    //   this.model.contentItems.push(...this.model.contentItems.map(x => Object.assign({}, x)));
    //   this.model.contentItems.unshift(...this.model.contentItems.map(x => Object.assign({}, x)));
    // }, 5000);
  }

  deactivate() { super.deactivate(); this.handleFooterIf(true); }

  get item() { return this.model.postItems[0]; }
  adItem = 3;
  maxTags = 3;

  addMod = uiCommandWithLogin2("Mod", async () => this.legacyMediator.openAddModDialog(this.w6.activeGame.slug), { icon: "icon withSIX-icon-Nav-Mod" })
  addMission = uiCommandWithLogin2("Mission", async () => this.navigateInternal(this.w6.url.play + '/' + this.w6.activeGame.slug + '/missions/new'), { icon: "icon withSIX-icon-Nav-Mission" });
  addCollection = uiCommandWithLogin2("Collection", async () => this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.w6.activeGame } }), { icon: "icon withSIX-icon-Nav-Collection" })

  get firstPost() { return this.model.postItems[0] }

  addContentMenu: IMenuItem[] = [
    new MenuItem(this.addCollection),
    new MenuItem(this.addMod),
    new MenuItem(this.addMission)
  ]
}

export class GetStream extends Query<IStream> {
  constructor(public gameSlug: string, public streamType = 0) { super() }
}

@handlerFor(GetStream)
export class GetStreamHandler extends DbQuery<GetStream, IStream> {
  async handle(request: GetStream) {
    let r = await this.context.getCustom<{ contentItems: any[] }>("games/" + request.gameSlug + "/stream?streamType=" + request.streamType);
    console.log("$$$", r)
    r.contentItems.forEach(x => x.type = 'mod');
    return r;
  }
}
