import {activationStrategy} from 'aurelia-router';
import {MainBase} from './index';
export class Blank extends MainBase {
  activate() {
    this.tools.Debug.log("AURELIA: angular vm loaded");
    // This works around the issue of routing for Angular while Aurelia is involved..angular
    // TODO: Better workaround than the rootscope apply?
    this.notifyAngular();
  }

  deactivate() {
    this.tools.Debug.log("AURELIA: angular vm unloaded");
    // This works around the issue of routing for Angular while Aurelia is involved..angular
    // TODO: Better workaround than the rootscope apply?
    this.notifyAngular();
  }

  determineActivationStrategy() {
    return activationStrategy.replace;
  }
}
