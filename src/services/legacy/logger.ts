import {inject} from 'aurelia-framework';
import {Tk} from './tk';
import {Tools} from '../tools';
import {W6} from '../withSIX';
import {Logger} from 'aurelia-logging';

export class ToastLogger {
  constructor() {

    // This logger wraps the toastr logger and also logs to console using ng $log
    // toastr.js is library by John Papa that shows messages in pop up toast.
    // https://github.com/CodeSeven/toastr

    toastr.options.timeOut = 3 * 1000;
    toastr.options.positionClass = 'toast-bottom-right';
  }

  public error(message: string, title: string = null, options?: ToastrOptions) {
    var opts = { timeOut: 10 * 1000 };
    if (options) Object.assign(opts, options);
    toastr.error(message, title, opts);
    Tools.Debug.error("Error: " + message);
  }

  public errorRetry(message: string, title: string = null, options?: ToastrOptions) {
    var opts = {
      timeOut: 0,
      extendedTimeOut: 0,
      tapToDismiss: false
    };
    if (options) Object.assign(opts, options);
    Tools.Debug.error("ErrorRetry: " + title);
    return toastr.error(message, title, opts);
  }

  public info(message: string, title: string = null, options?: ToastrOptions) {
    Tools.Debug.info("Info: " + message);
    return toastr.info(message, title, options);
  }

  public success(message: string, title: string = null, options?: ToastrOptions) {
    Tools.Debug.info("Success: " + message);
    return toastr.success(message, title, options);
  }

  public warning(message: string, title: string = null, options?: ToastrOptions) {
    var opts = { timeOut: 10 * 1000 };
    if (options) Object.assign(opts, options);
    Tools.Debug.warn("Warning: " + message);
    return toastr.warning(message, title, opts);
  }

  public log(message) { Tools.Debug.log(message); }
}

//const LE = <any>require('le_js/product/le.min');
declare var LE: { init; error; log; info; warn; debug; trace };
LE.init(Tools.getEnvironment() == Tools.Environment.Production ? '3a2f5219-696a-4498-92b5-0fe5307f8103' : '79397c51-5b4d-4a47-8ef5-4fce44cdea00');

// TODO: https://github.com/aurelia/framework/issues/174
// https://www.npmjs.com/package/aurelia-rollbar

@inject(ToastLogger, W6)
export class GlobalErrorHandler {
  private logSilentErrors = true;
  private logStacktraces = true;
  constructor(private toastr: ToastLogger, private w6: W6) { }
  silence = [];
  silenceAngular = ["Cannot read property 'toLowerCase' of undefined", "Cannot read property 'toUpperCase' of undefined"];

  handleError = (exception: Error, cause = 'Unknown') => this.handleErrorInternal(`[Aurelia]`, exception, cause, this.silence.some(x => x === exception.message));
  handleAngularError = (exception: Error, cause?: string) => this.handleErrorInternal(`[Angular]`, exception, cause, this.silenceAngular.some(x => x === exception.message));
  handleUseCaseError = (exception: Error, cause = 'Unknown') => this.leLog(`[Aurelia UC ${cause}] ${exception}`, (<any>exception).stack);
  handleLog = (loggerId, ...logParams: any[]) => this.leLog(`[Aurelia: ${loggerId}]`, ...logParams);
  handleWindowError = (message, source, line, column, error?) => this.leLog(`[Window] ${message}`, source, line, column, error ? error.toString() : null, error ? error.stack : null);

  private handleErrorInternal(source: string, exception, cause?: string, silent = false) {
    if (silent && !this.logSilentErrors) return;
    let causeInfo = cause ? ` (Cause: ${cause})` : '';
    let errorInfo = `${source} An unexpected error has occured: ${exception}${causeInfo}`;
    this.tryErrorLog(errorInfo);
    this.leLog(errorInfo, this.logStacktraces && exception.stack ? exception.stack : null);
    if (!silent) return this.toastr.error(`${errorInfo}\nPlease report the issue.`, 'Unexpected error has occurred');
  }

  private getInfo = () => { return { userId: this.w6.userInfo.id, roles: this.w6.userInfo.roles, location: window.location.pathname + window.location.search + window.location.hash, ua: window.navigator.userAgent } }

  private leLog(message, ...params) { LE.error(message, this.getInfo(), ...params); }

  private tryErrorLog(msg, ...args) {
    try {
      if (window.console && window.console.error) { window.console.error(msg, ...args); }
    } catch (err) { }
  }
}

// http://www.mikeobrien.net/blog/client-side-exception-logging-in-aurelia/
@inject(GlobalErrorHandler)
export class LogAppender {
  constructor(private eh: GlobalErrorHandler) { }

  debug(logger: Logger, ...rest: any[]): void { }
  info(logger: Logger, ...rest: any[]): void { }
  warn(logger: Logger, ...rest: any[]): void { }
  error(logger: Logger, ...rest: any[]): void { this.eh.handleLog(logger.id, ...rest); }
}
