import {ViewModel, SelectTab} from '../../framework';
import {Index as SettingsIndex} from '../settings/index';

export class ClientLanding extends ViewModel {
  async activate(params, routeConfig) {
    let gameSlug = 'arma-3';
    if (params.gameSlug) gameSlug = params.gameSlug;
    else if (this.w6.activeGame.id) gameSlug = this.w6.activeGame.slug;

    this.navigateInternal("/p/" + gameSlug);

    const compareStr = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

    // DO NOT AWAIT
    new Promise((res, rej) => {
      if (compareStr(this.w6.activeGame.slug, gameSlug)) return res();
      const to = setTimeout(() => {
        clearInterval(iv);
        rej();
      }, 30 * 1000);
      const iv = setInterval(() => {
        if (this.w6.activeGame.slug === gameSlug) { clearTimeout(to); clearInterval(iv); res(); }
      }, 100);
    }).then(() => {
      // TODO: Support these from any page?
      if (params.openClientSettings) {
        let model = {};
        this.openSettingsDialog(model);
        //this.w6.api.openSettings();
      } else if (params.openTab) {
        this.eventBus.publish(new SelectTab(params.openTab));
      }
    })
  }
  openSettingsDialog = (model = {}) => this.dialog.open({ viewModel: SettingsIndex, model: model })
}
