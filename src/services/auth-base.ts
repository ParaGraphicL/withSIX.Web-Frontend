import {HttpClient} from 'aurelia-http-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-dependency-injection';

import {IUserInfo, UserInfo} from './legacy';

export class AbortError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@inject(HttpClient, W6Urls, EventAggregator)
export class LoginBase {
  static refreshToken = 'aurelia_refreshToken';
  static idToken = 'aurelia_id_token';
  static token = 'aurelia_token';
  static localClientId = 'withsix-spa';
  constructor(private http: HttpClient, private w6Url: W6Urls, private eventBus: EventAggregator) { }
  static resetUnload() { window.onbeforeunload = null; }
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

  redirect(url) { LoginBase.redirect(url); }

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
    let userInfo = await this.getUserInfoInternal();
    if (!userInfo) userInfo = new UserInfo();
    let hasSslRedir = window.location.hash.includes('sslredir=1');
    let hasLoggedIn = window.location.hash.includes('loggedin=1');
    let isLoggedIn = userInfo.id ? true : false;
    if (userInfo.isPremium) {
      let isSsl = window.location.protocol === 'https:';
      if (userInfo.isPremium && !isSsl && !hasSslRedir && Tk.getEnvironment() < Tk.Environment.Local) {
        this.redirect(LoginBase.toHttps(isLoggedIn));
        throw new Error("need ssl redir");
      }
    }

    let hash = window.location.hash;

    if (hasSslRedir) {
      hash = hash.replace("&sslredir=1", "").replace("#sslredir=1", "");
      window.w6Cheat.redirected = true;
    }
    if (hasLoggedIn) {
      hash = hash.replace("&loggedin=1", "").replace("#loggedin=1", "");
      window.w6Cheat.redirectedWasLoggedIn = true;
    }
    if (hasSslRedir || hasLoggedIn) history.replaceState("", document.title, window.location.pathname + window.location.search + hash);

    return userInfo;
  }

  clearRefreshToken() { window.localStorage.removeItem(LoginBase.refreshToken); }
  clearToken() { window.localStorage.removeItem(LoginBase.token); }
  clearIdToken() { window.localStorage.removeItem(LoginBase.idToken); }

  clearLoginInfo() {
    this.clearRefreshToken();
    this.clearToken();
  }

  buildLogoutParameters() { return window.localStorage[LoginBase.idToken] ? ("?id_token_hint=" + window.localStorage[LoginBase.idToken] + "&post_logout_redirect_uri=" + encodeURI(window.location.href)) : ""; }

  async getUserInfoInternal(): Promise<IUserInfo> {
    let hasLogout = window.location.search.includes('?logout=1');
    if (hasLogout) {
      this.clearLoginInfo();
      if (window.location.protocol == 'https:') {
        this.redirect(LoginBase.toHttp(false));
      } else {
        history.replaceState("", document.title, window.location.pathname + window.location.search.replace("&logout=1", "").replace("?logout=1", "") + window.location.hash);
        this.redirect(this.w6Url.authSsl + "/identity/connect/endsession" + this.buildLogoutParameters());
      }
      throw new Error("have to logout");
    }

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
