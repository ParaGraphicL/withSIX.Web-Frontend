import {HttpClient} from 'aurelia-http-client';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {inject, Container} from 'aurelia-dependency-injection';

import {EntityExtends, IUserInfo} from './dtos';
import {W6Urls} from './withSIX';
import {Tools} from './tools';

export var AbortError = Tools.createError('AbortError');

@inject(HttpClient, FetchClient, W6Urls, EventAggregator)
export class LoginBase {
  shouldLog = (Tools.getEnvironment() > Tools.Environment.Production);

  get tools() { return Tools; }
  static refreshToken = 'aurelia_refreshToken';
  static idToken = 'aurelia_id_token';
  static token = 'aurelia_token';
  static localClientId = 'withsix-spa';
  constructor(private http: HttpClient, private httpFetch: FetchClient, protected w6Url: W6Urls, private eventBus: EventAggregator) { }
  static resetUnload() { window.onbeforeunload = null; }
  resetUnload() { LoginBase.resetUnload(); }
  refreshing: Promise<boolean>;
  async tryHandleRefreshToken() {
    try {
      return await (this.refreshing = this.handleRefreshToken());
    } finally {
      this.refreshing = null;
    }
  }

  async handleRefreshToken() {
    var refreshToken = window.localStorage[LoginBase.refreshToken];
    if (!refreshToken) return false;
    if (this.shouldLog) Tools.Debug.log(`[HTTP] Trying to refresh token`);
    try {
      var r = await this.http.post(this.w6Url.authSsl + "/api/login/refresh", { refreshToken: refreshToken, clientId: LoginBase.localClientId, idToken: window.localStorage[LoginBase.idToken] }); /* authConfig.providers.localIdentityServer.clientId */
      this.updateAuthInfo(r.content.refresh_token, r.content.token, r.content.id_token);
      return true;
    } catch (err) {
      this.tools.Debug.error("[HTTP] Error trying to use refresh token", err);
      if (err.statusCode == 401) {
        window.localStorage.removeItem(LoginBase.refreshToken);
        return false;
      }
      // TODO: Wait for X amount of delay, then see if we actually have a valid refresh token (other tab)
      throw err;
    }
  }

  updateAuthInfo(refreshToken: string, accessToken: string, idToken: string) {
    window.localStorage[LoginBase.refreshToken] = refreshToken;
    window.localStorage[LoginBase.token] = accessToken;
    window.localStorage[LoginBase.idToken] = idToken;

    this.setHeaders(accessToken);

    this.eventBus.publish(new LoginUpdated(accessToken));
  }

  get isRequesting() { return this.httpFetch.isRequesting || this.http.isRequesting }

