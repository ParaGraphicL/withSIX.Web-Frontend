import {HttpClient} from 'aurelia-http-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-dependency-injection';

import {IUserInfo, UserInfo} from './legacy';

export var AbortError = Tk.createError('AbortError');

@inject(HttpClient, W6Urls, EventAggregator)
export class LoginBase {
  static refreshToken = 'aurelia_refreshToken';
  static idToken = 'aurelia_id_token';
  static token = 'aurelia_token';
  static localClientId = 'withsix-spa';
  constructor(private http: HttpClient, protected w6Url: W6Urls, private eventBus: EventAggregator) { }
  static resetUnload() { window.onbeforeunload = null; }
  resetUnload() { LoginBase.resetUnload(); }
  async handleRefreshToken() {
    var refreshToken = window.localStorage[LoginBase.refreshToken];
    if (!refreshToken) return false;
    try {
      var r = await this.http.post(this.w6Url.authSsl + "/api/login/refresh", { refreshToken: refreshToken, clientId: LoginBase.localClientId, idToken: window.localStorage[LoginBase.idToken] }); /* authConfig.providers.localIdentityServer.clientId */
      this.updateAuthInfo(r.content.refresh_token, r.content.token, r.content.id_token);
      return true;
    } catch (err) {
      Tk.Debug.error("Error trying to use refresh token", err);
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

    this.eventBus.publish(new LoginUpdated(accessToken));
  }

  static redirect(url) {
    Tk.Debug.log("$$$ redirecting", url);
    this.resetUnload();
    window.location.href = url;
    throw new AbortError("Redirecting to " + url);
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
    let hasLoggedIn = window.location.hash.includes('loggedin=1');
    let isLoggedIn = userInfo.id ? true : false;
    if (userInfo.isPremium) {
      let isSsl = window.location.protocol === 'https:';
      if (!isSsl && !hasSslRedir) {
        if (console && console.log) console.log("$$$$ premium and Not SSL, and NOT SSLRedirected");
        this.redirect(LoginBase.toHttps(isLoggedIn));
        throw new AbortError("need ssl redir");
      }
    }

    let hash = window.location.hash;

    if (hasSslRedir) {
      window.w6Cheat.redirected = true;
      hash = Tools.cleanupHash(hash.replace(/\&?sslredir=1/g, ""));
    }
    if (hasLoggedIn) {
      hash = Tools.cleanupHash(hash.replace(/\&?loggedin=1/g, ""))
      window.w6Cheat.redirectedWasLoggedIn = true;
    }
    if (hasSslRedir || hasLoggedIn)  this.updateHistory(window.location.pathname + window.location.search + hash);

    return userInfo;
  }

  clearRefreshToken() { window.localStorage.removeItem(LoginBase.refreshToken); }
  clearToken() { window.localStorage.removeItem(LoginBase.token); }
  clearIdToken() { window.localStorage.removeItem(LoginBase.idToken); }

  clearLoginInfo() {
    this.clearRefreshToken();
    this.clearToken();
  }

  updateHistory = (desired) => history.replaceState("", document.title, desired)

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
      Tk.Debug.log("token is not valid")
      try {
        await this.handleRefreshToken();
      } catch (err) {
        throw new Error("Expired token");
      }
    }
    // TODO: add #login=1 etc, to prevent endless loops?

    //var http = new HttpClient();
    //http.configure(x => x.withHeader("Authorization", 'Bearer ' + window.localStorage[LoginBase.token]));
    var req = <any>this.http.createRequest(this.w6Url.authSsl + '/identity/connect/userinfo');
    var response = await req.withHeader("Authorization", 'Bearer ' + window.localStorage[LoginBase.token]).asGet().send();
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

    userInfo = new UserInfo();
    Object.assign(userInfo, uInfo);
    return userInfo;
  }
}

export class LoginUpdated {
  constructor(public accessToken: string) { }
}
