import { ServerSize, VoidCommand, handlerFor } from "../../../../framework";
import { ServerHandler } from "./base";

export class Command extends VoidCommand {
  constructor(public id: string, public size: ServerSize, public additionalSlots: number) { super(); }
}

@handlerFor(Command)
export class Handler extends ServerHandler<Command, void> {
  handle(request: Command) {
    return this.client.servers.scale(request.id, request.size, request.additionalSlots);
  }
}