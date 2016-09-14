import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';
import {Base} from '../services/base'

@inject(Element)
export class CommandCustomAttribute {
  value;
  subscriptions = new Subscriptions();
  constructor(private el: Element) { }
  valueChanged(value: { canExecute: boolean, isExecuting: boolean, (): void }) {
    this.handleNewValue(value);
  }
  handleNewValue(value) {
    this.subscriptions.dispose();
    if (!value) return;
    this.setupValue(value);
  }
  setupValue(value: { canExecute: boolean, isExecuting: boolean, (): void }) {
    var f = $evt => {
      // TODO: when disabled (cant execute) we shouldn't receive the event anyway..
      if (value.canExecute) value();
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
  handleCanExecuteChange(v) { v ? this.el.removeAttribute("disabled") : this.el.setAttribute("disabled", "") }
  handleIsExecutingChange(v) {
    if (v) this.el.classList.add("active");
    else this.el.classList.remove("active");
  }
  bind() { if (this.value) this.handleNewValue(this.value); }
  unbind() { this.subscriptions.dispose() }
}
