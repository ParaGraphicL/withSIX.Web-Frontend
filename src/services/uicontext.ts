import {Base} from './base';
import {Mediator, LegacyMediator} from './mediator';
import {Toastr} from './toastr';
import {ListFactory, ObservableEventAggregator, EventWrapper} from './reactive';
import {ITabNotification} from '../resources/tab-view/tab-view';

import {Client} from 'withsix-sync-api';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

import {Api, Notifier, CloseDialogs} from './api';
import {ClientWrapper, AppEventsWrapper} from './client-wrapper';

import {MessageDialog} from '../features/message-dialog'

@inject(W6)
class FeatureToggles {
  constructor(private w6: W6) { }

  private isManager = this.w6.userInfo.isManager || this.w6.userInfo.isAdmin;
  private syncFeatures = !this.w6.isClient;
  private testEnvironment = Tk.getEnvironment() != Tk.Environment.Production;

  groups = this.isManager;
  loggedIn = this.w6.userInfo.id != null;
  notifications = this.isManager;
  library = this.syncFeatures;
}

@inject(W6)
export class Assets {
  constructor(private w6: W6) { }
  defaultAssetUrl = this.w6.url.getAssetUrl("img/noimage.png");
  defaultBackUrl = this.w6.url.getAssetUrl('img/play.withSIX/games/stream-bg.jpg');
  defaultPlaylistUrl = this.w6.url.getAssetUrl("img/play.withSIX/placeholders/Playlist-placeholder.png");
}

@inject(Mediator, EventAggregator, LegacyMediator, Toastr, W6, ListFactory, DialogService, Validation, Router, Api, Notifier, ClientWrapper, AppEventsWrapper, FeatureToggles, Assets)
export class UiContext {
  constructor(public mediator: Mediator, public eventBus: EventAggregator, public legacyMediator: LegacyMediator, public toastr: Toastr, public w6: W6, public listFactory: ListFactory, public dialog: DialogService, public validator: Validation, public router: Router, public api: Api, public notifier: Notifier, public clientWrapper: ClientWrapper, public appEvents: AppEventsWrapper, public features: FeatureToggles, public assets: Assets) { }

  navigateInternal(url: string) {
    let origin = location.origin;
    if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    else if (url.startsWith("http://") && origin.startsWith("https://")) {
      origin = origin.replace("https://", "http://");
      if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    } else if (url.startsWith("https://") && origin.startsWith("http://")) {
      origin = origin.replace("http://", "https://");
      if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    }
    return this.router.navigate(url);
  }

  showMessageDialog = (message: string, title = 'Please confirm', buttons = MessageDialog.Ok): DialogResult => this.dialog.open({ viewModel: MessageDialog, model: { title, message, buttons } })
  confirm = async (message: string, title = 'Please confirm'): Promise<boolean> => (await this.showMessageDialog(message, title, MessageDialog.YesNo)).output == "yes";
}
