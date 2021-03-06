import breeze from "breeze-client";
import { IUserInfo, IBreezeMod } from "./dtos";
import { HttpErrorCreator, W6Context, IQueryResult } from "./w6context";
import { BasketService } from "./basket-service";
import { Toastr } from "./toastr";
import { Client, IContent } from "withsix-sync-api";
import { defineProperties } from "../helpers/utils/extenders";
import { inject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { Validation, ValidationResult } from "aurelia-validation";
import { Mediator, IMediator, IRequest, IRequestHandler } from "mediatr";
import { GlobalErrorHandler } from "./legacy/logger";
import { Tools } from "./tools";
import { W6 } from "./withSIX";
import { Container } from "aurelia-framework";
import { ApolloError } from "apollo-client";

export * from "mediatr";

const isGraphStatus = (msg, statusCode) => msg.startsWith("Failed request " + statusCode);
const isGraphStatusError = (err: ApolloError, statusCode) =>
  err.graphQLErrors && err.graphQLErrors.some((x) => isGraphStatus(x.message, statusCode)); // TODO: network errors


// App specific starts
@inject(Mediator, Toastr)
export class ErrorLoggingMediatorDecorator implements IMediator {
  constructor(private mediator: IMediator, private toastr: Toastr) { }

  async request<T>(request: IRequest<T>): Promise<T> {
    const action = (<any>request.constructor).action;
    try {
      const r = await this.mediator.request<T>(request);
      if (action) {
        Tools.Debug.info(action + ": Success");
        this.toastr.success(action, "Success");
      }
      return r;
    } catch (err) {
      if (err instanceof ApolloError) {
        if (isGraphStatusError(<ApolloError>err, 404)) {
          throw HttpErrorCreator.create404({ status: 404, statusText: "NotFound" }, err);
        }
        if (isGraphStatusError(<ApolloError>err, 403)) {
          throw HttpErrorCreator.create403({ status: 403, statusText: "Forbidden" }, err);
        }
        if (isGraphStatusError(<ApolloError>err, 401)) {
          // localstorage used to work around injection limitations
          throw HttpErrorCreator.create401(!!localStorage.getItem("aurelia_token"), {
            status: 401, statusText: "Unauthorized"
          }, err);
        }
        if (isGraphStatusError(<ApolloError>err, 500)) {
          throw HttpErrorCreator.create500({ status: 500, statusText: "InternalServerError" }, err);
        }
        throw HttpErrorCreator.createUnknown({ status: 500, statusText: "UnknownError" }, err);
      }
      throw err;
    }
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
  // $requireUser: boolean;
}

export function requireUser() {
  return function (target) {
    defineProperties(target.prototype, { $requireUser: true });
  };
}

let ls = <{ on: (key: string, fn) => void; set: (key: string, value) => void }><any>require("local-storage");

export abstract class RequestBase<TRequest, TResponse> implements IRequestHandler<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }
}

@inject(W6Context)
export class DbQuery<TRequest, TResponse> extends RequestBase<TRequest, TResponse> {
  static pageSize = 12;

  get tools() { return Tools; }

  // TODO: Move the w6context!!
  constructor(protected context: W6Context) { super(); }

  protected get w6(): W6 { return <any>this.context.w6; }

  public publishCrossEvent(eventName: string, data: any) {
    this.context.eventBus.publish(data);
    // TODO: Do we need an ID incase of double events?
    ls.set("w6.event", { name: eventName, data: data });
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
      if (failure.status === 404) throw new Tools.NotFoundException("The server responded with 404", { status: 404, statusText: "NotFound" });
      else throw failure;
    }
    if (result.results.length === 0) throw new Tools.NotFoundException("There were no results returned from the server", { status: 404, statusText: "NotFound" });
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
      let p = null;
      f.search.fields.forEach(x => {
        let l = new breeze.Predicate(`toLower(${x})`, breeze.FilterQueryOp.Contains, si);
        if (p == null) p = l;
        else p = p.or(l);
      });
      query = query.where(p);
    };
    // f.enabledFilters // TODO
    if (f.sortOrder) query = f.sortOrder.direction === SortDirection.Desc ? query.orderByDesc(f.sortOrder.name) : query.orderBy(f.sortOrder.name);
    if (f.tags) query = query.withParameters({ tag: f.tags[0] });
    return query;
  }
  public handlePaginationQuery(query: breeze.EntityQuery, page: number) {
    return query.skip(((page - 1) * DbQuery.pageSize))
      .take(DbQuery.pageSize)
      .inlineCount(true);
  }

  protected handleModAugments = async (allMods: IContent[]) => {
    if (allMods.length > 0) {
      let onlineModsInfo = await this.getOnlineModsInfo(allMods.map(x => x.id));
      allMods.forEach(x => {
        if (onlineModsInfo.has(x.id)) {
          let oi = onlineModsInfo.get(x.id);
          this.augmentModInfo(oi, x);
        }
      });
    }
  }


  private augmentModInfo(x: IBreezeMod, mod: IContent) {
    Object.assign(mod, {
      image: this.w6.url.getContentAvatarUrl(x.avatar, x.avatarUpdatedAt),
      size: x.size,
      sizePacked: x.sizePacked,
      stat: x.stat,
      name: x.name,
      author: x.authorText || x.author.displayName,
      authorSlug: x.author ? x.author.slug : null,
      publishers: x.publishers,
    });
  }

  private async getOnlineModsInfo(ids: string[]) {
    let uIds = Array.from(new Set(ids));
    let jsonQuery = {
      from: "Mods",
      where: {
        "id": { in: uIds },
      },
    };
    let query = new breeze.EntityQuery(jsonQuery)
      .select(["id", "avatar", "avatarUpdatedAt", "size", "sizePacked", "author", "authorText", "publishers", "name"]);
    let r = await this.context.executeQuery<IBreezeMod>(query);
    return r.results.toMap(x => x.id);
  }
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
  title?: string;
  name: string;
  isEnabled?: boolean;
  value?: (any | { title: string; value; })
  values?: (any | { title: string; value; })[]
  filter: (item: T, value?) => boolean;
  type?: 'and' | 'or';
}

export interface IFilterInfo<T> {
  search: { input: string, fields: string[] };
  sortOrder: ISort<T>; enabledFilters: IFilter<T>[]; tags?: string[];
}


@inject(W6Context, Client, BasketService)
export class DbClientQuery<TRequest, TResponse> extends DbQuery<TRequest, TResponse> {
  constructor(dbContext, protected client: Client, protected basketService: BasketService) { super(dbContext); }
  handle(request: TRequest): Promise<TResponse> { throw "must implement handle method"; }

}

interface IModInfo { type?: string; folder?: string; groupId?: string; }

export class LegacyMediator {
  _angularInjector;
  get angularInjector() { return this._angularInjector || (this._angularInjector = angular.element("body").injector()); }

  get commandExecutor() { return this.angularInjector.get("commandExecutor"); }

  async legacyRequest<T>(requestName: string, requestParams?): Promise<T> {
    let r = await this.commandExecutor.execute(requestName, requestParams);
    return r.lastResult;
  }

  openAddModDialog = (gameSlug: string, info: IModInfo = { type: "download", folder: "" }) => this.legacyRequest<void>("OpenAddModDialog", { gameSlug: gameSlug, info: info });
  openAddCollectionDialog = (gameSlug: string) => this.legacyRequest<void>("OpenAddCollectionDialog", { gameSlug: gameSlug });
}
