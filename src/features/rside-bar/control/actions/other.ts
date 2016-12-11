// TODO: Decompose

import { handlerFor, DbQuery, Command, Query, ServerStore, VoidCommand, ServerState, ServerAction, RequestBase, ServerClient, IManagedServer, IManagedServerStatus } from "../../../../framework";
import { ServerHandler } from "./base";

export class CreateOrUpdateServer extends Command<IManagedServer> {
  constructor(public gameId: string, public id: string, public serverInfo) { super(); }
}

@handlerFor(CreateOrUpdateServer)
class CreateOrUpdateServerHandler extends ServerHandler<CreateOrUpdateServer, IManagedServer> {
  async handle(request: CreateOrUpdateServer) {
    const server = this.store.get(request.gameId).servers.get(request.id);
    const s = await this.client.servers.createOrUpdate(request);
    // TODO: Store the return in the store?
    server.unsaved = undefined;
    server.slug = s.slug;
    return s;
  }
}

export class GetServerState extends Query<IManagedServerStatus> { constructor(public id: string) { super(); } }

@handlerFor(GetServerState)
class GetServerStateHandler extends ServerHandler<GetServerState, IManagedServer> {
  handle(request: GetServerState) { return this.client.servers.get(request.id); }
}

export class StartServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(StartServer)
class StartServerStateHandler extends ServerHandler<StartServer, void> {
  handle(request: StartServer) { return this.client.servers.start(request.id); }
}

export class StopServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(StopServer)
class StopServerStateHandler extends ServerHandler<StopServer, void> {
  handle(request: StopServer) { return this.client.servers.stop(request.id); }
}

export class RestartServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(RestartServer)
class RestartServerStateHandler extends ServerHandler<RestartServer, void> {
  handle(request: RestartServer) { return this.client.servers.restart(request.id); }
}

export class PrepareServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(PrepareServer)
class PrepareServerStateHandler extends ServerHandler<PrepareServer, void> {
  handle(request: PrepareServer) { return this.client.servers.prepare(request.id); }
}

export class GetLogs extends Query<string[]> {
  constructor(public serverId: string) { super(); }
}

@handlerFor(GetLogs)
class GetLogsHandler extends ServerHandler<GetLogs, string[]> {
  handle(request: GetLogs) { return this.client.uploader.getFiles("logs", ".gz", request.serverId); }
}

export class GetLog extends Query<string> {
  constructor(public fileName: string, public serverId: string) { super(); }
}

@handlerFor(GetLog)
class GetLogHandler extends ServerHandler<GetLog, string> {
  handle(request: GetLog) { return this.client.uploader.getFile("logs", request.fileName, request.serverId); }
}
