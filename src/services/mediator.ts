import {UploadService, W6Context, IUserInfo, OpenAddModDialogQuery, OpenAddCollectionDialogQuery, breeze} from './legacy';
import { BasketService } from './basket-service';
import { Toastr } from './toastr';
import { Client } from 'withsix-sync-api';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Mediator, IMediator, IRequest, IRequestHandler} from 'aurelia-mediator';
import {UiContext} from './uicontext';
import {Tools} from './tools';
import {W6} from './withSIX';
import {Container} from 'aurelia-dependency-injection';
export * from 'aurelia-mediator';

@inject(W6, Toastr, Router, EventAggregator)
export class ClientMissingHandler {
  constructor(private w6: W6, private toastr: Toastr, private router: Router, private eventBus: EventAggregator) { }

  get hasActiveGame() { return this.w6.activeGame.id != null };
  get isClientConnected() { return this.w6.miniClient.isConnected; }

  async requireAccount() { this.toastr.warning("Requires account", "Please login").then(x => this.w6.openLoginDialog(null)) }

  async handleClientOrGameMissing() {
    if (!this.hasActiveGame) await this.handleActiveGameMissing();
    else if (!this.isClientConnected) await this.handleClientMissing();
  }

  async handleClientMissing() {
    if (this.w6.settings.hasSync) {
      this.addClientIframe();
      await this.handleMessage("Trying to start the client, or click here to download the Sync client");
    } else await this.handleMessage("Click here to download the Sync client");
  }

  async handleActiveGameMissing() {
    this.toastr.warning("Please select a game", "Requires an active game")
      .then(x => x ? this.openPlayTab() : null);
    this.openPlayTab();
  }

  openPlayTab = () => this.eventBus.publish(new SwitchSideBarTab('play'));

  private async handleMessage(message: string) {
    if (await this.toastr.warning(message, "Requires Sync client"))
      this.router.navigate("/download");
  }

  addClientIframe() {
    var i = document.createElement('iframe');
    i.style.display = 'none';
    i.onload = function() { i.parentNode.removeChild(i); };
    i.src = 'syncws://?launch=1';
    document.body.appendChild(i);
  }
}

// App specific starts
@inject(Mediator, Toastr, ClientMissingHandler)
export class ErrorLoggingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private toastr: Toastr, private clientMissingHandler: ClientMissingHandler) { }

  request<T>(request: IRequest<T>): Promise<T> {
    let action = (<any>request.constructor).action;
    return this.mediator.request<T>(request)
      .then(x => {
        if (action) {
          Tools.Debug.info(action + ": Success");
          this.toastr.success(action, "Success");
        }
        return x;
      })
      .catch(fail => {
        if (fail instanceof ValidationResult) this.handleValidationError(fail, action);
        else if (fail == 'Error: Error during negotiation request.') this.handleClientMissing(fail, action);
        else if (fail == 'Error: The user cancelled the operation') {
        } else this.handleGeneralError(fail, action);
        return Promise.reject<T>(fail);
      });
  }
  handleValidationError(err, action) {
    // TODO: Just disable the save button until validated?
    toastr.warning("Please fix the indicated fields", "Validation failed");
  }

  handleClientMissing = (err, action) => this.clientMissingHandler.handleClientMissing();

  handleGeneralError(err, action) {
    // TODO: Perhaps only show toast if we specified action?
    var msg = window.w6Cheat.api.errorMsg(err);
    Tools.Debug.error(msg);
    this.toastr.error(msg[0], (action || "Action") + ": " + msg[1]);
  }
}

@inject(Mediator, W6)
export class InjectingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private w6: W6) { }
  request<T>(request: IRequest<T>): Promise<T> {
    if ((<any>request).$requireUser)
      (<any>request).user = this.w6.userInfo;
    return this.mediator.request<T>(request);
  }
}

export interface IRequireUser {
  user: IUserInfo;
  //$requireUser: boolean;
}

export function requireUser() {
  return function(target) {
    Tools.defineProperties(target.prototype, { $requireUser: true })
  };
}

let ls = <{ on: (key: string, fn) => void; set: (key: string, value) => void }><any>require('local-storage');

@inject(W6Context, UploadService)
export class DbQuery<TRequest, TResponse> implements IRequestHandler<TRequest, TResponse> {
  protected ui: UiContext;
  static pageSize = 12;

