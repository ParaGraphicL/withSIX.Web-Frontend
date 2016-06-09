import {Router} from 'aurelia-router';
import {Dialog} from '../../framework';

export class Index extends Dialog<any> {
  page = "games";

  activate(model) {
    super.activate(model || {});
    this.page = (model && model.module) || "general";
    //this.controller.settings.lock = false;
    // Try catch because of weird issue with router inside Dialog..
    this.subscriptions.subd(d => {
      this.eventBus.subscribe("closeSettingsDialogOk", () => { this.controller.ok(null) });
      this.eventBus.subscribe("closeSettingsDialogCancel", () => { this.controller.cancel(null) });
    })
  }
  // configureRouter(config, router: Router) {
  //   this.router = router;
  //   config.title = 'Settings';
  //   config.map([
  //     { route: ['', 'general'],       name: 'general',       moduleId: 'settings/general' },
  //     { route: ['games'],       name: 'games',       moduleId: 'settings/games' }
  //   ]);
  // }
}
