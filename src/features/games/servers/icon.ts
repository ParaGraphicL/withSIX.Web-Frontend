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
    if (!ping || ping > 250) { return "withSIX-icon-Connection-Low"; }
    if (ping < 50) { return "withSIX-icon-Connection-High"; }
    return "withSIX-icon-Connection-Med";
  }
}
