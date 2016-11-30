const noUiSlider = <any>require('nouislider/distribute/nouislider');
const wNumb = <any>require('wnumb/wNumb');

import { bindable, inject, bindingMode } from 'aurelia-framework';

@inject(Element)
export class Rangeboxadv {
  @bindable min: number;
  @bindable max: number;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) value: number[] | number;
  @bindable margin: number = 0;
  @bindable limit: number;
  @bindable step = 1;
  constructor(private element: Element) { }

  slider;

  valueChanged(value: number[]) {
    // todo; suppress own ?
    const currentValue = this.slider.get();
    if (value !== null && (currentValue == null || currentValue[0] != value[0] || currentValue[1] != value[1])) this.slider.set(value);
  }

  minChanged(value: number) {
    this.slider.updateOptions({
      range: {
        'min': this.min,
        'max': this.max,
      }
    });
    this.reset();
  }

  maxChanged(value: number) {
    this.slider.updateOptions({
      range: {
        'min': this.min,
        'max': this.max,
      }
    });
    this.reset();
  }

  reset() {
    /*
    let v: number | number[] = this.min;
    if (this.value && Array.isArray(this.value)) { v = [this.min, this.max]; }
    this.slider.set(v);
    */
    this.slider.reset();
  }

  limitChanged(limit: number) { this.slider.updateOptions({ limit }); }
  marginChanged(margin: number) { this.slider.updateOptions({ margin }); }
  stepChanged(step: number) { this.slider.updateOptions({ step }); }

  unbind() { this.slider.destroy(); }

  bind() {
    // TODO: Update bindings
    this.slider = noUiSlider.create($(this.element).find(".slider")[0], {
      start: this.value,
      margin: this.margin, // Handles must be at least 300 apart
      limit: this.limit, // ... but no more than 600
      connect: true, // Display a colored bar between the handles
      //direction: 'rtl', // Put '0' at the bottom of the slider
      //orientation: 'vertical', // Orient the slider vertically
      behaviour: 'tap-drag', // Move handle on tap, bar is draggable
      step: this.step,
      tooltips: true,
      format: wNumb({
        decimals: 0
      }),
      range: {
        'min': this.min,
        'max': this.max
      },
      /*
      pips: { // Show a scale with the slider
        mode: 'steps',
        stepped: true,
        density: 4
      }*/
    });
    this.slider.on('set', () => {
      const value = this.slider.get();
      if (value == null) {
        this.value = value;
        return;
      }
      if (Array.isArray(value)) {
        this.value = (value.some(x => x > 0)) ? Array.from<number>(value.map(x => parseInt(x))) : null;
      } else {
        this.value = parseInt(value);
      }
    });
  }
}