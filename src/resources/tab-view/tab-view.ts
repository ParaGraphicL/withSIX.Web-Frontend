import { bindable, inject, bindingMode } from 'aurelia-framework';
import { ViewModel } from '../../services/viewmodel';
import { TriggerOf } from "../../services/base";
import { ShowTabNotification, SelectTab, ITabNotification } from '../../services/api';

interface IProgressInfo {
  progress?: number;
  text?: string;
}

export interface ITab {
  viewModel?: string;
  headerViewModel?: string;
  header?: string;
  name?: string;
  icon?: string;
  location?: string;
  disabled?: boolean;
  hidden?: boolean;
  type?: string;
  cls?: string;
  notificationCount?: number;
  notificationText?: string;
  notificationCls?: string;
  progressInfo?: IProgressInfo;
  notification?: ITabNotification;
  notificationTimeOut?; // Timer;
  instant?: boolean;
  disabledAction?: Function;
}

export class TabView<T extends ITab> extends ViewModel {
  @bindable orientation = 'left';
  @bindable tabs: T[] = [];
  @bindable renderView = true;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTab: T;
  notificationTrigger: TriggerOf<ITabNotification>;

  bind() {
    this.subscriptions.subd(d => {
      d(this.observableFromEvent<CloseTabs>(CloseTabs).filter(x => x.exclude !== this).subscribe(this.closeNow))
      d(this.eventBus.subscribe(ShowTabNotification, this.showTabNotification));
      d(this.eventBus.subscribe(SelectTab, this.selectTab));
      d(this.whenAnyValue(x => x.selectedTab).subscribe(x => this.tabs.forEach(this.disableNotification)));
      d(this.notificationTrigger = new TriggerOf<ITab>((tab) => this.disableNotification(tab)));
    });
  }

  toggleTab(tab: T, $evt) {
    if ($evt) $evt.stopPropagation();
    this.eventBus.publish(new CloseTabs(this));
    if (tab && tab.disabled && tab.disabledAction) tab.disabledAction();
    else this.selectedTab = this.selectedTab === tab ? null : tab;
    return false;
  }
  close = ($event) => {
    if ($event.ctrlKey || $event.altKey || $event.shiftKey) return true;
    this.closeNow();
    return true;
  }
  closeNow = () => this.selectedTab = null;

  selectTab = (evt: SelectTab) => {
    let tab = this.tabs.asEnumerable().firstOrDefault(x => (x.name || x.header).toLowerCase() == evt.name.toLowerCase())
    this.selectedTab = tab;
  }

  showTabNotification = (evt: ShowTabNotification) => {
    let tab = this.tabs.asEnumerable().firstOrDefault(x => (x.name || x.header).toLowerCase() == evt.name.toLowerCase())
    if (tab == null) { return; }
    this.removeTabNotification(tab);
    this.tools.Debug.log("$$$ Set tab notification", evt);
    tab.notification = evt.notification;
    if (evt.notification == null) { return; }
    if (this.selectedTab !== tab) {
      tab.notificationCount = 1;
      tab.notification.active = true;
      this.notificationTrigger.trigger(tab, 1500);
    }
  }

  disableNotification = (tab: ITab) => { if (tab.notification) tab.notification.active = false }
  removeTabNotification(tab: ITab) {
    if (tab.notification && tab.notification.command) tab.notification.command.dispose();
    tab.notificationCount = 0;
  }
}

export class CloseTabs {
  constructor(public exclude = null) { }
}
