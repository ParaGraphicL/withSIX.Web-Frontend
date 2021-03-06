import {bindable} from 'aurelia-framework';
import {ReactiveBase, IDisposable} from '../../services/base';

export class Finder {
  @bindable showTotalResults = false;
  @bindable showButton = false;
  @bindable model: IFindModel<any>;
  @bindable icon: string;
  @bindable text = "select";
  @bindable placeholder = "";

  get shouldShowButton() { return this.showButton && this.model.showButton; }
}
export interface IFindModel<T> {
  display: (item: T) => string;
  finder: (searchItem: string) => Promise<T[]>;
  execute: (item: T) => Promise<any> | void;
  showButton: boolean;
  results: T[];
  searchItem?: string;
  selectedItem?: T;
  hasResults: boolean;
}

export class FindModel<T> extends ReactiveBase implements IFindModel<T> {
  results: T[] = [];
  searchItem = null;
  selectedItem: T = null;
  showButton = true;
  hasResults = false;
  //display = (item: T) => item.toString();
  constructor(public finder: (searchItem: string) => Promise<T[]>, public execute: (item: T) => Promise<any> | void, public display = (item: T) => item.toString()) {
    super();
    this.subscriptions.subd(d => {
      // TODO: debounce and make sure old results dont overwrite new results
      d(this.toProperty(this.whenAnyValue(x => x.searchItem)
        .skip(1)
        .flatMap(async (x) => await this.finder(x))
        .concat(), x => x.results));
      d(this.toProperty(this.whenAnyValue(x => x.results.length)
        .map(x => x > 0), x => x.hasResults));
    })
  }
}
