import { HttpClient, HttpRequestMessage, HttpResponseMessage } from 'aurelia-http-client';
import { HttpClient as FetchClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, Container } from 'aurelia-framework';

import { EntityExtends, IUserInfo } from './dtos';
import { W6Urls } from './withSIX';
import { Tools } from './tools';
import { Toastr } from './toastr';
import { LS } from './base';
import { buildUrl } from '../helpers/utils/url';
import { createError } from '../helpers/utils/errors';

import polly from "polly-js";

export var AbortError = createError('AbortError');

@inject(HttpClient, FetchClient, W6Urls, EventAggregator, LS)
export class LoginBase {
  shouldLog = (Tools.env > Tools.Environment.Production);

  get tools() { return Tools; }
  static refreshToken = 'aurelia_refreshToken';
  static idToken = 'aurelia_id_token';
  static token = 'aurelia_token';
  static localClientId = 'withsix-spa';
  static key = 'w6.refreshToken';

  refreshClient: FetchClient;
  constructor(protected http: HttpClient, private httpFetch: FetchClient, protected w6Url: W6Urls, private eventBus: EventAggregator, protected ls: LS) {
    const headers = {
      'Accept': 'application/json',
      //'X-Requested-With': 'Fetch'
    }

    this.refreshClient = new FetchClient();
    this.refreshClient.configure(config =>  //.useStandardConfiguration()
      config.withDefaults({ credentials: 'same-origin', headers })
    );
  }
  static resetUnload() { window.onbeforeunload = undefined; }
  resetUnload() { LoginBase.resetUnload(); }
  refreshing: Promise<boolean>;
  heartbeat = () => this.ls.set(LoginBase.key, JSON.stringify(new Date()));
  async tryHandleRefreshToken() {
    this.heartbeat();
    let interval = setInterval(this.heartbeat, 2 * 1000);
    try {
      return await (this.refreshing = this.handleRefreshToken());
    } finally {
      clearInterval(interval);
      this.ls.set(LoginBase.key, JSON.stringify(null));
      this.refreshing = null;
    }
  }

  async handleRefreshToken() {
    var refreshToken = window.localStorage[LoginBase.refreshToken];
    if (!refreshToken) return false;
    if (this.shouldLog) Tools.Debug.log(`[HTTP] Trying to refresh token`);
    try {
      const c = await polly()
        .handle(err => true) // TODO: Handle specific errors only 
        .waitAndRetry(3)
        .executeForPromise(async () => {
          const r = await this.refreshClient.fetch(this.w6Url.authSsl + "/login/refresh",
            {
              body: json({
                clientId: LoginBase.localClientId, idToken: window.localStorage[LoginBase.idToken],
                refreshToken,
              }), method: "post",
            });
          if (!r.ok) { throw new Error("Error refreshing token: " + r.status); }
          return <{ refresh_token, token, id_token }>await r.json();
        });
      /* authConfig.providers.localIdentityServer.clientId */
      this.updateAuthInfo(c.refresh_token, c.token, c.id_token);
      return true;
    } catch (err) {
      this.tools.Debug.error("[HTTP] Error trying to use refresh token", err);
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7528873/
      if (err instanceof Response) {
        const r: Response = err;
        if (r.status === 401) {
          this.tools.Debug.warn("[HTTP] 401, refreshtoken probably invalid", err);
          window.localStorage.removeItem(LoginBase.refreshToken);
          return false;
        }
        this.tools.Debug.warn("Received unexpected response trying to use the refreshtoken: " + err.status, err);
      } else {
        this.tools.Debug.warn("Received unexpected error trying to use the refreshtoken, removing the refreshtoken and falling back gracefully. Possibly browser bug (edge)", err);
        window.localStorage.removeItem(LoginBase.refreshToken);
        return false;
      }
      // TODO: Wait for X amount of delay, then see if we actually have a valid refresh token (other tab)
      //throw err;
      return false;
    }
  }

  updateAuthInfo(refreshToken: string, accessToken: string, idToken: string) {
    this.updateLs(LoginBase.refreshToken, refreshToken);
    this.updateLs(LoginBase.token, accessToken);
    this.updateLs(LoginBase.idToken, idToken);

    this.eventBus.publish(new LoginUpdated(accessToken));
  }

  updateLs(key: string, value: string) {
    if (value) { window.localStorage[key] = value; } else { window.localStorage.removeItem(key); }
  }

  get isRequesting() { return this.httpFetch.isRequesting || this.http.isRequesting }

  private get accessToken() { return window.localStorage[LoginBase.token]; }

  refreshDate: Date;
  interval;
  p: { resolve: () => void, reject: (reason) => void };

