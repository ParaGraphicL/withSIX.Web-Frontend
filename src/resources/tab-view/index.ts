import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./tab-view');
  config.globalResources('./tab-view-render');
}