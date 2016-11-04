import { bindable } from "aurelia-framework";
export class Icon {
  @bindable model;
  @bindable cls;
  @bindable clsOn;
  @bindable optionalTitle;
}

export class DistanceValueConverter {
  toView = (distance?: number) => {
    if (!distance || distance > (2000 * 1000)) { return "withSIX-icon-Connection-Low"; }
    if (distance < (500 * 1000)) { return "withSIX-icon-Connection-High"; }
    return "withSIX-icon-Connection-Med";
  }
}

export class PingValueConverter {
  toView = (ping?: number) => {
    if (!ping || ping > 1000) return 0;
    if (ping > 300) return 1;
    if (ping > 150) return 2;
    if (ping > 80) return 3;
    if (ping > 40) return 4;
    return 5;
  }
}
