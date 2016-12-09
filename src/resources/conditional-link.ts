import { bindable } from "aurelia-framework";

export class ConditionalLink {
  @bindable text: string;
  @bindable url: string;
  @bindable target: string;
}
