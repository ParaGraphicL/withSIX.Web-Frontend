import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./card-view');
  config.globalResources('./card-view-item');
  config.globalResources('./card-clearfix');
}