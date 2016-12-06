import { DbQuery, Query, ViewModel, VoidCommand, W6Context, handlerFor, uiCommand2 } from "../../../framework";

export class Index extends ViewModel {
  server;
  activate(server) { this.server = server; }
  get mods() { return this.server.mods; }
  remove(m) { this.mods.delete(m.id); }
}
