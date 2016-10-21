import {
  BasketService, DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2, FixedDialogController, UiContext
} from "../../../framework";
import { inject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { ServerRenderBase } from './server-render-base';


@inject(DialogController, UiContext, BasketService)
export class ServerRender extends ServerRenderBase {
  activate(model) { return this.activateInternal(model); }

  constructor(public controller: FixedDialogController, ui: UiContext, bs: BasketService) {
    super(ui, bs);
  }

  cancel() {
    return this.controller.cancel();
  }
}

