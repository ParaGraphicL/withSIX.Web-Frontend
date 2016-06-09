import {ViewModel} from '../../framework';

import {MainBase} from './index';

export class Download extends MainBase {
  redir: string;
  activate(params, routeConfig) {
    var redirectUri = params["redirect"];
    this.redir = redirectUri ? "&redirect=" + encodeURIComponent(redirectUri) : null;
  }
}
