import { bindable, inject, bindingMode } from 'aurelia-framework';
import { ViewModel, ITab, UiContext } from '../../framework';

@inject(Element, UiContext)
export class TabViewRender extends ViewModel {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTab: ITab = null;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) closeOnClick = true;
  @bindable close;
  tabStatus: string;
  lastActiveTab: ITab = null;

  get isDropdown() { return this.lastActiveTab && this.lastActiveTab.type == 'dropdown' }
  get isTab() { return this.lastActiveTab && this.lastActiveTab.type != 'dropdown' }

  constructor(private el: Element, ui: UiContext) { super(ui); }

  bind() {
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.selectedTab).filter(x => x !== null).subscribe(x => this.lastActiveTab = x));
      d(this.whenAnyValue(x => x.selectedTab).filter(x => x === null).delay(1000).filter(x => this.selectedTab == null).subscribe(x => this.lastActiveTab = null));
      d(this.whenAnyValue(x => x.selectedTab).delay(100).subscribe(x => this.tabStatus = x ? 'active' : 'inactive'));
    })
    ViewModel.setupDelegateEl(this.el, () => this.selectedTab = null);
  }

  get selectedTabName() { return this.lastActiveTab ? (this.lastActiveTab.name || this.lastActiveTab.header.toLowerCase()) : null; }
  get additionalTab() { return this.lastActiveTab ? this.lastActiveTab.additionalTab : null; }
}
