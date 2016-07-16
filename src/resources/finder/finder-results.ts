import {bindable} from 'aurelia-framework';
import {IFindModel} from './finder';

export class FinderResults {
  @bindable showTotalResults = true;
  @bindable model: IFindModel<any>;
  @bindable icon;
  @bindable text = "select";
  @bindable selectIsExecute = false;
  @bindable buttonCls;
  @bindable showClose = true;
  @bindable viewModel;
  get showResults() { return this.model.searchItem !== null }

  close() { this.model.searchItem = null; }
  select(item) { this.model.selectedItem = item; this.model.searchItem = this.model.display(item); }
  execute(item) { this.model.selectedItem = item; this.model.execute(item); }
  clicked(item) { if (this.selectIsExecute) this.execute(item); else this.select(item); }
}
