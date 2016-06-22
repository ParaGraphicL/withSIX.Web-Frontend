import {ViewModel, ITabNotification} from '../../services/lib';

export class TabNotification extends ViewModel {
  model;
  activate(model: ITabNotification) {
    this.model = model;
  }
  visit() {
    if (this.model.href) return this.navigateInternal(this.model.href);
  }
}
