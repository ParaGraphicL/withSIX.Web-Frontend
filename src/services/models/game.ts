import { Tools } from "../tools";
import { ManagedServer } from "./managed-server";

export class Game {
  activeServer: ManagedServer;
  servers: Map<string, ManagedServer>;
  id: string;
  overview: { id: string, name: string }[] = []

  constructor(data: { id: string, servers: Map<string, ManagedServer> }) {
    this.id = data.id;
    this.servers = data.servers;
    if (this.servers.size > 0) {
      this.activeServer = this.servers[0];
      const { id, name } = this.activeServer;
      this.overview.push({ id, name });
    }
  }

  get(id: string) { return this.servers.get(id); }

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
