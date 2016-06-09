import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';
import {Base} from '../services/base'

// TODO: Custom CommandButton element that includes spinner etc..
/*
  <commandbutton command.bind="something">content</commandbutton>

  template:
  <button command.bind="something">${content} <span class="icon ..spinner"></span></button>
*/
@inject(Element)
export class CommandCustomAttribute {
  value;
  subscriptions = new Subscriptions();
  constructor(private el: Element) { }
  valueChanged(value: { canExecute: boolean, isExecuting: boolean, (): void }) {
    this.value = value;
    this.subscriptions.dispose();
    if (!value) return;
    this.setupValue(value);
  }
  setupValue(value: { canExecute: boolean, isExecuting: boolean, (): void }) {
    var f = ($evt) => {
      if (value.canExecute) value(); // TODO: test for disabled? needed??
      //$evt.stopPropagation();
    };
    this.subscriptions.subd(d => {
      this.el.addEventListener('click', f);
      d(() => this.el.removeEventListener('click', f));
      d(Base.observeEx(value, x => x.canExecute).subscribe(v => this.handleCanExecuteChange(v)));
      d(Base.observeEx(value, x => x.isExecuting).subscribe(v => this.handleIsExecutingChange(v)));
    });
    this.handleCanExecuteChange(value.canExecute);
    this.handleIsExecutingChange(value.isExecuting);
  }
  shouldntHandleDisabled() { return this.el.hasAttribute("disabled.bind") || this.el.getAttribute("disabled"); }
  handleCanExecuteChange(v) {
    if (!this.shouldntHandleDisabled()) v ? this.el.removeAttribute("disabled") : this.el.setAttribute("disabled", "");
  }
  // TODO: Only add this when the action takes longer than X amount of time?
  handleIsExecutingChange(v) {
    if (v) this.el.classList.add("active");
    else this.el.classList.remove("active");
  }
  detached() { this.subscriptions.dispose(); }
}
