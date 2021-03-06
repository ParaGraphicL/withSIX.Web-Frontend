import breeze from 'breeze-client';
import { EntityExtends, BreezeEntityGraph, _IntDefs, BreezeInitialzation, IBreezeUser, IBreezeAWSUploadPolicy } from './dtos';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Tools } from './tools';
import { W6 } from './withSIX';
import { Toastr } from './toastr';
import { inject } from 'aurelia-framework';
import { PromiseCache } from 'withsix-sync-api';
import { IRequestInfo } from '../helpers/utils/http-errors';
import { HttpClient, json } from 'aurelia-fetch-client';

import polly from "polly-js";

const metadata = require('../../data/metadata.json');

export interface IAWSUploadPolicy {
  AccessKey: string;
  Signature: string;
  SecurityToken: string;
  ACL: string;
  ContentType: string;
  Key: string;
  BucketName: string;
  EncryptedPolicy: string;
  CallbackUrl: string;
}

export interface Result<T> {
  result: T;
}

export interface BooleanResult extends Result<boolean> {
}



export interface IQueryResult<T extends breeze.Entity> extends breeze.QueryResult {
  results: T[];
}

export interface IHttpPromise<T> extends Promise<ng.IHttpPromiseCallbackArg<T>> {
  success(callback: ng.IHttpPromiseCallback<T>): IHttpPromise<T>;
  error(callback: ng.IHttpPromiseCallback<any>): IHttpPromise<T>;
  //then<TResult>(successCallback: (response: ng.IHttpPromiseCallbackArg<T>) => Promise<TResult> | TResult, errorCallback?: (response: ng.IHttpPromiseCallbackArg<any>) => any): Promise<TResult>;
  //then<TResult1, TResult2>(onfulfilled: (value: ng.IHttpPromiseCallbackArg<T>) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: ng.IHttpPromiseCallbackArg<any>) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2>;
}

export interface IRequestShortcutConfig extends ng.IRequestShortcutConfig {
  requestName?: string;
  w6Request?: boolean;
}

// TODO: No longer inherit from this, but use the executeQuery etc methods directly as exampled in GetModQuery
@inject(HttpClient, Toastr, PromiseCache, W6, EventAggregator)
export class W6Context {
  public static minFilterLength = 2;
  public loggedIn: boolean;
  public manager: breeze.EntityManager;

  public filterPrefixes = ["user:", "tag:"];
  public defaultTakeTag = 6;

  public nextBreezeRequestName: string;

  get tools() { return Tools }

  constructor(private http: HttpClient, public logger: Toastr,
    private promiseCache: PromiseCache, public w6: W6, public eventBus: EventAggregator) {

    breeze.DataType.parseDateFromServer = function (source) {
      const date = moment(source);
      return date.toDate();
    };

    breeze.NamingConvention.camelCase.setAsDefault();
    this.serviceName = this.w6.url.api + '/breeze/withsix';
    const ajaxAdapter = <any>breeze.config.getAdapterInstance('ajax');
    if (!ajaxAdapter.defaultSettings) { ajaxAdapter.defaultSettings = {} }
    ajaxAdapter.defaultSettings.requestName = 'breezeRequest';

    ajaxAdapter.requestInterceptor = (requestInfo) => {
      if (this.nextBreezeRequestName) {
        if (!requestInfo.config) { requestInfo.config = {}; }
        requestInfo.config.requestName = this.nextBreezeRequestName;
        this.nextBreezeRequestName = undefined;
      }

      const oldFnc = requestInfo.success;
      requestInfo.success = (response) => {
        // TODO: Breeze does not parse the date objects when performing a select, 
        // because it returns an anonymous object of which it doesnt know the fields
        // a better solution might be to fix this at the root (as we specify the object type when we execute the query??)
        if (response.data) { response.data = this.w6.convertToClient(response.data, false); }
        oldFnc(response);
      };

      // loadingInterceptor.startedBreeze(requestInfo);
    };
    this.fetchMetadata();
    this.loggedIn = this.w6.userInfo.id != null;
    this.userSlugCache = {};
    this.emailExistsCache = {};
    this.usernameExistsCache = {};
  }

