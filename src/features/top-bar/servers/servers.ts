import { Query, SelectTab, ViewModel, Command, VoidCommand, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab, handlerFor } from '../../../framework';
import { ServerHandler } from "../../rside-bar/control/actions/base";

import { inject } from 'aurelia-framework';

export class Servers extends ViewModel {
  model: ITab;

  async activate(model: ITab) {
    this.model = model;
  }

  async add() {
    await new AddServer(this.w6.activeGame.id).handle(this.mediator);
    this.eventBus.publish(new SelectTab("setup"));
  }
}

export class AddServer extends Command<string> {
  constructor(public gameId: string) { super(); }
}

@handlerFor(AddServer)
export class AddServerHandler extends ServerHandler<AddServer, string> {
  async handle(req: AddServer) {
    return this.store.activeGame.add();
  }
}
