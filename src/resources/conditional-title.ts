import { bindable, inject } from 'aurelia-framework';
import { ViewModel } from '../services/viewmodel';
import { UiContext } from '../services/uicontext';

@inject(Element, UiContext)
export class ConditionalTitleCustomElement extends ViewModel {
  @bindable desiredTitle: string;
  @bindable condition: boolean;
  element: HTMLElement;
  jElement: JQuery;

  constructor(element: HTMLElement, ui: UiContext) {
    super(ui);
    this.element = element;
  }

  bind() {
    this.jElement = $(this.element);
    this.setTitle(this.desiredTitle);
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.desiredTitle).subscribe(x => this.setTitle(x)))
      d(this.whenAnyValue(x => x.condition).subscribe(x => this.setTitle(this.desiredTitle)))
    })
  }

  setTitle(title) { if (this.condition) this.jElement.attr('title', title); else this.jElement.removeAttr('title') }
}