  public getEntityKeyFromShortId(type: string, shortId: string): breeze.EntityKey {
    return this.getEntityKey(type, Tools.fromShortId(shortId));
  }

  public getEntityKey(type: string, id: string): breeze.EntityKey {
    var t = <breeze.EntityType>this.manager.metadataStore.getEntityType(type);
    return new breeze.EntityKey(t, id);
  }

  public getUrl(path) {
    return Tools.uriHasProtocol(path) ? path : (path.startsWith("/") ? this.w6.url.authSsl + path : this.w6.url.api + "/" + path);
  }

  public getMd(subPath) { return this.getText(this.w6.url.getSerialUrl("docs/" + subPath)); }

  public getCdnMd(subPath: string) {
    return this.getText(this.w6.url.docsCdn + "/software/withSIX/drop/docs/" + subPath);
  } //  + (subPath.includes('?') ? '&' : '?') + "site=" + this.w6.url.site

  // TODO: We should check for the latest commit or tag on github, every minute or so, and then use that commit SHA
  public async getDocMd(subPath, addTag = false) {
    const path = 'docs/' + subPath;
    return await this.getText('https://raw.githubusercontent.com/SIXNetworks/withsix-docs/master/' + path);
  }

  async getLatestCommit(path, repo = 'SIXNetworks/withsix-docs') {
    // TODO: cache per repo for on minute? (promisecache)
    const commits = await this.getCustom<Array<{ sha: string }>>('https://api.github.com/repos/' + repo + '/commits?path=' + path);
    return commits[0].sha;
  }

  getTimeTag(minuteGranulary = 5) {
    const d = new Date();
    return `${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDay()}${d.getUTCHours()}${Math.round(d.getUTCMinutes() / minuteGranulary)}`
  }

  public get = <T>(path, query?) => this.handleJson<T>(this.serviceName + '/' + path, { params: query });
  public getCustom = <T>(path, configOverrides?: IRequestShortcutConfig) => this.handleJson<T>(path, configOverrides)
  public postCustom = <T>(path, data?, configOverrides?: IRequestShortcutConfig) =>
    this.handleJsonWithBody<T>(path, data, { method: 'POST', ...configOverrides });
  public putCustom = <T>(path, data, configOverrides?: IRequestShortcutConfig) =>
    this.handleJsonWithBody<T>(path, data, { method: 'PUT', ...configOverrides });
  public patchCustom = <T>(path, data, configOverrides?: IRequestShortcutConfig) =>
    this.handleJsonWithBody<T>(path, data, { method: 'PATCH', ...configOverrides });

  public postCustomFormData<T>(path, fd: FormData, configOverrides?: IRequestShortcutConfig) {
    Tools.Debug.log("postCustomFormData", path, fd, configOverrides);
    return this.handleJson<T>(path, { body: fd, method: 'POST', ...configOverrides });
  }
  public deleteCustom = <T>(path, configOverrides?: IRequestShortcutConfig) => this.handleJson<T>(path, { method: 'DELETE', ...configOverrides })

  handleJsonWithBody = <T>(path, data, configOverride?) => this.handleJson<T>(path, {
    body: data ? json(data) : null
    , ...configOverride
  });

  handleJson = async <T>(path, configOverride?) => {
    let r = await this.getResponse(path, configOverride);
    if (r.status === 204) { return <T>null; }
    //if (r.status === 204) throw new Error("Received a 204 no content response, however expected JSON to be returned")
    return <T>this.w6.convertToClient(await r.json());
  }

  getText = async <T>(path, configOverride?) => {
    let r = await this.getResponse(path, configOverride);
    return <T>this.w6.convertToClient(await r.text());
  }

