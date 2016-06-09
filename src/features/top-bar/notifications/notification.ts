export interface INotification {
  title: string;
}

export class Notification {
  model: INotification;
  activate(model: INotification) {
    this.model = model;
  }
}
