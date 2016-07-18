import {customAttribute, bindable, inject} from 'aurelia-framework';
import {ViewModel} from '../../services/viewmodel';
import {UiContext} from '../../services/uicontext';
import {CloseDropdowns} from '../../services/api';
import {ReactiveList, ListFactory, uiCommand} from '../../services/reactive';
import {IPromiseFunction} from '../../services/base';
import 'contextMenu';

// requires  adjustment to contextMenu.js for child element activation..
// https://github.com/sickboy/contextMenu.js/commit/2bc5482ad0825097041b06da8e8d54ba50e2f26f
@inject(UiContext, Element)
export class DropdownMenu extends ViewModel {
  reactive: ReactiveList<IMenuItem>;
  @bindable items: IMenuItem[];
  @bindable header: string;
  @bindable icon: string = "withSIX-icon-Share-Dots-V";
  @bindable textCls: string;
  @bindable direction: string = "auto";
  @bindable hideWhenEmpty = true;
  @bindable menuCls: string;
  @bindable itemCls: string;
  isVisible: boolean;
  menu: Element;
  menuButton: Element;
  menuEl: JQuery;
  menuTrgr: JQuery;
  contextMenu;
  open: boolean;

  constructor(ui: UiContext, private element: Element) { super(ui); }

  bind() {
    if (!this.items) throw new Error("Items not bound!");
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(CloseDropdowns, x => this.close()));
      d(this.reactive = this.listFactory.getList(this.items, ["isVisible"]));
      d(this.reactive.modified.startWith(1).subscribe(x => this.updateIsVisible()))
    });
  }

  attached() {
    this.menuTrgr = $(this.menuButton);
    this.menuEl = $(this.menu);
    (<any>this.menuTrgr).contextMenu('popup', this.menuEl, { // 'menu' (is more menu styled)
      displayAround: 'trigger', position: this.direction, horAdjust: this.direction === 'left' ? -104 : undefined,
      // On open, let's rid ourselves from any parent styling/behavior, and restore once we close
      onOpen: () => { this.menuEl.appendTo('body'); this.open = true; },
      onClose: () => { this.menuEl.appendTo(this.element); this.open = false; }
      //horAdjust:-menuTrgr.width()
    });
    let el = $(this.element);
    this.menuEl.delegate('a, button', 'click', e => {
      let evt = jQuery.Event("click", e);
      // Trick jQuery into thinking that the button click is part of the tree of the containing parent..
      (<any>evt).backupTarget = evt.currentTarget;
      evt.target = el.parent().find('button, a')[0];
      el.trigger(evt);
    });
  }
  updateIsVisible() { this.isVisible = this.items.some(x => x.isVisible); }

  closeWithDelay() { if (this.open) setTimeout(() => this.close(), 0); }
  close() { if (this.open) (<any>this.menuTrgr).contextMenu('close', this.menu) }
}

export interface IMenuItem {
  name?: string;
  icon?: string;
  cls?: string;
  textCls?: string;
  action?;
  isVisible: boolean;
  isSeparator?: boolean;
  count?: number;
}

export interface IMenuItemOptions {
  name?: string;
  textCls?: string;
  icon?: string;
  cls?: string;
  tooltip?: string;
}

export class MenuItem<T> implements IMenuItem {
  _name: string;
  _icon: string;
  _textCls: string;
  _tooltip: string;
  _cls: string;
  count: number;

  // Here so that we can monitor it with our proprety observers ;-)
  get isVisible() { return this.action.isVisible; }
  set name(value) { this._name = value; }
  get name() { return this._name == null ? this.action.name : this._name; }

  set icon(value) { this._icon = value; }
  get icon() { return this._icon == null ? this.action.icon : this._icon; }

  set textCls(value) { this._textCls = value; }
  get textCls() { return this._textCls == null ? this.action.textCls : this._textCls; }

  set cls(value) { this._cls = value; }
  get cls() { return this._cls == null ? this.action.cls : this._cls; }


  set tooltip(value) { this._tooltip = value; }
  get tooltip() {
    var tt = this._tooltip == null ? this.action.tooltip : this._tooltip;
    if (tt == null && this._name == "") return this.action.name;
    return tt;
  }

  constructor(action: IPromiseFunction<T>, options?: IMenuItemOptions) {
    if (action == null) throw new Error("action can't be null");
    if (action.hasOwnProperty("canExecute")) {
      //Tools.Debug.log("Found UiCommand for", name);
      this.action = action;
    } else {
      //Tools.Debug.log("Creating UiCommand for", name);
      this.action = uiCommand<T>(action);
    }
    if (options) {
      this.name = options.name;
      this.textCls = options.textCls;
      this.icon = options.icon;
      this.cls = options.cls;
      this.tooltip = options.tooltip;
    }
  }
  action;
}