  setHeaders(accessToken: string) {
    let ag = Container.instance.get(EventAggregator);
    //http://stackoverflow.com/questions/9314730/display-browser-loading-indicator-like-when-a-postback-occurs-on-ajax-calls

    this.http.configure(config => {
      const handleAt = async (request, force = false) => {
        let at: string;
        if (at = await this.getAccessToken(request.url, accessToken, force)) {
          accessToken = at;
          request.headers.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }
      config.withHeader('Accept', 'application/json');
      config.withInterceptor({
        request: async (request) => {
          if (!request) return;
          if (this.shouldLog) Tools.Debug.log(`[HTTP] Requesting ${request.method} ${request.url}`, request);
          await handleAt(request);
          return request;
        },
        response: (response) => {
          if (!response) return response;
          if (this.shouldLog) Tools.Debug.log(`[HTTP] Received ${response.statusCode} ${response.requestMessage.url}`, response);
          return response;
        }
      })
    })

    this.httpFetch.configure(config => {
      let headers = {
        'Accept': 'application/json',
        //'X-Requested-With': 'Fetch'
      }

      const handleAt = async (request: Request, force = false) => {
        let at: string;
        if (at = await this.getAccessToken(request.url, accessToken, force)) {
          accessToken = at;
          request.headers.append('Authorization', `Bearer ${accessToken}`);
        }
      }

      config //.useStandardConfiguration()
        .withDefaults({ headers, credentials: 'same-origin' })
        .withInterceptor({
          request: async (request) => {
            if (!request) return request;
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
            if (this.isLogin(request.url)) throw response;
            if (response.status != 401) throw response;
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

  async getAccessToken(url: string, accessToken: string, force = false) {
    if (!url.startsWith(this.w6Url.authSsl + '/')) return null;
    if (!this.isLogin(url) && accessToken && (force || Tools.isTokenExpired(accessToken)))
      if (await this.handleRefresh()) accessToken = window.localStorage[LoginBase.token];
    return accessToken;
  }
  handleRefresh = () => this.refreshing || this.tryHandleRefreshToken();

  isLogin = (url) => url.includes("/api/login/");

  static redirect(url) {
    Tools.Debug.log("$$$ [HTTP] redirecting", url);
    this.resetUnload();
    window.location.href = url;
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

    this.setHeaders(window.localStorage[LoginBase.token]);

    let userInfo = await this.getUserInfoInternal();
    if (!userInfo) userInfo = new EntityExtends.UserInfo();
    let hasSslRedir = window.location.hash.includes('sslredir=1');
    let isLoggedIn = userInfo.id ? true : false;
    if (userInfo.isPremium) {
      let isSsl = window.location.protocol === 'https:';
      if (!isSsl && !hasSslRedir) {
        if (console && console.log) console.log("$$$$ premium and Not SSL, and NOT SSLRedirected");
        this.redirect(LoginBase.toHttps(isLoggedIn));
        throw new AbortError("need ssl redir");
      }
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
    let hasLogout = window.location.pathname.startsWith('/logout');
    if (!hasLogout) return;
    this.clearLoginInfo();
    this.resetUnload();
    if (window.location.protocol == 'https:') {
      if (console && console.log) console.log("$$$$ Logging out, redirecting to http");
      this.redirect(LoginBase.toHttp(false));
    } else {
      var redirectUri = window.location.search.startsWith('?redirect=') ? window.location.search.replace('?redirect=', '') : null;
      if (redirectUri) {
        // must be without #loggedin and #sslredir etc
        var idx = redirectUri.indexOf('#');
        if (idx > -1) redirectUri = redirectUri.substring(0, idx);
      }
      if (console && console.log) console.log("$$$$ Logged out, redirecting to auth endpoint");
      this.redirect(this.w6Url.authSsl + "/identity/connect/endsession" + this.buildLogoutParameters(redirectUri || encodeURI(this.w6Url.urlNonSsl)));
    }
    throw new AbortError("have to logout");
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
    var isValid = false;
    isValid = !Tools.isTokenExpired(token);
    if (!isValid) {
      this.tools.Debug.log("token is not valid")
      try {
        if (!(await this.tryHandleRefreshToken())) throw new Error("Expired token");
      } catch (err) {
        throw new Error("Expired token");
      }
    }
    // TODO: add #login=1 etc, to prevent endless loops?

    var req = <any>this.http.createRequest(this.w6Url.authSsl + '/identity/connect/userinfo');
    var response = await req.asGet().send();
    var roles = typeof (response.content["role"]) == "string" ? [response.content["role"]] : response.content["role"];

    let uInfo = {
      id: response.content["sub"],
      userName: response.content["preferred_username"],
      slug: response.content["preferred_username"].sluggifyEntityName(),
      displayName: response.content["nickname"],
      firstName: response.content["given_name"],
      lastName: response.content["family_name"],
      avatarURL: response.content["withsix:avatar_url"],
      hasAvatar: response.content["withsix:has_avatar"],
      avatarUpdatedAt: new Date(response.content["withsix:avatar_updated_at"]),
      emailMd5: response.content["withsix:email_md5"],
      roles: roles,
      isAdmin: roles.indexOf("admin") > -1,
      isManager: roles.indexOf("manager") > -1,
      isPremium: roles.indexOf("premium") > -1
    };

    userInfo = new EntityExtends.UserInfo();
    Object.assign(userInfo, uInfo);
    return userInfo;
  }
}

export class LoginUpdated {
  constructor(public accessToken: string) { }
}
