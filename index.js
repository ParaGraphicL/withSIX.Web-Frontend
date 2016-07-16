// we want font-awesome to load as soon as possible to show the fa-spinner
//import './styles/styles.css';
//import 'bootstrap';
//import 'bootstrap/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './scss/fonts.scss';
import './scss/lib.scss';
import './scss/main.scss';
import './scss/legacy.scss';

//var Promise = require('bluebird'); // Promise polyfill for IE11
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
var Promise = Bluebird;


import 'aurelia-polyfills';
import {
  initialize
} from 'aurelia-pal-browser';

// PAL has to be initialized in the first chunk, before any of the Aurelia files are loaded
// the reason is that Webpack resolves all the imports immediately, as the chunks are loaded
// Some modules use {DOM} from 'aurelia-pal' and expect it to already be initialized.
initialize();

require('whatwg-fetch'); // fetch polyfill
