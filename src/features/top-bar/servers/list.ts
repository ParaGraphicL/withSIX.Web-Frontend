import { Query, SelectTab, ViewModel, VoidCommand, UiContext, MenuItem, uiCommand2, Debouncer, IMenuItem, ITab, handlerFor } from '../../../framework';
import { ServerHandler } from "../../rside-bar/control/actions/base";

import { inject } from 'aurelia-framework';

export class List extends ViewModel {
  servers: IServerEntry[];
  active: IServerEntry;

  async activate() {
    const { servers, active } = await new GetServers(this.w6.activeGame.id).handle(this.mediator);
    this.servers = servers;
    this.active = active;
  }

  async select(server: IServerEntry) {
    await new SelectServer(this.w6.activeGame.id, server.id).handle(this.mediator);
    this.eventBus.publish(new SelectTab("setup"));
  }

  async delete(server: IServerEntry) {
    confirm("TODO");
  }
}

interface IServerEntry { id: string; name: string; }
interface IResult { servers: IServerEntry[]; active: IServerEntry; }

export class GetServers extends Query<IResult> {
  constructor(public gameId: string) { super(); }
}

@handlerFor(GetServers)
export class GetServersHandler extends ServerHandler<GetServers, IResult> {
  async handle(req: GetServers) {
    // todo; just fetch!
    return {
      active: this.store.activeGame.overview.filter(x => x.id === this.store.activeGame.activeServer.id)[0],
      servers: this.store.activeGame.overview,
    };
  }
}

export class SelectServer extends VoidCommand {
  constructor(public gameId: string, public id: string) { super() }
}

@handlerFor(SelectServer)
export class SelectServerHandler extends ServerHandler<SelectServer, IResult> {
  handle(req: SelectServer) {
    return this.store.select(req.id);
  }
}
