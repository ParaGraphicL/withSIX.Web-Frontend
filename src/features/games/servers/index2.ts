import { activationStrategy } from 'aurelia-router';

export class Index2 {
  params;
  activate(params) { this.params = params }

    determineActivationStrategy() {
    return activationStrategy.replace; //replace the viewmodel with a new instance
    // or activationStrategy.invokeLifecycle to invoke router lifecycle methods on the existing VM
    // or activationStrategy.noChange to explicitly use the default behavior
  }
}