import VersionCompare from 'version_compare';
import {IDisposable} from './base';
import {Environment, DebugInner, DebugBase, LogLevel, Environment as Env, EnvironmentHost} from './env';
import {createError} from '../helpers/utils/errors';
import {toShortId as toS, fromShortId as fromS} from '../helpers/utils/string';
import {removeEl as rEl, enumToMap as eToMap} from '../helpers/utils/iterable';
import {isTokenExpired as isTExpired} from '../helpers/utils/jwt';
import {uriHasProtocol as uHasProtocol, cleanupHash as cHash, cleanupSearch as cSearch} from '../helpers/utils/url';
import {createHttpError, ValidationErrorConstructor} from '../helpers/utils/http-errors'

// TODO: Decompose
export module Tools {
  // for legacy purposes
  export const toShortId = toS;
  export const fromShortId = fromS;
  export const removeEl = rEl;
  export const uriHasProtocol = uHasProtocol;
  export const enumToMap = eToMap;
  export const cleanupHash = cHash;
  export const cleanupSearch = cSearch;
  export const Environment = Env;
  export var Debug = EnvironmentHost.debug;
  export var debug = false;
  export var env = EnvironmentHost.env;

  // TODO: ES6/TS valid exceptions
  export var RequireSslException = createError('RequireSslException');
  export var RequireNonSslException = createError('RequireNonSslException');
  export var HttpException = createHttpError('HttpException');
  export var NotFoundException = createHttpError('NotFoundException', HttpException.prototype);
  export var Forbidden = createHttpError("Forbidden", HttpException.prototype);
  export var ValidationError = <ValidationErrorConstructor>createHttpError("ValidationError", HttpException.prototype);
  export var RequiresLogin = createHttpError('RequiresLogin', HttpException.prototype);
  export var LoginNoLongerValid = createHttpError('LoginNoLongerValid', HttpException.prototype);

  export function disposableTimeout(f: () => void, timeout): IDisposable {
    let id = setTimeout(f, timeout);
    return { dispose: () => clearTimeout(id) }
  }

  export function disposableInterval(f: () => void, timeout): IDisposable {
    let id = setInterval(f, timeout);
    return { dispose: () => clearInterval(id) }
  }

  export var emptyGuid = '00000000-0000-0000-0000-000000000000';

  export function generateGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }


  export function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  export function versionCompare(x, y) { return (<any>VersionCompare).compare(x, y, { zeroExtend: true }); }

  export var Password = {

    _pattern: /[a-zA-Z0-9_\-\+\.]/,

    _getRandomByte: function() {
      // http://caniuse.com/#feat=getrandomvalues
      if (window.crypto && window.crypto.getRandomValues) {
        var result = new Uint8Array(1);
        window.crypto.getRandomValues(result);
        return result[0];
      }
      else if ((<any>window).msCrypto && (<any>window).msCrypto.getRandomValues) {
        var result = new Uint8Array(1);
        (<any>window).msCrypto.getRandomValues(result);
        return result[0];
      }
      else {
        return Math.floor(Math.random() * 256);
      }
    },

    generate: function(length) {
      return Array.apply(null, { 'length': length })
        .map(function() {
          var result;
          while (true) {
            result = String.fromCharCode(this._getRandomByte());
            if (this._pattern.test(result)) {
              return result;
            }
          }
        }, this)
        .join('');
    }
  };

  export function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
  }

  export function isTokenExpired(token) {
    try {
      return isTExpired(token);
    } catch (err) {
      Tools.Debug.error("Error validating token " + err);
      return true;
    }
  }

  export function mergeInto(obj1, obj2, allowed: string[]) {
    for (let attrname in obj1)
      if (allowed.includes(attrname)) obj2[attrname] = obj1[attrname];
  }

  export function mergeIntoRemovePrefix(obj1, obj2, prefix: string, allowed: string[]) {
    let pfx = prefix ? new RegExp("^" + prefix) : null;
    for (var attrname in obj1) {
      var newAttrName = attrname;
      if (pfx) newAttrName = attrname.replace(pfx, '');
      if (newAttrName.endsWith("[]"))
        newAttrName = newAttrName.substring(0, newAttrName.length - 2);

      if (allowed.includes(newAttrName))
        obj2[newAttrName] = obj1[attrname];
    }
  }

  export function mergeIntoWithFix(obj1, obj2, prefix: string, postfix: string, allowed: string[]) {
    for (var attrname in obj1) {
      if (!allowed.includes(attrname))
        continue;

      var newAttrName = attrname;
      if (prefix != undefined)
        newAttrName = prefix + newAttrName;
      if (postfix != undefined)
        newAttrName = newAttrName + postfix;

      var val = obj1[attrname];
      if (Array.isArray(val))
        newAttrName += "[]";

      obj2[newAttrName] = val;
    }
  }

  export function mergeObjsInto(objs: Array<Object>, obj2) {
    for (var i in objs) {
      var obj = objs[i];
      for (var attrname in obj)
        obj2[attrname] = obj[attrname];
    }
  }
}
