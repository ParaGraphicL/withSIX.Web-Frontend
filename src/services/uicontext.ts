import {ReactiveBase} from './base';
import {Mediator, LegacyMediator} from './mediator';
import {W6} from './withSIX';
import {Tools} from './tools';
import {Toastr} from './toastr';
import {ListFactory, ObservableEventAggregator, EventWrapper} from './reactive';

import {Client} from 'withsix-sync-api';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController, DialogResult} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

import {Api, Notifier, CloseDialogs, ITabNotification} from './api';
import {ClientWrapper, AppEventsWrapper} from './client-wrapper';

import {MessageDialog} from '../features/message-dialog'

export {MessageDialog, Confirmation}

@inject(W6)
class FeatureToggles extends ReactiveBase {
  constructor(private w6: W6) { super() }

  private isManager = this.w6.userInfo.isManager || this.w6.userInfo.isAdmin;
  private syncFeatures = !this.w6.isClient;
  private isTestEnvironment = this.tools.getEnvironment() != this.tools.Environment.Production;
  private testingFlag = window.location.search.includes('testmode=1');
  private groupTestingFlag = window.location.search.includes('testgroupmode=1') || (!window.location.search.includes('testgroupmode=0') && this.isManager);
  private get clientInfo() { return this.w6.miniClient.clientInfo }
  private get isPrereleaseClient() { return this.clientInfo && this.clientInfo.version.includes('-') }
  loggedIn = this.w6.userInfo.id != null;

  get managerFeatures() { return this.w6.userInfo.isManager || this.adminFeatures }
  get adminFeatures() { return this.w6.userInfo.isAdmin }
  get clientAutostart() { return !this.isTestEnvironment }
  get servers() { return this.isTestEnvironment }
  get groups() { return this.groupTestingFlag }
  get notifications() { return this.isManager }
  get library() { return this.syncFeatures }
  get quickActions() { return this.isTestEnvironment }
  get uiVirtualization() { return this.testingFlag }
  get collectionsInCollections() { return this.isTestEnvironment }
  get beta1_3() { return this.isPrereleaseClient }
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

  confirm = async (message: string, title = 'Please confirm'): Promise<boolean> => (await this.showMessageDialog(message, title, MessageDialog.YesNo)).output == "yes";
  showMessageDialog = <T>(message: string, title = 'Please confirm', buttons = MessageDialog.Ok, confirmations: Confirmation[] = null): Promise<DialogResultT<string>> => this.showMessageDialogInternal({ title, message, buttons, confirmations })
  showMessageDialogInternal = <T>(model: MessageModel) => this.dialog.open({ viewModel: MessageDialog, model: model })
  navigateInternal = (url: string) => {
    let origin = location.origin;
    if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    else if (url.startsWith("http://") && origin.startsWith("https://")) {
      origin = origin.replace("https://", "http://");
      if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    } else if (url.startsWith("https://") && origin.startsWith("http://")) {
      origin = origin.replace("http://", "https://");
      if (url.startsWith(origin + '/')) url = url.substring(origin.length);
    }
    Tools.Debug.log("$$$ navigating", url);
    return this.router.navigate(url);
  }
  public notifyAngularInternal = () => {
    Tools.Debug.log("$$$ Notifying Angular!");
    let scope = angular.element(document).scope()
    if (!scope) return;
    scope.$apply()
  }
}

interface Confirmation { text: string, hint?: string, icon?: string, isChecked?: boolean }

interface MessageModel {
  title: string, message: string, buttons: string[]; //showRemember?: boolean;
  confirmations?: Confirmation[]
}

interface DialogResultT<T> extends DialogResult {
  output: T;
}