  getResponse = async (path, configOverride?) => {
    let url = this.getUrl(path);
    if (configOverride && configOverride.params) {
      const encode = (key: string, val, objKey?) => {
        if (objKey) { key = `${objKey}[${key}]`; }
        if (val instanceof Array) {
          return val.map((x, i) => encode(`${key}[${i}]`, x)).join("&")
        } else if (val instanceof Object) {
          return encodeObject(val, key);
        } else {
          return key + "=" + encodeURIComponent(val)
        }
      }
      const encodeObject = (obj, objKey?) => Object.keys(obj)
        .filter((key) => obj[key] !== undefined)
        .map((key) => {
          return encode(encodeURIComponent(key), obj[key], objKey);
        })
        .join("&")
      const params = encodeObject(configOverride.params)
        .replace(/%20/g, "+");
      url = url + "?" + params;
    }

    try {
      return await polly()
        .handle(err => {
          const r = <any>err;
          if (r.status && r.status < 500) { return false; }
          return true;
        }) // TODO: Handle specific errors only 
        .waitAndRetry(3)
        .executeForPromise(() => this.http.fetch(url, configOverride));
    } catch (err) {
      if (err instanceof Response) {
        let data;
        try {
          data = this.w6.convertToClient(await err.json());
        } catch (err) {
          data = {};
        }
        (<any>err).data = data;
        throw this.handleResponseErrorStatus(err, this.w6.isLoggedIn);
      }
      throw err;
    }
  }

  public getFormDataFromFiles(files) {
    const fd = new FormData();
    for (let i of files) { fd.append("file", i); }
    return fd;
  }

  public getOpByKeyLength(key: string): breeze.FilterQueryOpSymbol {
    return key.length > W6Context.minFilterLength ? breeze.FilterQueryOp.Contains : breeze.FilterQueryOp.StartsWith;
  }

  public generateOrderable(sortOptions) {
    var orderable = [];
    var fields = [];
    for (var i = 0; i < sortOptions.fields.length; i++) {
      var field = sortOptions.fields[i];
      if (fields.some(x => x == field))
        continue;
      fields.push(field);
      if (field == 'author')
        field = 'author.displayName';
      if (sortOptions.directions[i] === "desc")
        field += " desc";
      orderable.push(field);
    }
    return orderable.join(",");
  }

  public applyPaging(query, pagingOptions) {
    var page = parseInt(pagingOptions.currentPage);
    var pageSize = parseInt(pagingOptions.pageSize);
    return query.skip(((page - 1) * pageSize))
      .take(pageSize)
      .inlineCount(true);
  }

  public createEntity(typeName: string, data?: {}) {
    return this.manager.createEntity(typeName, data);
  }

