import { bindable } from "aurelia-framework";
export class Icon {
  @bindable model;
  @bindable cls;
  @bindable optionalTitle;
}


export class DistanceValueConverter {
  toView = (distance?: number) => {
    if (!distance || distance > (2000 * 1000)) { return "withSIX-icon-Connection-Low"; }
    if (distance < (500 * 1000)) { return "withSIX-icon-Connection-High"; }
    return "withSIX-icon-Connection-Med";
  }
}
