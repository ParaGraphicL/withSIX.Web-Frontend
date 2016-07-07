export abstract class BaseError {
  el: JQuery;
  constructor(private code: string) { }
  resource: string;
  activate(param) {
    this.resource = param.resource;
    this.el = $('<meta name="prerender-status-code" content="' + this.code + '">');
    $('head').append(this.el);
    window.prerenderReady = true;
  }
  deactivate() { this.el.remove(); }
}
