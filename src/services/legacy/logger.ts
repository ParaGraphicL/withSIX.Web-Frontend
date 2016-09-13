import {inject} from 'aurelia-framework';
import {Tk} from './tk';
import { ErrorWithOptionalInner } from '../../helpers/utils/errors';
import {Tools} from '../tools';
import {W6} from '../withSIX';
import {Logger} from 'aurelia-logging';
import {ValidationResult} from 'aurelia-validation';
import { ClientConnectionFailed } from 'withsix-sync-api';

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
LE.init(Tools.env === Tools.Environment.Production ? '3a2f5219-696a-4498-92b5-0fe5307f8103' : '79397c51-5b4d-4a47-8ef5-4fce44cdea00');

// TODO: https://github.com/aurelia/framework/issues/174
// https://www.npmjs.com/package/aurelia-rollbar

// TODO: Implement sane UseCase (Command/Query) error handling process:
// - Initiator handlers should handle expected errors
//  - Commands (clicks, etc)
//  - Queries (routing, loading, refreshing etc)
// When the errors are not handled by iniator handlers, the initiator (One for commands, and e.g one for Router Queries) should handle the error. General recovery options may be available, like render 401, 403, 404 content.
// Eventually, a global error handler will take over. Global recovery options may be available

// So mediator decorators and deeper should only handle retryable errors

@inject(ToastLogger, W6)
export class GlobalErrorHandler {
  private logSilentErrors = false;
  private logStacktraces = true;
  constructor(private toastr: ToastLogger, private w6: W6) { }
  silenceGeneral = ["Error during negotiation request.", "The user cancelled the operation", 'Operation aborted', 'A connection to the client could not be made'];
  silenceGeneralTypes = [ClientConnectionFailed]
  silenceAngular = [
    // These are coming from Angular elements that no longer exist, while Angular (components) expect the element to still live.
    "Cannot read property 'toLowerCase' of undefined", "Cannot read property 'toUpperCase' of undefined",
    "Unable to get property 'toLowerCase' of undefined or null reference", "Unable to get property 'toUpperCase' of undefined or null reference",
    "f[0].nodeName is undefined"
  ];
  silenceAngularAction = [];
  silenceWindow = [
    // This comes from the browser disallowing cross-origin calls: http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
    'Script error', 'Script error.'
  ];

  handleAngularError = (exception: Error, cause?: string) => { 
    if (!this.isSilenceAngular(exception)) { 
      let info = this.getErrorInfo(`[Angular]`, cause, exception); this.tryErrorLog(info); this.leLog(info)
    }
  }
  handleAngularActionError = (exception: Error, cause?: string) => { 
    if (!this.isUserError(exception))
      this.handleErrorInternal(`[Angular Action]`, exception, cause, this.isSilenceAngularAction(exception))
  }
  handleUseCaseError = (exception: Error, cause = 'Unknown') => { 
    if (!this.isUserError(exception)) 
      this.handleErrorInternal('[Command]', exception, cause)
  }
  handleLog = (loggerId, ...logParams: any[]) => this.leLog(`[Aurelia: ${loggerId}]`, ...logParams)
  handleWindowError = (message: string, source, line: number, column: number, error?: Error) => {
    if (!this.isSilenceWindow(message)) 
      this.leLog(`[Window] ${message}`, source, line, column, error && this.logStacktraces ? this.getFullStack(error) : null)
  }
  private shouldSilentWindow = (msg: string, err?: Error) => (err && this.isSilenceGeneral(err)) || this.isSilenceWindow(msg) || this.isSilentFilteredMsg(msg, this.silenceGeneral);

  private handleErrorInternal(source: string, exception: Error, cause?: string, silent = false) {
    if (!silent && this.isSilenceGeneral(exception)) silent = true;
    if (silent && !this.logSilentErrors) return;
    const errorInfo = this.getErrorInfo(source, cause, exception);
    this.tryErrorLog(errorInfo);
    this.leLog(errorInfo, this.logStacktraces ? this.getFullStack(exception) : null);
    if (!silent) return this.toastr.error(`${errorInfo}\nWe were notified about the problem.`, 'Unexpected error has occurred');
  }

  private getFullStack(err: Error) {
    let stack = err.stack || "";
    let subError: ErrorWithOptionalInner = err;
    while (subError = subError.inner) {
      stack += `\n${subError}:\n${subError.stack}`
    }
    return stack;
  }

  private getErrorInfo(source, cause, exception) {
    const causeInfo = cause ? ` (Cause: ${cause})` : '';
    return `${source} An unexpected error has occured: ${exception}${causeInfo}`;
  }

  private getInfo = () => { return { userId: this.w6.userInfo.id, roles: this.w6.userInfo.roles, location: window.location.pathname + window.location.search + window.location.hash, ua: window.navigator.userAgent } }

  private leLog(message, ...params) { LE.error(message, this.getInfo(), ...params); }

  private tryErrorLog(msg, ...args) {
    try {
      if (window.console && window.console.error) { window.console.error(msg, ...args); }
    } catch (err) { }
  }

  userExceptions = [Tools.NotFoundException, Tools.Forbidden, Tools.ValidationError, Tools.RequiresLogin, Tools.RequireSslException, Tools.RequireNonSslException, ValidationResult];
  private isUserError(err: Error) { return this.userExceptions.some(x => err instanceof x) }

  private isSilenceGeneral = (err: Error) => this.isSilentFiltered(err, this.silenceGeneral, this.silenceGeneralTypes);
  private isSilenceAngular = (err: Error) => this.isSilentFiltered(err, this.silenceAngular);
  private isSilenceAngularAction = (err: Error) => this.isSilentFiltered(err, this.silenceAngularAction);
  private isSilenceWindow = (msg: string) => this.isSilentFilteredMsg(msg, this.silenceWindow);
  
  private isSilentFiltered = (err: Error, silencia: string[], silenciaTypes?: Function[]) => 
    (silenciaTypes && this.isSilentFilteredType(err, silenciaTypes)) || this.isSilentFilteredMsg(err.message, silencia);
  private isSilentFilteredType = (err: Error, silenciaTypes: Function[]) => silenciaTypes.some(x => err instanceof x)
  private isSilentFilteredMsg = (msg: string, silencia: string[]) => silencia.some(x => x === msg)
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
