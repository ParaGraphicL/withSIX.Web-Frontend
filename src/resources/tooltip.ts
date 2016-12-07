import { bindable } from "aurelia-framework";

export class Tooltip {
  @bindable text: string;
  @bindable url: string;
}