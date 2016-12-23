import { FrameworkConfiguration } from "aurelia-framework";

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./textbox');
  config.globalResources('./passwordbox');
  config.globalResources('./checkbox');
  config.globalResources('./radiobox');
  config.globalResources('./selectbox');
  config.globalResources('./imageupload');
  config.globalResources('./fileupload');
  config.globalResources('./rangebox');
  config.globalResources('./rangeboxadv');
  config.globalResources('./form-group');
}