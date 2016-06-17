import {ViewModelWithModel, UiContext, MenuItem,uiCommand2,Debouncer, IMenuItem, ITab} from '../../../framework';
import {INotification} from './notification';


export class Notifications extends ViewModelWithModel<ITab> {
  notifications: INotification[] = []

  activate(model: ITab) {
    super.activate(model);
    this.notifications.push({title: 'Test notification 1'}, {title: 'Test notification 2'});
  }

  clearNotification(notification: INotification) {
    this.tools.removeEl(this.notifications, notification);
    this.updateNotificationCount();
  }
  clearNotifications = uiCommand2("Clear notifications", async () => {
    this.notifications = [];
    this.updateNotificationCount();
  }, {cls: "naked-button default"});

  updateNotificationCount() { this.model.notificationCount = this.notifications.length; }
}
