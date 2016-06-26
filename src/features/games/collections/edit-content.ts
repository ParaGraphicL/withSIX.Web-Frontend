import {Show} from '../../profile/library/collections/show';

export class EditContent extends Show {
  timeout;
  async activate(params, routeConfig) {
    await super.activate(params, routeConfig);
    // TODO!
    this.model = this.w6.collection2;


    // pff
    this.timeout = setInterval(() => {
      if (this.w6.collection) {
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
