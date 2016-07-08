import {ViewModel} from '../framework';

export abstract class BaseError extends ViewModel {
  el: JQuery;
  constructor(private code: string, ui) { super(ui); }
  resource: string;
  activate(param) {
    this.resource = param.resource;
    this.el = $('<meta name="prerender-status-code" content="' + this.code + '">');
    $('head').append(this.el);
    window.prerenderReady = true;
    let hash = window.location.hash;
    if (hash.includes("initial=1")) {
      hash = this.tools.cleanupHash(hash.replace(/\&?initial=1/g, ""));
      this.w6.updateHistory(window.location.pathname + window.location.search + hash);
    } else if (this.resource)
      this.w6.navigate(this.resource);
  }
  deactivate() { this.el.remove(); }
}
