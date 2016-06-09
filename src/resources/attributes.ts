import {customAttribute, inject, bindingMode, TaskQueue, bindable} from 'aurelia-framework';

@customAttribute('hover', bindingMode.twoWay)
@inject(Element)
export class HoverCustomAttribute {
  value: boolean;
  element: HTMLElement;
  constructor(element: HTMLElement) {
      this.element = element;
  }

  bind() {
    let el = $(this.element);
    el.mouseenter(() => this.value = true);
    el.mouseleave(() => this.value = false);
  }

  unbind() {
    let el = $(this.element);
    el.off('mouseenter');
    el.off('mouseleave');
  }
}

@inject(Element)
export class ConditionalTitleCustomAttribute {
  @bindable title;
  @bindable condition;
  element: HTMLElement;
  constructor(element: HTMLElement) {
      this.element = element;
  }

  titleChanged(newValue, oldValue) { if (this.condition) $(this.element).attr('title', newValue); }
  conditionChanged(newValue, oldValue) {
    if (newValue) $(this.element).attr('title', this.title);
    else $(this.element).removeAttr('title');
  }
}
