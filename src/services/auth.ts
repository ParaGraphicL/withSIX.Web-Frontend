import { LS } from './base';
import { UiContext } from './uicontext';
import { HttpClient } from 'aurelia-http-client';
import { HttpClient as FetchClient } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject } from 'aurelia-framework';
import { AuthService } from 'aurelia-auth';
import { LoginBase, AbortError } from './auth-base';

@inject(AuthService, UiContext, HttpClient, FetchClient, LS)
export class Login extends LoginBase {
  constructor(public authService: AuthService, private ui: UiContext, http: HttpClient, fetch: FetchClient, ls: LS) { super(http, fetch, ui.w6.url, ui.eventBus, ls); }
  async login(pathAndSearch?) {
    try {
      // Must remove the hash or we won't redirect back :)
      this.tools.Debug.log("logging in, return: ", pathAndSearch);
      if (await this.handleRefreshToken()) {
        await this.handleUserUpgrade(pathAndSearch);
        return;
      }

      var response = await this.authService.authenticate('localIdentityServer');
      window.localStorage[LoginBase.refreshToken] = response.content.refresh_token;
      window.localStorage[LoginBase.idToken] = response.content.id_token;
      this.ls.set('w6.event', { name: 'login', data: null }); // TODO: Include user id so we can switch logged in accts if needed?
      await this.handleUserUpgrade(pathAndSearch);
      return true;
    } catch (err) {
      if (!err) throw err;
      if (err instanceof AbortError) return true;
      await this.handleLoginError(err, pathAndSearch);
      return false;
    }
  }

  async handleUserUpgrade(pathAndSearch?: string) {
    let url = pathAndSearch ? (this.getOrigin() + pathAndSearch) : this.w6Url.getCurrentPageWithoutHash(); //pathAndSearch;
    //this.ui.w6.userInfo = await this.getUserInfo();
    if (url) this.redirect(url);
    //else if (this.ui.w6.userInfo.isPremium && !window.location.href.startsWith("https://")) this.redirect(window.location.href);
    this.ui.notifyAngularInternal();
  }

  async handleLoginError(err, pathAndSearch?: string) {
    if (err.data) {
      if (err.data == "Provider Popup Blocked") {
        // TODO: Reconfigure without popup but redirect?
        if (await this.ui.toastr.error("Popup blocked, please allow withSIX popups, and click here to try again", "Login failure", { timeOut: 0 })
          || await this.ui.toastr.error("Please allow withSIX popups and click here to try again", "Login failure", { timeOut: 0 })) {
          await this.login(pathAndSearch);
          return;
        }
      } else if (err.data == "Problem poll popup") {
        if (await this.ui.toastr.warning(`The popup was closed without logging in succesfully. Click here to try again`, "Login cancelled", { timeOut: 0 })) {
          await this.login(pathAndSearch);
          return;
        }
      } else this.ui.toastr.error(`Unknown error: ${err.data}`, "Login failure")
    } else if (err.error) this.ui.toastr.error(`Unknown error: ${err.error}`, "Login failure")
    else if (err instanceof Error) this.ui.toastr.error(`Unknown error: ${err}`, "Login failure")
    else this.ui.toastr.error(`Unknown error`, "Login failure")
    throw err;
  }

  async logout() {
    this.clearRefreshToken();
    this.resetUnload();
    var logoutUrl = this.w6Url.urlSsl + '/logout';
    if (!window.location.pathname.startsWith('/logout'))
      logoutUrl = logoutUrl + '?redirect=' + encodeURI(this.getBaseUrl() + window.location.search); // must be without #loggedin and #sslredir etc
    //await this.http.post(this.w6Url.authSsl + "/login/logout", {});
    this.authService.logout(logoutUrl);
    // TODO: This probably doesn't fire anymore?
    this.ls.set('w6.event', { name: 'logout', data: null });
  }
}
