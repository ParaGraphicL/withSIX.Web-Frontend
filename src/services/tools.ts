
import VersionCompare from 'version_compare';

String.prototype.indexOfIgnoreCase = function(prefix) {
  return this.toLowerCase().indexOf(prefix.toLowerCase());
};

/*
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
*/

/*
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
};
*/

String.prototype.endsWithIgnoreCase = function(suffix) {
  return this.indexOfIgnoreCase(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWithIgnoreCase = function(prefix) {
  return this.indexOfIgnoreCase(prefix) == 0;
};

String.prototype.toUpperCaseFirst = function() {
  return this.split(" ").map(i => i[0].toUpperCase() + i.substring(1)).join(" ");
};
String.prototype.toLowerCaseFirst = function() {
  return this.split(" ").map(i => i[0].toLowerCase() + i.substring(1)).join(" ");
};

String.prototype.containsIgnoreCase = function(prefix) {
  return this.indexOfIgnoreCase(prefix) > -1;
};

String.prototype.equalsIgnoreCase = function(prefix) {
  return this.toLowerCase() == prefix.toLowerCase();
};

String.prototype.toShortId = function() {
  return Tools.toShortId(this);
};

String.prototype.sluggify = function() {
  return Tools.sluggify(this);
};
String.prototype.sluggifyEntityName = function() {
  return Tools.sluggifyEntityName(this);
};
String.prototype.truncate = function(count: number) {
  if (this.length <= count) return this;
  return this.substring(0, count) + '..';
}
String.prototype.format = function() {
  var s = this,
    i = arguments.length;

  while (i--) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }
  return s;
};


export module Tools {
  // todo; with inner ex

  // class Exception extends ExtendableError {
  //     public innerException: Error;
  //     constructor(message?: string, innerException?: Error|string) {
  //         super(message);
  //         // if (typeof (<any>Error).captureStackTrace === 'function') {
  //         //     //noinspection JSUnresolvedFunction
  //         //     (<any>Error).captureStackTrace(this, arguments.callee);
  //         // }
  //         this.name = "Exception";
  //         if (innerException) {
  //             if (innerException instanceof Error) {
  //                 this.innerException = innerException;
  //                 this.message = message + ", innerException: " + this.innerException.message;
  //             }
  //             else if (typeof innerException === "string") {
  //                 this.innerException = new Error(innerException);
  //                 this.message = message + ", innerException: " + this.innerException.message;
  //             }
  //             else {
  //                 // this.innerException = <any>innerException;
  //                 // this.message = message + ", innerException: " + this.innerException;
  //             }
  //         }
  //         else {
  //             this.message = message;
  //         }
  //     }
  // }
  //


  export var createError = (name: string, proto = Error.prototype): ErrorConstructor => {
    var f = function(message: string) {
      Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: name
      });
      Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: message
      });

      if (Error.hasOwnProperty('captureStackTrace')) { // V8
        (<any>Error).captureStackTrace(this, this.constructor);
      } else {
        Object.defineProperty(this, 'stack', {
          enumerable: false,
          writable: false,
          value: (<any>(new Error(message))).stack
        });
      }
    }
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(f.prototype, proto);
    } else {
      f.prototype = Object.create(proto);
    }
    return <any>f;
  }

  export interface IRequestInfo<T> {
    status: number;
    statusText: string;
    body: T;
  }

  export var createHttpError = (name: string, proto = Error.prototype): HttpErrorConstructor<any> => {
    var f = function(message: string, requestInfo: IRequestInfo<any>) {
      Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: name
      });
      Object.defineProperty(this, 'status', {
        enumerable: false,
        writable: false,
        value: requestInfo.status
      });
      Object.defineProperty(this, 'statusText', {
        enumerable: false,
        writable: false,
        value: requestInfo.statusText
      });

      Object.defineProperty(this, 'body', {
        enumerable: false,
        writable: false,
        value: requestInfo.body
      });
      Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: message
      });

      if (Error.hasOwnProperty('captureStackTrace')) { // V8
        (<any>Error).captureStackTrace(this, this.constructor);
      } else {
        Object.defineProperty(this, 'stack', {
          enumerable: false,
          writable: false,
          value: (<any>(new Error(message))).stack
        });
      }
    }
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(f.prototype, proto);
    } else {
      f.prototype = Object.create(proto);
    }
    return <any>f;
  }

  export interface HttpErrorConstructor<T> {
    new (message: string, requestInfo: IRequestInfo<T>): IHttpException<T>;
  }

  export interface IHttpException<T> extends Error, IRequestInfo<T> { }

  // TODO: ES6/TS valid exceptions
  export var RequireSslException = createError('RequireSslException');
  export var RequireNonSslException = createError('RequireNonSslException');
  export var InvalidShortIdException = createError('InvalidShortIdException');
  export var HttpException = createHttpError('HttpException');
  export var NotFoundException = createHttpError('NotFoundException', HttpException.prototype);
  export var Forbidden = createHttpError("Forbidden", HttpException.prototype);
  export var ValidationError = createHttpError("ValidationError", HttpException.prototype);
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

  var hexList = '0123456789abcdef';
  var b64List = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  export var emptyGuid = '00000000-0000-0000-0000-000000000000';

  declare var escape;

  var cleanup = (str: string, sign: string) => {
    if (str.endsWith("&")) str.substring(0, str.length - 1);
    if (str == sign) str = "";
    return str;
  }

  export var cleanupHash = (hash: string) => cleanup(hash, '#');
  export var cleanupSearch = (search: string) => cleanup(search, '?');

  // we still use arrays over the wire, so that we dont waste bw..
  export function aryToMap<K, V>(ary: V[], keyFunc: (x: V) => K) {
    let map = new Map<K, V>();
    ary.forEach(x => map.set(keyFunc(x), x));
    return map;
  }

  export function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  export function versionCompare(x, y) { return (<any>VersionCompare).compare(x, y, { zeroExtend: true }); }

  export function generateGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

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

  export function enumToMap<K, V>(ary: Enumerable<V>, keyFunc: (x: V) => K) {
    return this.aryToMap(ary.toArray(), keyFunc); // todo use iterable instead..
  }

  function jwtHelperInt() {

    this.urlBase64Decode = function(str) {
      var output = str.replace(/-/g, '+').replace(/_/g, '/');
      switch (output.length % 4) {
        case 0: { break; }
        case 2: { output += '=='; break; }
        case 3: { output += '='; break; }
        default: {
          throw 'Illegal base64url string!';
        }
      }
      return decodeURIComponent(escape(atob(output))); //polyfill https://github.com/davidchambers/Base64.js
    }


    this.decodeToken = function(token) {
      var parts = token.split('.');

      if (parts.length !== 3) {
        throw new Error('JWT must have 3 parts');
      }

      var decoded = this.urlBase64Decode(parts[1]);
      if (!decoded) {
        throw new Error('Cannot decode the token');
      }

      return angular.fromJson(decoded);
    }

    this.getTokenExpirationDate = function(token) {
      var decoded = this.decodeToken(token);

      if (typeof decoded.exp === "undefined") {
        return null;
      }

      var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
      d.setUTCSeconds(decoded.exp);

      return d;
    };

    this.isTokenExpired = function(token, offsetSeconds) {
      var d = this.getTokenExpirationDate(token);
      offsetSeconds = offsetSeconds || 0;
      if (d === null) {
        return false;
      }

      // Token expired?
      return !(d.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
    };
  }
  var jwtHelper = new jwtHelperInt();

  export function isTokenExpired(token) {
    try {
      return jwtHelper.isTokenExpired(token);
    } catch (err) {
      Tools.Debug.error("Error validating token " + err);
      return true;
    }
  }

  export function uriHasProtocol(uri: string) {
    return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("//") || uri.startsWith("blob:");
  }

  export function encodeQueryData(data) {
    var ret = [];
    for (var d in data)
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    return ret.join("&");
  }

  export function joinUri(parts: string[]): string { return parts.join("/"); }

  const supportsDescriptors = true;
  export function defineProperty(object, name, value, force) {
    if (!force && name in object) { return; }
    if (supportsDescriptors) {
      Object.defineProperty(object, name, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: value
      });
    } else {
      object[name] = value;
    }
  };

  // Define configurable, writable and non-enumerable props
  // if they don’t exist.
  export function defineProperties(object, map) {
    Object.keys(map).forEach(name => {
      var method = map[name];
      defineProperty(object, name, method, false);
    });
  };


  export function toShortId(id: string): string {
    return base64ToShort(guidToBase64(id, true));
  }

  export function fromShortId(shortId: string): string {
    try {
      return base64ToGuid(shortToBase64(shortId), true);
    } catch (err) {
      throw new InvalidShortIdException(shortId + " is not a valid ShortID");
    }
  }

  export function removeEl<T>(ary: T[], el: T) {
    var idx = ary.indexOf(el);
    if (idx > -1) ary.splice(idx, 1);
  }

  export function handleOverrides(opts, overrideOpts) {
    return $.extend(opts, overrideOpts);
  }

  export function mergeInto(obj1, obj2, allowed: string[]) {
    var e = allowed.asEnumerable();
    for (let attrname in obj1) {
      if (e.contains(attrname))
        obj2[attrname] = obj1[attrname];
    }
  }

  // Does not work minified, of course
  export function getClassName(obj: Object) {
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((obj).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
  };

  export function mergeIntoRemovePrefix(obj1, obj2, prefix: string, allowed: string[]) {
    let e = allowed.asEnumerable();
    for (var attrname in obj1) {
      var newAttrName = attrname;
      if (prefix != undefined)
        newAttrName = attrname.replace(new RegExp("^" + prefix), '');
      if (newAttrName.endsWith("[]"))
        newAttrName = newAttrName.substring(0, newAttrName.length - 2);

      if (e.contains(newAttrName))
        obj2[newAttrName] = obj1[attrname];
    }
  }

  export function mergeIntoWithFix(obj1, obj2, prefix: string, postfix: string, allowed: string[]) {
    let e = allowed.asEnumerable();
    for (var attrname in obj1) {
      if (!e.contains(attrname))
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

  export class KeyCodes {
    public static enter = 13;
  }

  // Convert GUID string to Base-64 in Javascript
  // by Mark Seecof, 2012-03-31

  // GUID string with four dashes is always MSB first,
  // but base-64 GUID's vary by target-system endian-ness.
  // Little-endian systems are far more common.  Set le==true
  // when target system is little-endian (e.g., x86 machine).
  //
  function guidToBase64(g, le) {
    var s = g.replace(/[^0-9a-f]/ig, '').toLowerCase();
    if (s.length != 32) return '';
    if (le)
      s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) +
        s.slice(10, 12) + s.slice(8, 10) +
        s.slice(14, 16) + s.slice(12, 14) +
        s.slice(16);
    s += '0';

    var a, p, q;
    var r = '';
    var i = 0;
    while (i < 33) {
      a = (hexList.indexOf(s.charAt(i++)) << 8) |
        (hexList.indexOf(s.charAt(i++)) << 4) |
        (hexList.indexOf(s.charAt(i++)));

      p = a >> 6;
      q = a & 63;

      r += b64List.charAt(p) + b64List.charAt(q);
    }
    r += '==';

    return r;
  } // guid_to_base64()

  function base64ToGuid(g, le) {
    var UUIDjs: any = require('uuid-js');
    var s = UUIDjs.fromBinary(atob(g)).toString();
    if (le) {
      s = s.replace(/[^0-9a-f]/ig, '').toLowerCase();
      s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) + "-" +
        s.slice(10, 12) + s.slice(8, 10) + "-" +
        s.slice(14, 16) + s.slice(12, 14) + "-" + s.slice(16, 20) + "-" + s.slice(20);
    }
    return s;
  }

  function base64ToShort(base64) {
    return base64.substring(0, 22).replace(/\//g, "_").replace(/\+/g, "-");
  }

  function shortToBase64(shortBase64) {
    return shortBase64.substring(0, 22).replace(/_/g, "/").replace(/\-/g, "+") + "==";
  }



  var r = new RegExp("[^A-Za-z0-9-]+", "g");
  var r2 = new RegExp("^[-]+");
  var r3 = new RegExp("[-]+$");

  // TODO: This is not as good as the C# version we use!
  export function sluggify(str: string) {
    return sluggifyEntityName(str.toLowerCase());
  }

  export function sluggifyEntityName(str: string) {
    str = str.replace(r, match => {
      switch (match) {
        case "'":
          {
            return "";
          }
        case "+":
          {
            return "plus";
          }
        default:
          {
            return "-";
          }
      }
    })
      .trim();
    str = str.replace(r2, "");
    str = str.replace(r3, "");
    return str;
  }

  export var debug = false;

  export enum Environment {
    Production,
    Staging,
    Local,
    Local2
  }

  export enum LogLevel {
    // ReSharper disable InconsistentNaming
    debug,
    log,
    info,
    warn,
    error,
    trace,
    none
    // ReSharper restore InconsistentNaming
  }

  var environment = Environment.Production;

  export var getEnvironment = (): Environment => {
    return environment;
  };

  export var setEnvironment = (env: Environment) => {
    environment = env;
    debug = env == Environment.Local || env == Environment.Local2;
    Debug.setLoggingLevel(env == Environment.Production ? LogLevel.info : LogLevel.debug);
  };

  export class _DebugBase {
    public setLoggingLevel = (logLevel: LogLevel) => {
      _DebugBase._logLevel = logLevel;
    };
    public getLoggingLevel = () => {
      return _DebugBase._logLevel;
    };
    static _logLevel: LogLevel = LogLevel.debug;

    objectName: string = null;

    getObjectName = (): string => {
      return "[" + this.objectName + "]";
    };
    static shouldLog = (level: LogLevel): boolean => {
      return level >= _DebugBase._logLevel;
    };
    writeInner = (level: LogLevel, message: Object, optionalParams: any[]) => {
      if (this.objectName != null) {
        optionalParams.unshift(message);
        _DebugBase._writeInner(level, this.getObjectName(), optionalParams);
      } else
        _DebugBase._writeInner(level, message, optionalParams);
    };
    static _writeInner = (level: LogLevel, message: Object, optionalParams: any[]) => {
      if (console == null) return;

      if (console.hasOwnProperty(LogLevel[level]))
        _DebugBase._write(level, message, optionalParams);
      else {
        optionalParams.unshift(message);
        _DebugBase._write(LogLevel.log, LogLevel[level].toUpperCase() + ":", optionalParams);
      }
    };
    static _writePreProcessInner = (level: LogLevel, message: Object, ...optionalParams: any[]) => {
      _DebugBase._writeInner(level, message, optionalParams);
    };
    writePreProcess = (level: LogLevel, msgFunc: () => Object, optionalParams: { (): Object; }[]) => {
      if (this.objectName != null) {
        optionalParams.unshift(msgFunc);
        _DebugBase._writePreProcess(level, () => this.getObjectName(), optionalParams);
      } else
        _DebugBase._writePreProcess(level, msgFunc, optionalParams);
    };
    static _writePreProcess = (level: LogLevel, msgFunc: () => Object, optionalParams: { (): Object; }[]) => {
      if (_DebugBase.shouldLog(level)) {
        if (!optionalParams) {
          _DebugBase._writePreProcessInner(level, msgFunc());
        } else {
          switch (optionalParams.length) {
            case 0:
              _DebugBase._writePreProcessInner(level, msgFunc());
              break;
            case 1:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0]());
              break;
            case 2:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1]());
              break;
            case 3:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2]());
              break;
            case 4:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3]());
              break;
            case 5:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4]());
              break;
            case 6:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5]());
              break;
            case 7:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6]());
              break;
            case 8:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7]());
              break;
            case 9:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7](), optionalParams[8]());
              break;
            case 10:
              _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7](), optionalParams[8](), optionalParams[9]());
              break;
            default:
              throw new Error("If you have more than 10 Optional Parameters you are doing it wrong.");
          }
        }
      }
    };
    static _write = (level: LogLevel, message: Object, optionalParams: any[]) => {
      if (level == LogLevel.none) {
        throw new Error("You should not set the log level of a message to none.");
      }

      if (console == null)
        return;

      if (_DebugBase.shouldLog(level)) {
        var logger = console[LogLevel[level]];
        if (!logger) throw new Error("Loglevel doesnt exist: " + level);
        logger = logger.bind(console);
        if (!optionalParams) {
          logger(message);
        } else {
          switch (optionalParams.length) {
            case 0:
              logger(message);
              break;
            case 1:
              logger(message, optionalParams[0]);
              break;
            case 2:
              logger(message, optionalParams[0], optionalParams[1]);
              break;
            case 3:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2]);
              break;
            case 4:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3]);
              break;
            case 5:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4]);
              break;
            case 6:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5]);
              break;
            case 7:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6]);
              break;
            case 8:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7]);
              break;
            case 9:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7], optionalParams[8]);
              break;
            case 10:
              logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7], optionalParams[8], optionalParams[9]);
              break;
            default:
              throw new Error("If you have more than 10 Optional Parameters you are doing it wrong.");
          }
        }
      }
    };
  }

  export class DebugBase extends _DebugBase implements DebugInner.IDebug {
    public error(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.error, message, optionalParams);
    }

    public debug(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.debug, message, optionalParams);
    }

    public log(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.log, message, optionalParams);
    }

    public info(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.info, message, optionalParams);
    }

    public trace(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.trace, message, optionalParams);
    }

    public warn(message: Object, ...optionalParams: any[]): void {
      this.writeInner(LogLevel.warn, message, optionalParams);
    }

    public write = this.writeInner;

    public p = new DebugProcessClass();
    public r = new DebugRun();

    public generateDebugForName(name: string): DebugInner.IDebug {
      var dbg = new DebugBase();
      dbg.objectName = name;
      return dbg;
    }
  }

  export class DebugProcessClass extends _DebugBase implements DebugInner.IDebugPostProcess {

    public error(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.error, message, optionalParams);
    }

    public debug(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.debug, message, optionalParams);
    }

    public log(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.log, message, optionalParams);
    }

    public info(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.info, message, optionalParams);
    }

    public trace(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.trace, message, optionalParams);
    }

    public warn(message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(LogLevel.warn, message, optionalParams);
    }

    public write(level: LogLevel, message: () => Object, ...optionalParams: { (): Object; }[]): void {
      this.writePreProcess(level, message, optionalParams);
    }
  }

  export class DebugRun extends _DebugBase implements DebugInner.IDebugRun {

    public production(action: () => void): void {
      this.run(Environment.Production, action);
    }

    public staging(action: () => void): void {
      this.run(Environment.Staging, action);
    }

    public local(action: () => void): void {
      this.run(Environment.Local, action);
    }

    public local2(action: () => void): void {
      this.run(Environment.Local2, action);
    }

    public run(environment: Environment, action: () => void): void {
      if (getEnvironment() >= environment)
        action();
    }
  }

  export var Debug: DebugInner.IDebug = new DebugBase();


  export module DebugInner {

    export interface IDebug {
      error: (message: Object, ...optionalParams: any[]) => void;
      debug: (message: Object, ...optionalParams: any[]) => void;
      log: (message: Object, ...optionalParams: any[]) => void;
      info: (message: Object, ...optionalParams: any[]) => void;
      trace: (message: Object, ...optionalParams: any[]) => void;
      warn: (message: Object, ...optionalParams: any[]) => void;
      write: (level: LogLevel, message: Object, ...optionalParams: any[]) => void;

      p: IDebugPostProcess;
      r: IDebugRun;

      generateDebugForName: (name: string) => IDebug;
      setLoggingLevel(level: LogLevel);
    }

    export interface IDebugPostProcess {
      error: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      debug: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      log: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      info: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      trace: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      warn: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
      write: (level: LogLevel, message: () => Object, ...optionalParams: { (): Object; }[]) => void;
    }

    export interface IDebugRun {
      production: (action: () => void) => void;
      staging: (action: () => void) => void;
      local: (action: () => void) => void;
      local2: (action: () => void) => void;
      run: (environment: Environment, action: () => void) => void;
    }
  }
}

function setupEnv() {
  if (window.location.host.includes("withsix.com")) {
    Tools.setEnvironment(0);
  } else if (window.location.host.includes("staging.withsix.net")) {
    Tools.setEnvironment(1);
  } else if (window.location.host.includes("localhost")) {
    Tools.setEnvironment(2);
  } else {
    Tools.setEnvironment(3);
  }
}

if (window && window.location) setupEnv();
