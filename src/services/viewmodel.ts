import {Base} from './base';
import {Mediator, LegacyMediator, DbQuery} from './mediator';
import {Toastr} from './toastr';
import {ListFactory, ObservableEventAggregator, EventWrapper, uiCommand2} from './reactive';
import {Tools} from './tools';

import {Client} from 'withsix-sync-api';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

import {Api, Notifier, CloseDialogs} from './api';
import {ClientWrapper, AppEventsWrapper} from './client-wrapper';

import {UiContext} from './uicontext'

import * as clipboard from 'clipboard-js';

@inject(UiContext)
export class ViewModel extends Base {
  hasApi: boolean = (<any>window).api != null
  _router: Router;
  _changed = false;
  get changed() { return this._changed; }
  set changed(value: boolean) {
    this.tools.Debug.log("set changed: ", value);
    this._changed = value;
  }

  constructor(private ui: UiContext) {
    super();
  }

  get isNavigating() { return this.router.isNavigating; }

  get tools() { return Tools; }

  // This works around the issue of routing for Angular while Aurelia is involved..angular
  // TODO: Better workaround than the rootscope apply?
  protected notifyAngular = () => {
    if (this.isNavigating) this.observeEx(x => x.isNavigating).skip(1).where(x => !x).take(1).subscribe(this.notifyAngularInternal)
    else this.notifyAngularInternal();
  }

  protected notifyAngularInternal = () => {
    Tools.Debug.log("$$$ Notifying Angular!");
    let scope = angular.element(document).scope()
    if (!scope) return;
    scope.$apply()
  }

  handleFooterIf(sw: boolean) {
    if (this.features.uiVirtualization)
      this.w6.showFooter = sw;
  }

  static observableFromEvent = ObservableEventAggregator.observableFromEvent;
  observableFromEvent = <T>(evt: Function | string) => ObservableEventAggregator.observableFromEvent<T>(evt, this.eventBus);

  static setupDelegateEl(el: Element, close: () => void) {
    // TODO: This would break click.delegate ..
    //$(el).bind('click mouseenter', e => e.stopPropagation());
    const ignoreClasses = ['iw-has-submenu', 'dropdown-toggle', 'ignore-close'];
    $(el).delegate('button, a', 'click', e => { // 'li'
      let $this = $((<any>e).backupTarget || e.currentTarget);
      // TODO: Only on a, not buttons?
      if (e.ctrlKey || e.altKey || e.shiftKey) return true;
      if (!ignoreClasses.asEnumerable().any(x => $this.hasClass(x)))
        setTimeout(() => close());
    });
  }

  handleAngularHeader = () => {
    let row = angular.element("#root-content-row");
    // TODO: Hide the row until isNavigating is done..
    if (row.length == 0) {
      let iv = setInterval(() => {
        let row = angular.element("#root-content-row");
        if (row.length == 0) return;
        clearInterval(iv);
        this.handleAngularHeaderInternal(row);
      }, 50);
    } else this.handleAngularHeaderInternal(row);
  }

  handleAngularHeaderInternal = (row: JQuery) => {
    this.w6.aureliaReady = true;
    this.tools.Debug.log("AURELIA: angular vm loaded");
    this.notifyAngular();
    row.prepend($("#content"));
  }

  reverseAngularHeader = () => $("#root-content-row").append($("#content"));

  async copyToClipboard(str: string): Promise<any> {
    await clipboard.copy(str);
    this.ui.toastr.success('copied to clipboard');
  }

  closeDropdowns() { return this.api.closeDropdowns(); }

  showMessageDialog = this.ui.showMessageDialog;
  confirm = this.ui.confirm;

  get isLoggedIn() { return this.w6.userInfo.id != null }
  get unchanged() { return !this.changed; }
  get navigateInternal() { return this.ui.navigateInternal }
  get features() { return this.ui.features; }
  get appEvents() { return this.ui.appEvents; }
  get clientWrapper() { return this.ui.clientWrapper; }
  get api() { return this.ui.api; }
  get w6() { return this.ui.w6; }
  get mediator() { return this.ui.mediator; }
  get eventBus() { return this.ui.eventBus; }
  get notifier() { return this.ui.notifier; }
  get dialog() { return this.ui.dialog; }
  get toastr() { return this.ui.toastr; }
  get listFactory() { return this.ui.listFactory; }
  get legacyMediator() { return this.ui.legacyMediator; }
  get validator() { return this.ui.validator; }
  get router() { return this._router || this.ui.router; }
  set router(value) { this._router = value; }
  get assets() { return this.ui.assets; }

