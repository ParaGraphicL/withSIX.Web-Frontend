import {customAttribute, bindable, inject} from 'aurelia-framework';
import {ReactiveBase} from '../../services/base';
import {ReactiveList, ListFactory} from '../../services/reactive';
import {IMenuItem} from './dropdown-menu';

@inject(ListFactory)
export class ActionBar extends ReactiveBase {
  @bindable items: IMenuItem[];
  @bindable hideWhenEmpty = true;
  @bindable orientation = "horizontal";
  @bindable clicked = ($event) => { }
  @bindable itemCls: string;
  isVisible: boolean;
  reactive: ReactiveList<IMenuItem>;

  constructor(private listFactory: ListFactory) { super(); }

  bind() {
    if (!this.items) throw new Error("Items not bound!");
    this.subscriptions.subd(d => {
      d(this.reactive = this.listFactory.getList(this.items, ["isVisible"]));
      d(this.reactive.modified.subscribe(x => this.updateIsVisible()))
    });
    this.updateIsVisible();
  }
  unbind() { this.subscriptions.dispose(); }
  updateIsVisible() { this.isVisible = this.items.some(x => x.isVisible); }
}
