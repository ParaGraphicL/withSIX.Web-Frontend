import {LS} from './base';
import {UiContext} from './uicontext';
import {HttpClient} from 'aurelia-http-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {LoginBase} from './auth-base';

@inject(AuthService, UiContext, HttpClient, LS)
export class Login extends LoginBase {
  constructor(public authService: AuthService, private ui: UiContext, http: HttpClient, private ls: LS) { super(http, ui.w6.url, ui.eventBus); }
  async login(path?) {
    try {
      var url = path ? (window.location.protocol + '//' + window.location.host + path) : window.location.href;
      Tk.Debug.log("logging in, return: ", url);
      if (await this.handleRefreshToken()) {
        this.redirect(url);
        return;
      }

      var response = await this.authService.authenticate('localIdentityServer');
      window.localStorage[LoginBase.refreshToken] = response.content.refresh_token;
      window.localStorage[LoginBase.idToken] = response.content.id_token;
      this.ls.set('w6.event', { name: 'login', data: null }); // TODO: Include user id so we can switch logged in accts if needed?
      this.redirect(url);
      return;
    } catch (err) {
      if (err && err.data == "Provider Popup Blocked")
        // TODO: Reconfigure without popup but redirect?
        if (await this.ui.toastr.error("Popup blocked, please allow the login popup in your browser", "Failed to login")) await this.login(path);
        else
          this.ui.toastr.error("Unknown error", "Failed to login");
      throw err;
    }
  }

  logout() {
    this.clearRefreshToken();
    window.onbeforeunload = null;
    this.authService.logout(this.ui.w6.url.urlSsl + "?logout=1");
    // TODO: This probably doesn't fire anymore?
    this.ls.set('w6.event', { name: 'logout', data: null });
  }
}
