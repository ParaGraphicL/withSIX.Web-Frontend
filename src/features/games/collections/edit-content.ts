import {Show} from '../../profile/library/collections/show';

export class EditContent extends Show {
  timeout;
  async activate(params, routeConfig) {
    await super.activate(params, routeConfig);

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
    if (this.timeout) { clearInterval(this.timeout); this.timeout = null; }
  }
}
