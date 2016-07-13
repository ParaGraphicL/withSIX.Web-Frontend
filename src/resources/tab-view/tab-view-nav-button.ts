import {bindable} from 'aurelia-framework';
import {ITab} from './tab-view';
import {ViewModel} from '../../services/viewmodel';

export class TabViewNavButton extends ViewModel {
  tab: ITab;
  lastNotificationClass: string;
  activate(tab: ITab) {
    this.tab = tab;
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.notificationClass).subscribe(x => {
        if (x !== null) this.lastNotificationClass = x;
      }));
    })
  }

  hovering = false;

  toggleHover() { this.hovering = !this.hovering; }

  removeNotification() {
    this.tab.notificationCount = 0;
    if (this.tab.notification && !this.tab.notification.isPersistent) {
      if (this.tab.notification.command) this.tab.notification.command.dispose();
      this.tab.notification = null;
    }
  }

  get tabNotificationActive() { return this.tab.notification && (this.hovering || this.tab.notification.active); }
  get notificationClass() { return this.tabNotificationActive ? this.tab.notification.cls : null }
  get progressPercent() { return this.tab.progressInfo ? this.tab.progressInfo.progress : null; }
  get progressClass() { return this.progressPercent && `item-progress-${Math.round(this.progressPercent)}` }
}
