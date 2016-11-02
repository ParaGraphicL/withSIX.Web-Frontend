const noUiSlider = <any>require('nouislider/distribute/nouislider');
const wNumb = <any>require('wnumb/wNumb');

import { bindable, inject } from 'aurelia-framework';

@inject(Element)
export class Rangeboxadv {
  @bindable min: number;
  @bindable max: number;
  @bindable value: number[] | number;
  @bindable margin: number = 0;
  @bindable limit: number;
  constructor(private element: Element) { }

  slider;

  valueChanged(value: number[]) {
    // todo; suppress own ?
    const currentValue = this.slider.get();
    if (value !== null && (currentValue == null || currentValue[0] != value[0] || currentValue[1] != value[1])) this.slider.set(value);
  }
  bind() {
    const step = 1;
    // TODO: Update bindings
    this.slider = noUiSlider.create($(this.element).find(".slider")[0], {
      start: this.value,
      margin: this.margin, // Handles must be at least 300 apart
      limit: this.limit, // ... but no more than 600
      connect: true, // Display a colored bar between the handles
      //direction: 'rtl', // Put '0' at the bottom of the slider
      //orientation: 'vertical', // Orient the slider vertically
      behaviour: 'tap-drag', // Move handle on tap, bar is draggable
      step: step,
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
      this.value = (value.some(x => x > 0)) ? Array.from<number>(value) : null;
    })
  }
}