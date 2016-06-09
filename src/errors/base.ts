export abstract class BaseError {
  el: JQuery;
  constructor(private code: string) {}
  activate() {
    this.el = $('<meta name="prerender-status-code" content="' + this.code + '">');
    $('head').append(this.el);
    window.prerenderReady = true;
  }
  deactivate() { this.el.remove(); }
}
