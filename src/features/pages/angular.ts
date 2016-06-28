import {activationStrategy} from 'aurelia-router';
import {ViewModel} from '../../framework';

export class Angular extends ViewModel {
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
