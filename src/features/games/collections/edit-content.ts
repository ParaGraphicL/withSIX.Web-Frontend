import {Show} from '../../profile/library/collections/show';

export class EditContent extends Show {
  timeout;
  async activate(params, routeConfig) {
    await super.activate(params, routeConfig);

    // This works around the issue of routing for Angular while Aurelia is involved..angular
    // TODO: Better workaround than the rootscope apply?
    let iv = setInterval(() => {
      let row = angular.element("#root-content-row");
      if (row.length == 0) return;
      clearInterval(iv);
      window.w6Cheat.aureliaReady = true;
      Tk.Debug.log("AURELIA: angular vm loaded");
      angular.element(document).scope().$apply();
      $("#root-content-row").prepend($("#content"));
    }, 500);

    // pff
    this.timeout = setInterval(() => {
      if (window.w6Cheat.collection) {
        this.enableEditMode();
        clearInterval(this.timeout);
        this.timeout = null;
      }
    }, 500);
  }

  deactivate() {
    super.deactivate();
    $("#root-content-row").append($("#content"));
    if (this.timeout) { clearInterval(this.timeout); this.timeout = null; }
  }
}
