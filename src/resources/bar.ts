import {ViewModel, CloseTabs} from '../framework';

export class Bar extends ViewModel {
  closeTabs = () => {
    this.eventBus.publish(new CloseTabs());
  }
}
