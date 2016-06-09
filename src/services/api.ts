import {Base, LS} from './base';
import {Mediator, LegacyMediator} from './mediator';
import {Toastr} from './toastr';
import {ListFactory} from './reactive';
import {ITabNotification} from '../resources/tab-view/tab-view';

import {Client} from 'withsix-sync-api';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

export class CloseDropdowns { }
export class CloseDialogs { }

@inject(Client, EventAggregator, LS)
export class Api {
  constructor(private client: Client, private eventBus: EventAggregator, private ls: LS) {
    // we could use debounce here, but then the menus don't close on the initiation of the scroll, but rather on the stop.
    // so throttle seems the better option
    this.subj.throttle(1000).subscribe(x => this.eventBus.publish(new CloseDropdowns()));
  }
  subj = new Rx.Subject();
  showOpenDialog(options: { defaultPath?: string, properties?}) { return this.client.hubs.client.browseFolderDialog(options); }
  closeDropdowns = () => this.subj.onNext(null);
  refreshPlaylist = () => this.ls.set('w6.event', { name: 'refresh-playlist' });
}

export class ShowTabNotification {
  constructor(public name: string, public notification: ITabNotification) { }
}

export class SelectTab {
  constructor(public name: string) { }
}


@inject(EventAggregator)
export class Notifier {
  constructor(private eventBus: EventAggregator) { }

  raiseTabNotification(tabName: string, notification: ITabNotification) {
    this.eventBus.publish(new ShowTabNotification(tabName, notification));
  }
}
