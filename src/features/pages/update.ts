import { Base, uiCommand2, VoidCommand, DbClientQuery, handlerFor, UpdateState } from '../../framework';
import { MainBase } from './index';

import {GetMiniChangelogQuery, GetBlogsQuery} from '../../legacy/main';

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
      .then(x => this.model.blogPosts = x.slice(0, 4));
  }

  get hasUpdates() { return this.updateState === UpdateState.UpdateAvailable; }
  get isProcessingUpdates() { return this.updateState === UpdateState.UpdateDownloading || this.updateState === UpdateState.Updating }
  get isUptodate() { return this.updateState < UpdateState.UpdateAvailable; }
  get updateState() { return this.clientInfo && this.clientInfo.updateState; }
  get clientInfo() { return this.w6.miniClient.clientInfo; }
  get isConnected() { return this.w6.miniClient.isConnected; }

  get updateMessage() {
    if (!this.isConnected) {
      if (this.model.updated) return "Waiting for client restart.."
      else return "No Client detected"
    }
    if (this.isUptodate) return "Your client is uptodate!"
    if (this.updateState === UpdateState.UpdateDownloading) return "Downloading update"
    if (this.updateState === UpdateState.Updating) return "Installing update" 
    if (this.hasUpdates) return `Update Sync withSIX to ${this.clientInfo.newVersionAvailable}`
    return ''
  }

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
      canExecuteObservable: this.whenAnyValue(x => x.hasUpdates)
        .combineLatest(this.whenAnyValue(x => x.isConnected),
          (hasUpdates, isConnected) => hasUpdates && isConnected)
    })
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