  static splitRx: RegExp = /([\w:]*"[^"]*")|[^" ]+/g;

  public static searchInfo(filterText: string, skipCheck, types) {
    var lc = filterText.toLowerCase().trim();
    var split = lc.match(W6Context.splitRx);


    var data = { name: [], all: [] };
    for (var i in types) {
      var t = types[i];
      data[t.substring(0, t.length - 1)] = [];
    }

    for (var s in split) {
      var key = split[s].replace(/\"/g, '');
      var found = false;

      for (var i in types) {
        var t = types[i];
        if (key.startsWith(t)) {
          var substring = key.substring(t.length);
          if (skipCheck || substring.length >= this.minFilterLength)
            data[t.substring(0, t.length - 1)].push(substring);
          found = true;
          break;
        }
      }
      if (!found)
        data.name.push(key);
    }

    data.all = data.all.concat(data.name);
    for (var i in types) {
      var t = types[i];
      data.all = data.all.concat(data[t.substring(0, t.length - 1)]);
    }

    return data;
  }

  public buildPreds(query, preds) {
    var pred: breeze.Predicate;
    for (var i in preds) {
      var p = preds[i];
      if (p != undefined)
        pred = pred == null ? p : pred.and(p);
    }

    if (pred == null) return null;

    return query.where(pred);
  }

  public getNameQuery(split: string[]): breeze.Predicate {
    return this.findInField(split, ["name"], undefined);
  }

  public findInField(split: string[], fields: string[], op: breeze.FilterQueryOpSymbol) {
    if (op == null) op = breeze.FilterQueryOp.Contains;

    var pred: breeze.Predicate;
    for (var v in split) {
      var pred2: breeze.Predicate;
      for (var i in fields) {
        var p = new breeze.Predicate("toLower(" + fields[i] + ")", op, split[v]);
        pred2 = pred2 == null ? p : pred2.or(p);
      }
      pred = pred == null ? pred2 : pred.and(pred2);
    }
    return pred;
  }

  public getAuthorQuery(split: string[]): breeze.Predicate {
    return this.findInField(split, ["author.displayName"], undefined);
  }

  private hookAuthor(lc: string, predicate, inclAuthor: boolean) {
    if (inclAuthor)
      return this.findInField([lc], ["author.displayName"], undefined);
    return predicate;
  }

  public executeKeyQuery<T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<IQueryResult<T>> {
    return this.fetchMetadata()
      .then(() => this.executeQuery(query()));
  }

  public executeQueryWithManager<T extends breeze.Entity>(manager, query, requestName?): Promise<IQueryResult<T>> {
    Tools.Debug.log(["Executing query: ", query, requestName]);
    this.nextBreezeRequestName = requestName;
    // TODO: Extra check to reset the requestName, e.g if query parsing fails or so?
    return manager.executeQuery(query);
  }

  public executeQueryWithNewManager<T extends breeze.Entity>(query, requestName?): Promise<IQueryResult<T>> {
    return this.fetchMetadata()
      .then(() => this.executeQueryWithManager(this.newManager(), query, requestName));
  }

  public executeQuery<T extends breeze.Entity>(query, requestName?): Promise<IQueryResult<T>> {
    return this.fetchMetadata()
      .then(() => this.executeQueryWithManager(this.manager, query, requestName));
  }

  public executeQueryLocally<T extends breeze.Entity>(query, requestName?): Promise<T[]> {
    Tools.Debug.log(["Executing query: ", query, requestName]);
    this.nextBreezeRequestName = requestName;
    // TODO: Extra check to reset the requestName, e.g if query parsing fails or so?
    return this.fetchMetadata()
      .then(() => this.manager.executeQueryLocally(query));
  }

  public async queryLocallyOrServerWhenNoResults<T extends breeze.Entity>(query: breeze.EntityQuery): Promise<T[]> {
    let l = await this.executeQueryLocally<T>(query);
    if (l.length !== 0) { return l; }
    let r = await this.executeQuery<T>(query);
    return r.results;
  }

  public async executeQueryT<T extends breeze.Entity>(query, requestName?): Promise<IQueryResult<T>> {
    Tools.Debug.log(["Executing query: ", query, requestName]);
    this.nextBreezeRequestName = requestName;
    // TODO: Extra check to reset the requestName, e.g if query parsing fails or so?
    await this.fetchMetadata();
    return <IQueryResult<T>>await this.manager.executeQuery(query);
  }

  public rejectChanges() {
    this.manager.rejectChanges();
  }

  public uploadToAmazonWithPolicy(file: File, uploadPolicy: IBreezeAWSUploadPolicy) { return this.uploadToBucket(file, uploadPolicy); }

  private getPolicy(file, authorizationPath, policyType, requestName?) {
    return this.getCustom(this.serviceName + '/' + authorizationPath, {
      requestName, params: { policyType, filePath: file }
    });
  }

  private uploadToBucket = async (file: File, s3Params: IBreezeAWSUploadPolicy, requestName?) => {
    const data = {
      key: s3Params.key,
      acl: s3Params.aCL, // ?? acl vs CannedACL ?
      //success_action_redirect: s3Params.callbackUrl,
      'Content-Type': s3Params.contentType,
      'x-amz-security-token': s3Params.securityToken,
      AWSAccessKeyId: s3Params.accessKey, // ?? included in policy?
      Policy: jQuery.parseJSON(s3Params.encryptedPolicy).policy, // TODO: We actually really only need the policy property??
      Signature: s3Params.signature,
      //filename: file.name, // ?? included in policy?
      //filename: file.name //Required for IE8/9 //,
    };

    const fd = new FormData()
    Object.keys(data).forEach(k => {
      fd.append(k, data[k]);
    });
    fd.append('file', file, file.name);

    let r = await window.fetch('https://' + s3Params.bucketName + '.s3.amazonaws.com/', {
      method: 'POST',
      body: fd
    });

    if (!r.ok) { throw r; }
    return r;
  }

  public async saveChanges(requestName?, entities?: breeze.Entity[]) {
    if (this.manager.hasChanges()) {
      this.nextBreezeRequestName = requestName;
      return await this.manager.saveChanges(entities);
    } else {
      throw new Error("nothing to save")
    }
  }

  userNameExistsCached = async (userName: string) => {
    if (!userName || userName.length == 0) return false;
    var cache = this.getUsernameExistsCache(userName);
    if (cache === false || cache === true) return cache;

    let r = await this.getCustom<BooleanResult>("accounts/username-exists", { params: { userName: userName } })
    return this.addUsernameExistsCache(userName, r.result);
  }

  // userSlugExistsCached = userSlug => {
  //   if (!userSlug || userSlug.length == 0) return false;
  //   var cache = this.getUserSlugCache(userSlug);
  //   if (cache === false || cache === true) return cache;
  //
  //   return <any>this.getCustom<BooleanResult>("accounts/username-exists", { params: { userName: userName } })
  //     .then(result => this.addUsernameExistsCache(userName, result.result));
  // }


  emailExistsCached = async (email: string) => {
    if (!email || email.length == 0) return false;
    var cache = this.getEmailExistsCache(email);
    if (cache === false || cache === true) return cache;

    let r = await this.getCustom<BooleanResult>("accounts/email-exists", { params: { email: email } })
    return this.addEmailExistsCache(email, r.result);
  }

  addUserSlugCache(userSlug: string, id: string): string { return this.userSlugCache[userSlug] = id; }

  getUserSlugCache(userSlug: string): string { return this.userSlugCache[userSlug]; }

  private userSlugCache: {};

  private addUsernameExistsCache(username: string, value: boolean): boolean { return this.usernameExistsCache[username] = value; }

  private getUsernameExistsCache(username: string): boolean { return this.usernameExistsCache[username]; }

  private usernameExistsCache: {};

  private addEmailExistsCache(email: string, value: boolean): boolean { return this.emailExistsCache[email] = value; }

  private getEmailExistsCache(email: string): boolean { return this.emailExistsCache[email]; }

  private emailExistsCache: {};

  fetchMetadata() {
    // may not use authorization header..
    return this.promiseCache.getOrAdd<void>('fetchMetadata',
      () => Promise.resolve(metadata)
        // TODO: Replace...
        .then(result => this.createMetadataStore(this.serviceName, result))
        .then(() => this.createDefaultManager()), { expireOnFailure: true }
    );
  }

  addPropertyChangeHandler(entityManager: breeze.EntityManager) {
    // call handler when an entity property of any entity changes
    // return the subscription token so caller can choose to unsubscribe later
    return entityManager.entityChanged.subscribe(changeArgs => {
      var action = changeArgs.entityAction;

      if (action === breeze.EntityAction.PropertyChange) {
        var entity = changeArgs.entity;
        if (entity.entityType.name == EntityExtends.User.$name) {
          var account = <IBreezeUser>entity;
          var propertyName = (<any>changeArgs.args).propertyName;
          if (propertyName == 'avatarURL' || propertyName == 'hasAvatar')
            account.clearAvatars();
        }
      }
    });
  }

  registerEndpointMappings(store: breeze.MetadataStore) {
    // TODO: Investigate if we could somehow generate this from Breeze WithsixController
    store.setEntityTypeForResourceName('ModsInCollection', 'Mod');

    var mission = function () {
      this.avatar = ""; // "" or instance of whatever type is is supposed to be
    };

    // register your custom constructor
    store.registerEntityTypeCtor("Mission", mission);
    /*
                store.setEntityTypeForResourceName('ModsByGame', 'Mod');
                store.setEntityTypeForResourceName('ModsByUser', 'Mod');
                store.setEntityTypeForResourceName('MissionsByGame', 'Mission');
                store.setEntityTypeForResourceName('MissionsByUser', 'Mission');
                store.setEntityTypeForResourceName('ServersByGame', 'Server');
                store.setEntityTypeForResourceName('ServersByUser', 'Server');
                store.setEntityTypeForResourceName('CollectionsByGame', 'Collection');
                store.setEntityTypeForResourceName('CollectionsByUser', 'Collection');
                store.setEntityTypeForResourceName('AppsByGame', 'App');
                store.setEntityTypeForResourceName('AppsByUser', 'App');
    */

    store.setEntityTypeForResourceName('AccountSearch', 'User');

    //angular.forEach(["Mod", "Mission", "MissionVersion", "Collection", "CollectionVersion", "Server", "App"], m => store.getEntityType(m).defaultResourceName = m + "sById");
    (<any>store.getEntityType("ModInfo")).defaultResourceName = "ModInfoes";
    angular.forEach(["Mod", "Mission", "Collection"], m => this.addAnyProperty(m, "tags", store));
  }

  private addAnyProperty(typeName: string, propertyName: string, store) {
    var entityType = store.getEntityType(typeName);
    var newProp = new breeze.DataProperty({
      name: propertyName,
      dataType: breeze.DataType.Undefined,
      isNullable: true,
      //isUnmapped: true
    });
    entityType.addProperty(newProp);
  }

  private store: breeze.MetadataStore;
  public serviceName: string;

  createDefaultManager() {
    let manager = this.newManager();
    BreezeEntityGraph.initialize(manager);
    Tools.Debug.r.staging(() => {
      $(window).data("entityManager", manager);
    });

    this.manager = manager;
  }

  public newManager(): breeze.EntityManager {
    var manager = new breeze.EntityManager({
      dataService: new breeze.DataService({
        serviceName: this.serviceName,
        hasServerMetadata: false
      }),
      metadataStore: this.store
    });

    this.addPropertyChangeHandler(manager);

    return manager;
  }

  private createMetadataStore(serviceName, data) {
    // 'Identity' is the default key generation strategy for this app
    //var keyGen = breeze.AutoGeneratedKeyType.Identity;
    // namespace of the corresponding classes on the server
    //var namespace = 'SN.withSIX.App.ApiModel';

    // Breeze Labs: breeze.metadata.helper.js
    // https://github.com/IdeaBlade/Breeze/blob/master/Breeze.Client/Scripts/Labs/breeze.metadata-helper.js
    // The helper reduces data entry by applying common conventions
    // and converting common abbreviations (e.g., 'type' -> 'dataType')
    //var helper = new this.breeze.config.MetadataHelper(namespace, keyGen);

    /*** Convenience fns and vars ***/
    var store = new breeze.MetadataStore({
      // namingConvention: breeze.NamingConvention.camelCase // set as default

    });

    store.importMetadata(data);

    BreezeInitialzation.registerEntityTypeCtors(store);
    this.registerEndpointMappings(store);
    this.store = store;
  }

  private registerEntityTypeCtor(store, ctor) { store.registerEntityTypeCtor(ctor.$name, ctor); }

  handleResponseErrorStatus(requestInfo: IRequestInfo<any>, isLoggedIn: boolean) {
    const {status} = requestInfo;
    switch (status) {
      case 400: throw HttpErrorCreator.create400(requestInfo);
      case 401: throw HttpErrorCreator.create401(isLoggedIn, requestInfo);
      case 403: throw HttpErrorCreator.create403(requestInfo);
      case 404: throw HttpErrorCreator.create404(requestInfo);
      case 500: throw HttpErrorCreator.create500(requestInfo);
    }
    throw HttpErrorCreator.createUnknown(requestInfo);
  }
}