  deactivate() { this.dispose(); }
  unbind() { this.dispose(); }
  async canDeactivate() {
    if (!this.changed) return true;
    this.openChanges();
    return false;
  }
  protected alert(message, title = "Alert") { return this.toastr.warning(message, title); }
  protected openChanges() { this.alert("You have outstanding changes, please save or cancel them first", "Outstanding changes"); }

  getViewStrategy: () => string;
  protected accessDenied() { this.getViewStrategy = () => '/dist/errors/403.html'; }

  protected async handleAccessDenied(p: () => Promise<any>) {
    try {
      await p();
    } catch (err) {
      if (err == "access denied") this.accessDenied();
      else throw err;
    }
  }

  protected getMenuItems(items: Array<ILegacyMenuItem>, mainSegment: string, parentIsDefault?: boolean): ILegacyMenuItem[] {
    var menuItems = [];
    items.forEach(item => {
      var main = item.mainSegment || item.mainSegment == "" ? item.mainSegment : mainSegment;
      var fullSegment = main && main != "" ? main + "." + item.segment : item.segment;
      var segment = item.isDefault ? main : fullSegment; // This will make menu links link to the parent where this page is default
      var menuItem = this.copyObject(item);
      menuItem.segment = segment;
      menuItem.fullSegment = fullSegment;
      menuItem.cls = item.cls;
      menuItem.target = item.target || "_self";
      if (item.isRight) menuItem.cls = item.cls ? item.cls + ' right' : 'right';
      menuItems.push(menuItem);
    });
    return menuItems;
  }


  private copyObject<T>(object: T): T {
    var objectCopy = <T>{};

    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        objectCopy[key] = object[key];
      }
    }

    return objectCopy;
  }
}


export interface ILegacyMenuItem {
  header: string;
  segment: string;
  target?: string;
  mainSegment?: string;
  fullSegment?: string;
  url?: string;
  cls?: string;
  icon?: string;
  isRight?: boolean;
  isDefault?: boolean;
}


export class ViewModelWithModel<T> extends ViewModel {
  model: T;
  activate(model: T) {
    if (this.model === model) return;
    this.model = model;
  }
}
// Alias??
export class ViewModelOf<T> extends ViewModelWithModel<T> { }

export interface FixedDialogController extends DialogController {
  settings: {
    lock?: boolean;
    centerHorizontalOnly?: boolean;
  }
}

@inject(DialogController, UiContext)
export class Dialog<T> extends ViewModelOf<T> {
  isModal: boolean;
  constructor(public controller: FixedDialogController, ui: UiContext) {
    super(ui);
  }
  activate(model: T) {
    if (model === this.model) return; // TODO: unless deactivated?
    super.activate(model);
    this.subscriptions.subd(d => {
      this.eventBus.subscribe(CloseDialogs, (evt: CloseDialogs) => {
        //if (this.isModal) return;
        if (this.controller.settings.lock) return;
        this.controller.cancel(null);
      });
    });
  }

  attached() {
    $('ai-dialog').bind('click', ($evt) => (<any>$evt.originalEvent).stopBubbleUp = true);
    $('ai-dialog-container').bind('click', this.clicked)
  }

  clicked = ($evt: JQueryEventObject) => { if (!(<any>$evt.originalEvent).stopBubbleUp) this.eventBus.publish(new CloseDialogs()); }

  //cancel = UiCommand2('Cancel', async () => this.controller.cancel(), { cls: "cancel" });
}

export interface IPaginated<T> {
  items: T[], inlineCount: number, page: number
}


export class PaginatedViewModel<T> extends ViewModel {
  model: IPaginated<T>;
  loadMore;
  params;
  async activate(params) {
    this.params = params;
    this.model = await this.getMore();
    this.loadMore = uiCommand2("Load more", this.addPage, {
      isVisibleObservable: this.morePagesAvailable,
      canExecuteObservable: this.morePagesAvailable
    });
  }

  get totalPages() { return this.inlineCount / DbQuery.pageSize }
  get inlineCount() { return this.model.inlineCount }
  get page() { return this.model.page }
  morePagesAvailable = this.observeEx(x => x.inlineCount).combineLatest(this.observeEx(x => x.page), (c, p) => p < this.totalPages);

  addPage = async () => {
    let r = await this.getMore(this.model.page + 1);
    this.model.inlineCount = r.inlineCount;
    this.model.page = r.page;
    this.model.items.push(...r.items);
  }

  async getMore(page = 1): Promise<IPaginated<T>> { return null }
}