  setHeaders() {
    this.ls.on(LoginBase.key, (v, old, url) => {
      if (this.interval) clearInterval(this.interval);
      if (!this.refreshing) {
        this.refreshing = new Promise((resolve, reject) => {
          this.p = { resolve, reject };
        });
      }
      if (!v) { if (this.p) { this.refreshing = null; this.p.resolve(); this.p = null; }; return }

      this.refreshDate = JSON.parse(v);
      if (this.p) {
        this.interval = setInterval(() => {
          let currentDate = new Date();
          if (!this.refreshDate || (currentDate.getTime() - this.refreshDate.getTime()) > (5 * 1000)) {
            // probably done (tab closed or ?)
            clearInterval(this.interval);
            this.refreshing = null
            this.p.reject(new Error("Other tab timed out"));
            this.p = null;
          } else {
            // probably still running
          }
        }, 1000);
      }
    });
    let ag = Container.instance.get(EventAggregator);
    //http://stackoverflow.com/questions/9314730/display-browser-loading-indicator-like-when-a-postback-occurs-on-ajax-calls

    this.http.configure(config => {
      const handleAt = async (request: HttpRequestMessage, force = false) => {
        let at: string;
        if (at = await this.getAccessToken(request.url, force)) request.headers.add('Authorization', `Bearer ${at}`);
      }
      config
        .withInterceptor({
          request: async (request: HttpRequestMessage) => {
            if (!request) return;
            // TODO: better!
            let parsedUrl = buildUrl(request.url);
            if (!parsedUrl.pathname.endsWith('.md')) request.headers.add('Accept', 'application/json');
            if (this.shouldLog) Tools.Debug.log(`[HTTP] Requesting ${request.method} ${request.url}`, request);
            await handleAt(request);
            return request;
          },
          response: (response: HttpResponseMessage) => {
            if (!response) return response;
            if (this.shouldLog) Tools.Debug.log(`[HTTP] Received ${response.statusCode} ${response.requestMessage.url}`, response);
            return response;
          }
        })
    })

    this.httpFetch.configure(config => {
      const handleAt = async (request: Request, force = false) => {
        let at: string;
        if (at = await this.getAccessToken(request.url, force)) request.headers.set('Authorization', `Bearer ${at}`);
      }

      config //.useStandardConfiguration()
        .withDefaults({ credentials: 'same-origin' })
        .withInterceptor({
          request: async (request) => {
            if (!request) return request;
            // TODO: better!
            let parsedUrl = buildUrl(request.url);
            if (!parsedUrl.pathname.endsWith('.md')) request.headers.set('Accept', 'application/json');
            if (this.shouldLog) Tools.Debug.log(`[HTTP-FETCH] Requesting ${request.method} ${request.url}`, request);
            await handleAt(request);
            return request;
          },
          response: async (response, request) => {
            if (!response) return response;
            if (this.shouldLog) Tools.Debug.log(`[HTTP-FETCH] Received ${response.status} ${response.url}`, response);
            if (!response.ok) throw response;
            return response;
          },
          responseError: async (response: Response, request: Request) => {
            if (response.status !== 401) throw response;
            if (this.isLogin(request.url)) throw response;
            let tries = (<any>request).tries || 0;
            if (tries > 0) throw response;
            (<any>request).tries = ++tries;
            let newRequest = new Request(request);
            (<any>newRequest).tries = tries;
            try {
              if (this.shouldLog) Tools.Debug.log(`[HTTP-FETCH] Retrying after refreshtoken`, newRequest);
              await handleAt(newRequest, true);
            } catch (err) {
              throw response;
            }
            return await this.httpFetch.fetch(newRequest);
          }
        });
    })
  }

  async getAccessToken(url: string, force = false) {
    this.tools.Debug.log("GetAT", this.w6Url.authSsl + '/', url);
    if (!url.startsWith(this.w6Url.authSsl + '/')) return null;
    let accessToken = this.accessToken;
    if (accessToken && !this.isLogin(url) && (force || Tools.isTokenExpired(accessToken)))
      if (await this.handleRefresh()) return this.accessToken;
    return accessToken;
  }
  handleRefresh = () => this.refreshing || this.tryHandleRefreshToken();

  isLogin = (url) => url.includes("/api/login/");

  static redirect(url) {
    Tools.Debug.log("$$$ [HTTP] redirecting", url);
    this.resetUnload();
    if (window.location.href === url) window.location.reload();
    else window.location.href = url;
    let toastr: Toastr = Container.instance.get(Toastr);
    toastr.warning("Redirecting, please stand by...", "Redirecting...", { timeOut: 0 })
    throw new AbortError("[HTTP] Redirecting to " + url);
  }

  redirect = (url) => LoginBase.redirect(url);

