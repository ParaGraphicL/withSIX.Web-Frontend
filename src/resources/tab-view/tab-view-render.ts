import {bindable, inject, bindingMode} from 'aurelia-framework';
import {ViewModel, ITab, UiContext} from '../../framework';

@inject(Element, UiContext)
export class TabViewRender extends ViewModel {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTab: ITab;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) closeOnClick = true;
  @bindable close;
  tabStatus: string;

  get isDropdown() { return this.selectedTab && this.selectedTab.type == 'dropdown' }
  get isTab() { return this.selectedTab && this.selectedTab.type != 'dropdown' }

  constructor(private el: Element, ui: UiContext) { super(ui); }

  bind() {
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.selectedTab).delay(100).subscribe(x => this.tabStatus = x ? 'active' : 'inactive'));
    })
    ViewModel.setupDelegateEl(this.el, () => this.selectedTab = null);
  }

  get selectedTabName() { return this.selectedTab ? (this.selectedTab.name || this.selectedTab.header.toLowerCase()) : null; }
}
