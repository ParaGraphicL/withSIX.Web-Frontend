import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./list-view');
  config.globalResources('./list-view-item');
}