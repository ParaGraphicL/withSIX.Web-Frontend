import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./checkbox');
  config.globalResources('./textbox');
  config.globalResources('./selectbox');
  config.globalResources('./imageupload');
  config.globalResources('./fileupload');
}