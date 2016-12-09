import { Tools } from "../tools";
import { ManagedServer } from "./managed-server";

export class Game {
  activeServer: ManagedServer;
  servers: Map<string, ManagedServer>;
  id: string;

  constructor(data: { id: string, servers: Map<string, ManagedServer> }) {
    this.id = data.id;
    this.servers = data.servers;
    if (this.servers.size > 0) {
      this.activeServer = this.servers[0];
    } else {
      this.activeServer = this.create();
    }
    this.overview = [{ id: this.activeServer.id, name: this.activeServer.name }];
  }

  get(id: string) { return this.servers.get(id); }

  overview: { id: string, name: string }[] = []

  add() {
    const newS = this.create();
    const { id, name } = newS;
    this.overview.push({ id, name });
    this.activeServer = newS;
    return newS.id;
  }

  create() {
    const s = new ManagedServer({ id: Tools.generateGuid(), unsaved: true });
    this.servers.set(s.id, s);
    return s;
  }

  //add(server: Server) { this.servers.push(server); }
  remove(server: ManagedServer) { this.servers.delete(server.id); }
}