  get tools() { return Tools; }

  // TODO: Move the w6context!!
  constructor(protected context: W6Context, protected upload: UploadService) {
    this.ui = Container.instance.get(UiContext);
  }
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

  protected get w6(): W6 { return <any>this.context.w6; }

  public publishCrossEvent(eventName: string, data: any) {
    this.context.eventBus.publish(data);
    // TODO: Do we need an ID incase of double events?
    ls.set('w6.event', { name: eventName, data: data });
  }

  public findBySlug(type: string, slug: string, requestName: string) {
    return this.processSingleResult(this.context.executeQuery(breeze.EntityQuery.from(type)
      .where("slug", breeze.FilterQueryOp.Equals, slug)
      .top(1), requestName));
  }

  public executeKeyQuery<T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> {
    return this.processSingleResult(this.context.executeKeyQuery(query));
  }

  processSingleResult = promise => promise.
    then(result => {
      if (result.results.length == 0) {
        var d = this.context.$q.defer();
        d.reject(new this.tools.NotFoundException("There were no results returned from the server"));
        return d.promise;
      }
      return result.results[0];
    }).catch(failure => {
      var d = this.context.$q.defer();
      if (failure.status == 404) {
        d.reject(new this.tools.NotFoundException("The server responded with 404"));
      } else {
        d.reject(failure);
      }
      return d.promise;
    });

  public getEntityQueryFromShortId(type: string, id: string): breeze.EntityQuery {
    this.tools.Debug.log("getting " + type + " by shortId: " + id);
    return breeze.EntityQuery
      .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
  }

  public getEntityQuery(type: string, id: string): breeze.EntityQuery {
    this.tools.Debug.log("getting " + type + " by id: " + id);
    return breeze.EntityQuery
      .fromEntityKey(this.context.getEntityKey(type, id));
  }


  public handleFilterQuery = <T>(query: breeze.EntityQuery, f: IFilterInfo<T>) => {
    let si = f.search.input && f.search.input.trim();
    if (si) {
      var p = null;
      f.search.fields.forEach(x => {
        let l = new breeze.Predicate(`toLower(${x})`, breeze.FilterQueryOp.Contains, si);
        if (p == null) p = l;
        else p = p.or(l)
      })
      query = query.where(p);
    };
    // f.enabledFilters // TODO
    if (f.sortOrder) query = f.sortOrder.direction == SortDirection.Desc ? query.orderByDesc(f.sortOrder.name) : query.orderBy(f.sortOrder.name);
    return query;
  }
  public handlePaginationQuery(query: breeze.EntityQuery, page: number) {
    return query.skip(((page - 1) * DbQuery.pageSize))
      .take(DbQuery.pageSize)
      .inlineCount(true);
  }
}

export class SwitchSideBarTab {
  constructor(public name: string) { }
}

export interface ISort<T> {
  name: string;
  title?: string;
  direction?: SortDirection;
  isEnabled?: boolean;
  //sort: (a, b) => number;
}

export enum SortDirection {
  Asc,
  Desc
}

export interface IFilter<T> {
  name: string;
  isEnabled?: boolean;
  filter: (item: T) => boolean;
}

export interface IFilterInfo<T> { search: { input: string, fields: string[] }, sortOrder: ISort<T>, enabledFilters: IFilter<T>[] }


@inject(W6Context, Client, UploadService, BasketService)
export class DbClientQuery<TRequest, TResponse> extends DbQuery<TRequest, TResponse> {
  constructor(dbContext, protected client: Client, uploadService, protected basketService: BasketService) { super(dbContext, uploadService); }
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

}

interface IModInfo { type?: string, folder?: string, groupId?: string }

@inject("commandExecutor")
export class LegacyMediator extends Mediator {
  constructor(private commandExecutor) { super(); }
  legacyRequest<T>(requestName: string, requestParams?): Promise<T> {
    return this.commandExecutor.execute(requestName, requestParams)
      .then(x => x.lastResult);
  }

  openAddModDialog = (gameSlug: string, info: IModInfo = { type: "download", folder: "" }) => this.legacyRequest<void>(OpenAddModDialogQuery.$name, { gameSlug: gameSlug, info: info });
  openAddCollectionDialog = (gameSlug: string) => this.legacyRequest<void>(OpenAddCollectionDialogQuery.$name, { gameSlug: gameSlug });
}
