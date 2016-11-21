import { bindable } from 'aurelia-framework';

export class CommandButtonCustomElement {
  @bindable model = <any>{};
  @bindable noProcessing;
  @bindable type = "button";
  private _cancel;
  @bindable
  get cancel() { return this._cancel || this.model.cancel; }
  set cancel(value) { this._cancel = value; }

  @bindable icon: string;
  @bindable clss: string;

  get name() { return this.model.name; }
  get command() { return this.model; }
  get cls() { return this.model.cls; }
  get textCls() { return this.model.textCls; }
  get isVisible() { return this.model.isVisible; }
  get tooltip() { return this.model.tooltip; }
}
