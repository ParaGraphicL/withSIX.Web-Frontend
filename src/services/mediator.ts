import breeze from 'breeze-client';
import { IUserInfo, IBreezeMod } from './dtos';
import { W6Context, IQueryResult } from './w6context'
import { BasketService } from './basket-service';
import { Toastr } from './toastr';
import { Client } from 'withsix-sync-api';
import { defineProperties } from '../helpers/utils/extenders';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Mediator, IMediator, IRequest, IRequestHandler} from 'aurelia-mediator';
import {GlobalErrorHandler} from './legacy/logger';
import {Tools} from './tools';
import {W6} from './withSIX';
import {Container} from 'aurelia-framework';
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
    i.onload = function () { i.parentNode.removeChild(i); };
    i.src = 'syncws://?launch=1';
    document.body.appendChild(i);
  }
}

// App specific starts
@inject(Mediator, Toastr, ClientMissingHandler, W6, GlobalErrorHandler)
export class ErrorLoggingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private toastr: Toastr, private clientMissingHandler: ClientMissingHandler, private w6: W6, private eh: GlobalErrorHandler) { }

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
        else if (fail == 'Error: The user cancelled the operation' || fail == 'Error: Operation aborted') {
        } else {
          this.handleGeneralError(fail, action);
          this.eh.handleUseCaseError(fail);
        }
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
    var msg = this.w6.api.errorMsg(err);
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
  return function (target) {
    defineProperties(target.prototype, { $requireUser: true })
  };
}

let ls = <{ on: (key: string, fn) => void; set: (key: string, value) => void }><any>require('local-storage');

@inject(W6Context)
export class DbQuery<TRequest, TResponse> implements IRequestHandler<TRequest, TResponse> {
  static pageSize = 12;

  get tools() { return Tools; }

  // TODO: Move the w6context!!
  constructor(protected context: W6Context) { }
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

  protected get w6(): W6 { return <any>this.context.w6; }

  public publishCrossEvent(eventName: string, data: any) {
    this.context.eventBus.publish(data);
    // TODO: Do we need an ID incase of double events?
    ls.set('w6.event', { name: eventName, data: data });
  }

  public findBySlug = <T extends breeze.Entity>(type: string, slug: string, requestName: string) => this.processSingleResult<T>(this.context.executeQuery<T>(breeze.EntityQuery.from(type)
    .where("slug", breeze.FilterQueryOp.Equals, slug)
    .top(1), requestName));

  public executeKeyQuery = <T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<T> => this.processSingleResult<T>(this.context.executeKeyQuery<T>(query));

  processSingleResult = async <T extends breeze.Entity>(promise: Promise<IQueryResult<T>>) => {
    let result: IQueryResult<T>;
    try {
      result = await promise;
    } catch (failure) {
      if (failure.status == 404) throw new Tools.NotFoundException("The server responded with 404", { status: 404, statusText: 'NotFound', body: {} });
      else throw failure;
    }
    if (result.results.length == 0) throw new Tools.NotFoundException("There were no results returned from the server", { status: 404, statusText: 'NotFound', body: {} });
    return result.results[0];
  }

  public getEntityQueryFromShortId(type: string, id: string): breeze.EntityQuery {
    Tools.Debug.log("getting " + type + " by shortId: " + id);
    return breeze.EntityQuery
      .fromEntityKey(this.context.getEntityKeyFromShortId(type, id));
  }

  public getEntityQuery(type: string, id: string): breeze.EntityQuery {
    Tools.Debug.log("getting " + type + " by id: " + id);
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
    if (f.tags) query = query.withParameters({ tag: f.tags[0] });
    return query;
  }
  public handlePaginationQuery(query: breeze.EntityQuery, page: number) {
    return query.skip(((page - 1) * DbQuery.pageSize))
      .take(DbQuery.pageSize)
      .inlineCount(true);
  }

  protected async handleModAugments(allMods: any[]) {
    if (allMods.length > 0) {
      var onlineModsInfo = await this.getOnlineModsInfo(allMods.map(x => x.id));
      allMods.forEach(x => {
        if (onlineModsInfo.has(x.id)) {
          var oi = onlineModsInfo.get(x.id);
          this.augmentModInfo(oi, x);
        }
      });
    }
  }


  private augmentModInfo(x: IBreezeMod, mod) {
    Object.assign(mod, {
      image: this.w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
      size: x.size,
      sizePacked: x.sizePacked,
      stat: x.stat,
      author: x.authorText || x.author.displayName,
      authorSlug: x.author ? x.author.slug : null,
    })
  }

  private async getOnlineModsInfo(ids: string[]) {
    let uIds = Array.from(new Set(ids));
    var jsonQuery = {
      from: 'Mods',
      where: {
        'id': { in: uIds }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery)
      .select(['id', 'avatar', 'avatarUpdatedAt', 'size', 'sizePacked', 'author', 'authorText']);
    var r = await this.context.executeQuery<IBreezeMod>(query);
    return r.results.toMap(x => x.id);
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
  customSort?: (a: T, b: T) => number;
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

export interface IFilterInfo<T> { search: { input: string, fields: string[] }, sortOrder: ISort<T>, enabledFilters: IFilter<T>[], tags?: string[] }


@inject(W6Context, Client, BasketService)
export class DbClientQuery<TRequest, TResponse> extends DbQuery<TRequest, TResponse> {
  constructor(dbContext, protected client: Client, protected basketService: BasketService) { super(dbContext); }
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

}

interface IModInfo { type?: string, folder?: string, groupId?: string }

export class LegacyMediator {
  _angularInjector;
  get angularInjector() { return this._angularInjector || (this._angularInjector = angular.element("body").injector()) }

  get commandExecutor() { return this.angularInjector.get('commandExecutor') }

  async legacyRequest<T>(requestName: string, requestParams?): Promise<T> {
    let r = await this.commandExecutor.execute(requestName, requestParams);
    return r.lastResult;
  }

  openAddModDialog = (gameSlug: string, info: IModInfo = { type: "download", folder: "" }) => this.legacyRequest<void>('OpenAddModDialog', { gameSlug: gameSlug, info: info });
  openAddCollectionDialog = (gameSlug: string) => this.legacyRequest<void>('OpenAddCollectionDialog', { gameSlug: gameSlug });
}