  static handleRedir(url, isLoggedIn) {
    url = url.includes('#') ? url + "&sslredir=1" : url + "#sslredir=1";
    if (isLoggedIn) url = url + "&loggedin=1";
    return url;
  }

  static toHttp(isLoggedIn) {
    let httpUrl = "http:" + window.location.href.substring(window.location.protocol.length).replace(":9001", ":9000");
    return this.handleRedir(httpUrl, isLoggedIn);
  }

  static toHttps(isLoggedIn) {
    let httpsUrl = "https:" + window.location.href.substring(window.location.protocol.length).replace(":9000", ":9001");
    return this.handleRedir(httpsUrl, isLoggedIn);
  }

  async getUserInfo(): Promise<IUserInfo> {
    this.handleLogout();

    let userInfo = await this.getUserInfoInternal();
    if (!userInfo) userInfo = new UserInfo();
    let hasSslRedir = window.location.hash.includes('sslredir=1');
    let isLoggedIn = userInfo.id ? true : false;
    if (userInfo.isPremium) {
      let isSsl = window.location.protocol === 'https:';
      if (!isSsl && !hasSslRedir) this.redirect(LoginBase.toHttps(isLoggedIn));
    }

    return userInfo;
  }

  clearRefreshToken() { window.localStorage.removeItem(LoginBase.refreshToken); }
  clearToken() { window.localStorage.removeItem(LoginBase.token); }
  clearIdToken() { window.localStorage.removeItem(LoginBase.idToken); }

  clearLoginInfo() {
    this.clearRefreshToken();
    this.clearToken();
  }

  buildLogoutParameters(url: string) { return window.localStorage[LoginBase.idToken] ? ("?id_token_hint=" + window.localStorage[LoginBase.idToken] + (url ? "&post_logout_redirect_uri=" + url : '')) : ""; }

  handleLogout() {
    if (!window.location.pathname.startsWith('/logout')) return;
    this.clearLoginInfo();
    this.resetUnload();
    if (window.location.protocol == 'https:') return this.redirect(LoginBase.toHttp(false));
    else {
      var redirectUri = window.location.search.startsWith('?redirect=') ? window.location.search.replace('?redirect=', '') : null;
      if (redirectUri) {
        // must be without #loggedin and #sslredir etc
        var idx = redirectUri.indexOf('#');
        if (idx > -1) redirectUri = redirectUri.substring(0, idx);
      }
      return this.redirect(this.w6Url.authSsl + "/identity/connect/endsession" + this.buildLogoutParameters(redirectUri || encodeURI(this.w6Url.urlNonSsl)));
    }
  }

  getBaseUrl() { return this.getOrigin() + window.location.pathname }
  getOrigin() { return window.location.protocol + '//' + window.location.host }

  async getUserInfoInternal(): Promise<IUserInfo> {
    let userInfo = null;

    let token = window.localStorage[LoginBase.token];
    if (!token) {
      this.clearIdToken();
      return userInfo;
    }
    const req = await this.httpFetch.fetch(this.w6Url.authSsl + '/identity/connect/userinfo');
    const r = await req.json();
    const roles = typeof (r["role"]) === "string" ? [r["role"]] : r["role"];

    let uInfo = {
      id: r["sub"],
      userName: r["preferred_username"],
      slug: r["preferred_username"].sluggifyEntityName(),
      displayName: r["nickname"],
      firstName: r["given_name"],
      lastName: r["family_name"],
      avatarURL: r["withsix:avatar_url"],
      hasAvatar: r["withsix:has_avatar"],
      avatarUpdatedAt: new Date(r["withsix:avatar_updated_at"]),
      email: r["withsix:email"],
      emailMd5: r["withsix:email_md5"],
      passwordSet: r["withsix:password_set"],
      emailConfirmed: r["withsix:email_confirmed"],
      hasGroups: r["withsix:has_groups"],
      roles,
      isAdmin: roles.indexOf("admin") > -1,
      isManager: roles.indexOf("manager") > -1,
      isPremium: roles.indexOf("premium") > -1
    };

    userInfo = new UserInfo();
    Object.assign(userInfo, uInfo);
    return userInfo;
  }
}

export class LoginUpdated {
  constructor(public accessToken: string) { }
}


export class UserInfo extends EntityExtends.UserBase implements IUserInfo {
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isPremium: boolean;
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isAdmin: boolean;
  // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
  isManager: boolean;
  id: string;
  slug: string;
  avatarURL: string;
  hasAvatar: boolean;
  emailMd5: string;
  firstName: string;
  lastName: string;
  userName: string;
  displayName: string;
  failedLogin: boolean;
  avatarUpdatedAt: Date;
  emailConfirmed: boolean;
  passwordSet: boolean;
  hasGroups: boolean;
  email: string;
}