const getHeaderInfo = (requestInfo) => requestInfo.headers ? `For your reference: ${requestInfo.headers.get('x-withsix-requestid')}` : "";


export class HttpErrorCreator {
  static create400 = (requestInfo, err?: Error) =>
    new Tools.ValidationError("Input not valid", requestInfo, err);
  static create401 = (isLoggedIn, requestInfo, err?: Error) => isLoggedIn ?
    new Tools.LoginNoLongerValid("The login is no longer valid, please retry after logging in again", requestInfo, err)
    : new Tools.RequiresLogin("The requested action requires you to be logged-in", requestInfo, err);
  static create403 = (requestInfo, err?: Error) =>
    new Tools.Forbidden("You do not have access to this resource", requestInfo, err);
  static create404 = (requestInfo, err?: Error) =>
    new Tools.NotFoundException("The requested resource does not appear to exist", requestInfo, err);
  static create500 = (requestInfo, err?: Error) =>
    new Tools.HttpException(
      `Internal server error. We've been notified about the problem and will investigate. ${getHeaderInfo(requestInfo)}`,
      requestInfo, err);
  static createUnknown = (requestInfo, err?: Error) =>
    new Tools.HttpException(`Unknown error. ${getHeaderInfo(requestInfo)}`, requestInfo, err);
}