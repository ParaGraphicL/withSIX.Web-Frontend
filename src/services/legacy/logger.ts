import {inject} from 'aurelia-framework';
import {Tk} from './tk';
import {Tools} from '../tools';

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

@inject(ToastLogger)
export class GlobalErrorHandler {
  constructor(private toastr: ToastLogger) { }

  // TODO: https://github.com/aurelia/framework/issues/174
  // https://www.npmjs.com/package/aurelia-rollbar
  // TODO: window.onerror (/ addEVentListenter('error') ... however what about ADsense and other unrelated errors?)
  // TODO: Auto report to the remote exception logger service..
  // http://www.mikeobrien.net/blog/client-side-exception-logging-in-aurelia/
  silence = [];
  silenceAngular = ["Cannot read property 'toLowerCase' of undefined"];

  handleError(exception: Error, cause?: string) {
    if (this.silence.some(x => x === exception.message)) return;
    Tools.Debug.error(`An unexpected error has occured: ${exception} (Cause: ${cause})\nPlease report the issue.`);
    return this.toastr.error(`An unexpected error has occured: ${exception} (Cause: ${cause})\nPlease report the issue.`, 'Unexpected error has occurred');
  }

  handleAngularError(exception: Error, cause?: string) {
    if (this.silenceAngular.some(x => x === exception.message)) return;
    return this.handleError(exception, cause);
  }
}
