var Promise = require('bluebird'); // Promise polyfill for IE11

// hack for electron cant communicate with popup
if (window.location.search.startsWith("?code=")) {
  window.localStorage.setItem('auth-search', window.location.search);
  window.localStorage.setItem('auth-hash', window.location.hash);
  throw new Error("Window was used for auth code handling");
}

require('whatwg-fetch'); // fetch polyfill
import './bootstrap';
