import {ViewModel, SelectTab} from '../../framework';
import {Index as SettingsIndex} from '../settings/index';

export class ClientLanding extends ViewModel {
  activate(params, routeConfig) {
    let gameSlug = 'arma-3';
    if (params.gameSlug)
      gameSlug = params.gameSlug;
    else if (this.w6.activeGame.id) gameSlug = this.w6.activeGame.slug;
    this.navigateInternal("/p/" + gameSlug);

    // TODO: Support these from any page?
    if (params.openClientSettings) {
      let model = {};
      this.dialog.open({ viewModel: SettingsIndex, model: model })
      //window.w6Cheat.api.openSettings();
    } else if (params.openTab) {
      this.eventBus.publish(new SelectTab(params.openTab));
    }
  }
}
