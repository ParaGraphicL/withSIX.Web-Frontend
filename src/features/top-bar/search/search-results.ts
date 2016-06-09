import {bindable, bindingMode, inject} from 'aurelia-framework';
import {ViewModel} from '../../../framework';

@inject(Element)
export class SearchResults {
  @bindable({defaultBindingMode: bindingMode.twoWay}) open: boolean;
  @bindable results: any[];
  @bindable resultQ;
  @bindable searchOneType;
  @bindable closeNow;
  @bindable gameSlug;
  @bindable fullView: boolean;
  @bindable goBackToOverview;

  constructor(private el: Element) {}

  close = $event => {
    if ($event.ctrlKey || $event.altKey || $event.shiftKey) return true;
    this.closeNow();
    return true;
  }

  bind() {
    ViewModel.setupDelegateEl(this.el, this.closeNow);
  }

  get hasResults() { return this.results && this.results.length > 0 }
  get anyResults() { return this.results.asEnumerable().any(x => x.value.length > 0); }
}
