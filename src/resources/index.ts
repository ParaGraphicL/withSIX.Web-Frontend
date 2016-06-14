import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./router-menu');

  config.globalResources('./bar');
  config.globalResources('./card-view');
  config.globalResources('./list-view');
  config.globalResources('./tab-view/tab-view');
  config.globalResources('./tab-view/tab-view-render');
  config.globalResources('./filters');
  config.globalResources('./typeahead');
  config.globalResources('./command-button');
  config.globalResources('./optional-link');

  config.globalResources('./loading-composer');

  config.globalResources('./infinite-scroll');

  config.globalResources('./finder/finder');
  config.globalResources('./finder/finder-results');

  config.globalResources('./labs');
  config.globalResources('./attributes');
  config.globalResources('./conditional-title');

  config.globalResources('./command');
  config.globalResources('./converters');
  config.globalResources('./back-img');

  config.globalResources('./markdown');
  config.globalResources('./usertitle');

  config.globalResources('./router');
  config.globalResources('./menu');
  config.globalResources('./dropdown-menu/dropdown-menu');
  config.globalResources('./dropdown-menu/action-bar');
  config.globalResources('./ad-links');
  config.globalResources('./ad-unit');
  config.globalResources('./time-ago');
}

//export * from './command';
export * from './attributes';
export * from './finder/finder';
export * from './finder/finder-results';
export * from './command-button';
export * from './router';
export * from './labs';
export * from './router-menu';
export * from './infinite-scroll';
export * from './dropdown-menu/dropdown-menu';
export * from './dropdown-menu/action-bar';
export * from './loading-composer';
export * from './menu';
export * from './ad-links';
export * from './markdown';
export * from './usertitle';
export * from './time-ago';
export * from './filters';
export * from './tab-view/tab-view';
