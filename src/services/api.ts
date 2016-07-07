import {Base, LS} from './base';
import {W6} from './withSIX';
import {Mediator, LegacyMediator} from './mediator';
import {Toastr} from './toastr';
import {ListFactory, uiCommand2} from './reactive';
import {Tools} from './tools';
import {IBreezeErrorReason, IBreezeSaveError} from './legacy/misc';
import {ContentHelper} from './helpers';

import breeze from 'breeze-client';
import {HttpClient} from 'aurelia-http-client';
import {Client} from 'withsix-sync-api';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService, DialogController} from 'aurelia-dialog';
import {inject, Container} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Router} from 'aurelia-router';

const routing = require('../../data/routing.json');

export class CloseDropdowns { }
export class CloseDialogs { }
export class OpenCreateCollectionDialog { constructor(public game) { } }
export class OpenAddModDialog { constructor(public game, public info?) { } }
export class OpenAddModsToCollectionsDialog { constructor(public gameId: string, public mods: any[], public collections?: any[]) { } }
export class RestoreBasket { }

@inject(HttpClient, W6)
export class RouteHandler {
  routingData;
  site: string;
  constructor(private http: HttpClient, private w6: W6) { }

  async configure(site: string) {
    this.site = site;
    // may not use Authorization header
    let main = routing["main"]
    let routes = routing["play"];
    for (let e in routes) main["/p" + (e == "/" ? "" : e)] = routes[e];
    routes = routing["connect"];
    for (let e in routes) main[e] = routes[e];
    this.routingData = routing;

  }
  getRouteMatch(fragment) {
    var data = this.routingData[this.site];
    for (var d in data) {
      var match = this.getRouteSpecificMatch(fragment, d, data[d]);
      if (match)
        return match;
    }
    return null;
  }

  cache = {};

  getRx(d) {
    var rx = d.split("/");
    var newRx = [];
    rx.forEach(e => {
      if (e.startsWith(":")) {
        if (e.endsWith("?"))
          newRx.push("?([^/]*)");
        else
          newRx.push("([^/]+)");
      } else {
        newRx.push(e);
      }
    });
    var rxStr = '^' + newRx.join("/") + '$';
    return new RegExp(rxStr, "i");
  }

  getRouteSpecificMatch(fragment, d, data) {
    if (fragment.match(this.cache[d] || (this.cache[d] = this.getRx(d))))
      return data;
  }
}

export interface ITabNotification {
  title?: string;
  text?: string;
  details?: string;
  icon?: string;
  cls?: string;
  active?: boolean;
  view?: string;
  href?: string;
  progress?: number;
  speed?: number;
  command?: ICommand<any>;
  isPersistent?: boolean;
}

@inject(Client, EventAggregator, LS)
export class Api {
  constructor(private client: Client, private eventBus: EventAggregator, private ls: LS) {
    // we could use debounce here, but then the menus don't close on the initiation of the scroll, but rather on the stop.
    // so throttle seems the better option
    this.subj.throttle(1000).subscribe(x => this.eventBus.publish(new CloseDropdowns()));
  }
  subj = new Rx.Subject();
  showOpenDialog(options: { defaultPath?: string, properties?}) { return this.client.hubs.client.browseFolderDialog(options); }
  closeDropdowns = () => this.subj.onNext(null);
  refreshPlaylist = () => this.ls.set('w6.event', { name: 'refresh-playlist' });
  get tools() { return Tools }
  openSettings = (model?) => this.eventBus.publish(new OpenSettings());
  createCommand = uiCommand2;
  getContentStateInitial = ContentHelper.getConstentStateInitial;
  logout;// = () => this.w6.logout();
  login; //= () => this.w6.openLoginDialog();
  navigate; // = (url) => this.w6.navigate(url);
  errorMsg = (reason) => {
    try {
      this.tools.Debug.log("$$$ err reason", JSON.stringify(reason));
    } catch (err) { this.tools.Debug.warn("Err while converting error reason", err) }

    if (reason instanceof String) return [reason, 'Unknown error occurred'];
    if (reason instanceof Tools.NotFoundException || reason instanceof Tools.InvalidShortIdException) return [reason.message, "404: The requested resource could not be found"];
    if (reason instanceof Tools.HttpException) return this.handleHttpError(reason);
    if (reason instanceof Tools.RequireSslException) return [reason.message, "please wait until you are redirected", "Requires SSL"];
    if (reason instanceof Tools.RequireNonSslException) return [reason.message, "please wait until you are redirected", "Requires NO-SSL"];
    if (reason.entityErrors && reason.entityErrors.length > 0) return this.handleBreezeSaveError(reason);
    if (reason.httpResponse != null) return this.handleBreezeErrorResponse(reason);
    return [reason, 'Unknown error'];
  }

