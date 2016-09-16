import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('./router-menu');

  config.feature('resources/forms');
  config.feature('resources/card-view');
  config.feature('resources/list-view');
  config.feature('resources/tab-view');
  config.feature('resources/table-view');
  config.feature('resources/dropdown-menu');
  config.feature('resources/gallery');
  config.feature('resources/finder');

  config.globalResources('./bar');
  config.globalResources('./filters');
  config.globalResources('./typeahead');
  config.globalResources('./command-button');
  config.globalResources('./optional-link');

  config.globalResources('./loading-composer');

  config.globalResources('./infinite-scroll');

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
  config.globalResources('./ad-links');
  config.globalResources('./ad-unit');
  config.globalResources('./time-ago');
}

//export * from './command';
export * from './attributes';
export * from './command-button';
export * from './router';
export * from './labs';
export * from './router-menu';
export * from './infinite-scroll';
export * from './loading-composer';
export * from './menu';
export * from './ad-links';
export * from './markdown';
export * from './usertitle';
export * from './time-ago';
export * from './filters';

// TODO: Export from the components instead
export * from './finder/finder';
export * from './finder/finder-results';
export * from './dropdown-menu/dropdown-menu';
export * from './dropdown-menu/action-bar';
export * from './tab-view/tab-view';
export * from './gallery/gallery';