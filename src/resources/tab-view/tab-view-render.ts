import {bindable, inject, bindingMode} from 'aurelia-framework';
import {ViewModel, ITab, UiContext} from '../../framework';

@inject(Element, UiContext)
export class TabViewRender extends ViewModel {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTab: ITab;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) closeOnClick = true;
  @bindable close;
  tabStatus: string;
  lastActiveTab: ITab;

  get isDropdown() { return this.lastActiveTab && this.lastActiveTab.type == 'dropdown' }
  get isTab() { return this.lastActiveTab && this.lastActiveTab.type != 'dropdown' }

  constructor(private el: Element, ui: UiContext) { super(ui); }

  bind() {
    this.subscriptions.subd(d => {
      d(this.observeEx(x => x.selectedTab).map(x => x != null).subscribe(x => this.lastActiveTab = x));
      d(this.observeEx(x => x.selectedTab).map(x => x == null).delay(1000).map(x => this.selectedTab == null).subscribe(x => this.lastActiveTab = null));
      d(this.observeEx(x => x.selectedTab).delay(100).subscribe(x => this.tabStatus = x ? 'active' : 'inactive'));
    })
    ViewModel.setupDelegateEl(this.el, () => this.selectedTab = null);
  }

  get selectedTabName() { return this.lastActiveTab ? (this.lastActiveTab.name || this.lastActiveTab.header.toLowerCase()) : null; }
}