  handleBreezeSaveError(r: IBreezeSaveError) {
    if (r.entityErrors.length == 0) return this.handleBreezeErrorResponse(<any>r);
    return [r.entityErrors.map(x => x.errorMessage).join("\n"), "Validation failed"]; // //x.propertyName + ": " + x.errorMessage;
  }

  handleBreezeErrorResponse(r: IBreezeErrorReason) {
    let requestId = r.httpResponse.status ? r.httpResponse.getHeaders('withSIX-RequestID') : 'FAIL';
    Tools.Debug.error('ERROR during request, Request ID: ' + requestId, r);
    let d = r.httpResponse.data;
    if (!d) return ["Site down?!", 'Unknown Error'];
    if (!d.ExceptionType || !d.ExceptionMessage) return [d.Message, 'Unknown Error'];
    switch (d.ExceptionType) {
      case "SN.withSIX.Api.Models.Exceptions.ArchivedException":
        return [d.ExceptionMessage, 'This Content is currently unavailable'];
      default:
        return [d.ExceptionMessage, 'Unknown Error'];
    }
  }

  handleHttpError(r: Tools.IHttpException<Tools.ErrorResponseBody>) {
    Tools.Debug.error('ERROR during request, Request ID: ' + r.headers['withSIX-RequestID'], r);
    let message = r.body && r.body.message || '';
    if (r instanceof Tools.ValidationError && r.modelState) angular.forEach(r.modelState, (v, k) => message += "\n" + v);
    let status = r.status && r.statusText ? "\n(" + r.status + ": " + r.statusText + ")" : '';
    return [message + status, `Request failed`];
  }

  createGameBasket = (gameId, basketModel) => { return null; }
}



export class ShowTabNotification {
  constructor(public name: string, public notification: ITabNotification) { }
}

export class SelectTab {
  constructor(public name: string) { }
}


@inject(EventAggregator)
export class Notifier {
  constructor(private eventBus: EventAggregator) { }

  raiseTabNotification(tabName: string, notification: ITabNotification) {
    this.eventBus.publish(new ShowTabNotification(tabName, notification));
  }
}

export class OpenSettings { }


class Ipc<T> {
  static statId = 0;
  id: number;
  promise: Promise<T>
  resolve; reject;
  constructor() {
    this.id = Ipc.statId++;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })
  }
}
class IpcHandler {
  get tools() { return Tools }
  messages = new Map<number, Ipc<any>[]>();
  api;
  constructor() {
    var w = <any>window;
    this.api = w.api;
    this.api.signalrListeners2.push(this.receive);
  }
  send<T>(hub, message, data?) {
    var msg = new Ipc<T>();
    this.messages[msg.id] = msg;
    this.tools.Debug.log("Sending message", msg);
    this.api.sendSignalrMessage(msg.id, hub, message, data);
    this.tools.Debug.log("Sent message", msg);
    return msg.promise;
  }

  receive = (id, type, args) => {
    try {
      if (type == 0)
        this.messages[id].resolve(args);
      else
        this.messages[id].reject(args);
    } finally {
      this.messages.delete(id);
    }
  }
}

@inject(IpcHandler)
export class Test {
  constructor(ipcHandler: IpcHandler) { }
}
