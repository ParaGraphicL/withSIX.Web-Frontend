import {LS} from './base';
import {UiContext} from './uicontext';
import {HttpClient} from 'aurelia-http-client';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {LoginBase} from './auth-base';

@inject(AuthService, UiContext, HttpClient, FetchClient, LS)
export class Login extends LoginBase {
  constructor(public authService: AuthService, private ui: UiContext, http: HttpClient, fetch: FetchClient, private ls: LS) { super(http, fetch, ui.w6.url, ui.eventBus); }
  async login(pathAndSearch?) {
    try {
      if (console && console.log) console.log("$$$$ Trying to login")
      // Must remove the hash or we won't redirect back :)
      var url = pathAndSearch ? (this.getOrigin() + pathAndSearch) : this.w6Url.getCurrentPageWithoutHash();
      this.tools.Debug.log("logging in, return: ", url);
      if (await this.handleRefreshToken()) {
        if (console && console.log) console.log("$$$$ Handled refresh token")
        this.redirect(url);
        return;
      }

      var response = await this.authService.authenticate('localIdentityServer');
      window.localStorage[LoginBase.refreshToken] = response.content.refresh_token;
      window.localStorage[LoginBase.idToken] = response.content.id_token;
      this.ls.set('w6.event', { name: 'login', data: null }); // TODO: Include user id so we can switch logged in accts if needed?
      if (console && console.log) console.log("$$$$ Succesfully loggedin")
      this.redirect(url);
      return;
    } catch (err) {
      if (err && err.data == "Provider Popup Blocked")
        // TODO: Reconfigure without popup but redirect?
        if (await this.ui.toastr.error("Popup blocked, please allow the login popup in your browser", "Failed to login")) await this.login(pathAndSearch);
        else
          this.ui.toastr.error("Unknown error", "Failed to login");
      throw err;
    }
  }

  logout() {
    this.clearRefreshToken();
    this.resetUnload();
    var logoutUrl = this.w6Url.urlSsl + '/logout';
    if (!window.location.pathname.startsWith('/logout'))
      logoutUrl = logoutUrl + '?redirect=' + encodeURI(this.getBaseUrl() + window.location.search); // must be without #loggedin and #sslredir etc
    this.authService.logout(logoutUrl);
    // TODO: This probably doesn't fire anymore?
    this.ls.set('w6.event', { name: 'logout', data: null });
  }
}
