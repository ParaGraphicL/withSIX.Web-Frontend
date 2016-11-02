import { activationStrategy } from 'aurelia-router';

import { ViewModel } from "../../../framework";

export class Index2 extends ViewModel {
  params;
  activate(params) {
    this.params = params;
    this.w6.classes = 'v3';
  }

  deactivate() {
    super.deactivate();
    this.w6.classes = '';
  }

  determineActivationStrategy() {
    return activationStrategy.replace; //replace the viewmodel with a new instance
    // or activationStrategy.invokeLifecycle to invoke router lifecycle methods on the existing VM
    // or activationStrategy.noChange to explicitly use the default behavior
  }
}