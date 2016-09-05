import 'whatwg-fetch'; // fetch polyfill
import 'font-awesome/css/font-awesome.css';
import '../scss/fonts.scss';
import '../scss/lib.scss';
import '../scss/main.scss';
import '../scss/legacy.scss';
import * as Bluebird from 'bluebird';
Bluebird.config({
  //// Enable long stack traces
  // longStackTraces: true,
  //// Enable cancellation
  // cancellation: true,
  //// Enable monitoring
  // monitoring: true,
  // Enable warnings
  warnings: false
});
// import {
//   initialize
// } from 'aurelia-pal-browser';
//
// // PAL has to be initialized in the first chunk, before any of the Aurelia files are loaded
// // the reason is that Webpack resolves all the imports immediately, as the chunks are loaded
// // Some modules use {DOM} from 'aurelia-pal' and expect it to already be initialized.
// initialize();

require('jquery-mousewheel');

export * from './bootstrap';

// bootstrap(function(aurelia) {
//   aurelia.use
//     .standardConfiguration()
//     .developmentLogging();
//
//   aurelia.start().then(() => aurelia.setRoot('app', document.body));
// });
