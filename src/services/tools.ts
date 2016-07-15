import VersionCompare from 'version_compare';
import {IDisposable} from './base';
import {createError} from '../helpers/utils/errors';
import {toShortId as toS, fromShortId as fromS} from '../helpers/utils/string';
import {removeEl as rEl, enumToMap as eToMap} from '../helpers/utils/iterable';
import {isTokenExpired as isTExpired} from '../helpers/utils/jwt';

declare var URL;

// TODO: Decompose
export module Tools {
  // for legacy purposes
  export const toShortId = toS;
  export const fromShortId = fromS;
  export const removeEl = rEl;
  export const enumToMap = eToMap;

  // TODO https://github.com/github/url-polyfill
  export function createUrl(url: string) {
    try {
      return new URL(url);
    } catch (err) {
      var parser = document.createElement('a');
      parser.href = url;
      return parser;
    }
  }

  export function buildUrl(url: string) {
    if (url.startsWith("//")) return Tools.createUrl(window.location.protocol + url);
    return Tools.createUrl(url);
  }

  export const createHttpError = (name: string, proto = Error.prototype): HttpErrorConstructor<any> => {
    var f = function(message: string, requestInfo: IRequestInfo<any>) {
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
      Object.defineProperty(this, 'headers', {
        enumerable: false,
        writable: true,
        value: requestInfo.headers
      });
      Object.defineProperty(this, 'requestID', {
        enumerable: false,
        writable: true,
        value: requestInfo.headers ? requestInfo.headers['withSIX-RequestID'] : null
      });

      if (requestInfo.body && requestInfo.body.modelState) {
        Object.defineProperty(this, 'modelState', {
          enumerable: false,
          writable: true,
          value: requestInfo.body.modelState
        });
      }

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
    headers?: Headers;
  }


  export interface HttpErrorConstructor<T extends ErrorResponseBody> {
    new (message: string, requestInfo: IRequestInfo<T>): IHttpException<T>;
  }

  export interface ValidationErrorConstructor {
    new (message: string, requestInfo: IRequestInfo<ValidationResponseBody>): IValidationException;
  }

  export interface IHttpException<T extends ErrorResponseBody> extends Error, IRequestInfo<T> { }
  export interface IValidationException extends IHttpException<ValidationResponseBody> {
    modelState?;
  }

  export interface ErrorResponseBody {
    message: string;
  }

  export interface ValidationResponseBody extends ErrorResponseBody {
    modelState?
  }

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

  var cleanup = (str: string, sign: string) => {
    if (str.endsWith("&")) str.substring(0, str.length - 1);
    if (str == sign) str = "";
    return str;
  }

  export var cleanupHash = (hash: string) => cleanup(hash, '#');
  export var cleanupSearch = (search: string) => cleanup(search, '?');

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

  export function isTokenExpired(token) {
    try {
      return isTExpired(token);
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

  export function handleOverrides(opts, overrideOpts) { return Object.assign(opts, overrideOpts) }

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
