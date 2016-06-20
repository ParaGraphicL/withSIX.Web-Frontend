import {Base, uiCommand2, VoidCommand, DbClientQuery, handlerFor} from '../../framework';
import {MainBase} from './index';

import {Main} from '../../legacy/app';

import GetMiniChangelogQuery = Main.Changelog.GetMiniChangelogQuery;
import GetBlogsQuery = Main.Blog.GetBlogsQuery;

export class Update extends MainBase {
  changelog: string;
  blogUrl: string;
  model = {
    isUptodate: false,
    blogPosts: [],
    isUpdating: false,
    updated: false
  }

  async activate() {
    this.changelog = await this.legacyMediator.legacyRequest<string>(GetMiniChangelogQuery.$name);
    this.blogUrl = this.w6.url.main + '/blog';

    this.subscriptions.subd(d => {
      d(Base.observeEx(this.w6.miniClient, x => x.isConnected).subscribe(newV => this.model.updated = false));
    });

    this.legacyMediator.legacyRequest<any[]>(GetBlogsQuery.$name, { team: false })
      .then(x => this.model.blogPosts = x.asEnumerable().take(4).toArray());
  }

  get clientInfo() { return this.w6.miniClient.clientInfo; }
  get updateState() { return this.clientInfo && <UpdateState>(<any>this.w6.miniClient.clientInfo).updateState; }
  get hasUpdates() { return this.updateState == 2; }
  get isUptodate() { return this.updateState < 2; }
  get isConnected() { return this.w6.miniClient.isConnected; }

  updateClient = uiCommand2("Update", async () => {
    this.model.isUpdating = true;
    this.model.updated = false;
    try {
      await new UpdateClient().handle(this.mediator);
      this.model.updated = true;
      this.model.isUptodate = true;
    } finally {
      this.model.isUpdating = false;
    }
  }, {
      canExecuteObservable: this.observeEx(x => x.hasUpdates).combineLatest(this.observeEx(x => x.isConnected), (hasUpdates, isConnected) => hasUpdates && isConnected)
    })
}

export enum UpdateState {
  Uptodate, // 0
  UpdateInstalled, // 1
  UpdateAvailable, // 2
  UpdateDownloading, // 3
  Updating // 4
}

class UpdateClient extends VoidCommand {
  static action = "Update Client";
}

@handlerFor(UpdateClient)
class UpdateClientHandler extends DbClientQuery<UpdateClient, void> {
  async handle(request: UpdateClient) {
    try {
      await this.client.updateMiniClient();
    } catch (err) {
      this.tools.Debug.error(err);
    }
  }
}
