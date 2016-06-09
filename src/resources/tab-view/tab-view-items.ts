import {ViewModel, Query, DbClientQuery, handlerFor, ITab} from '../../framework';
import {inject, bindable} from 'aurelia-framework';

export class TabViewItems {
  @bindable tabs: ITab[];
  @bindable location;
  @bindable toggleTab;
  @bindable selectedTab;
}
