import { Base } from "../base";
import { EntityExtends } from "../entity-extends";
import { gcl, gql, createFragment, toGlobalId, idFromGlobalId, fromGraphQL, IGQLResponse, IGQLViewerResponse } from "../graphqlclient";
import { Tools } from "../tools";
import { W6 } from "../withSIX";
import { inject } from "aurelia-framework";
import { IBasketItem } from "../legacy/baskets";

import { ICancellationToken } from "../reactive";

import { IManagedServer, IArmaSettings, IServerSession, ServerLocation, ServerSize, ServerState } from "../w6api/servers-api";
import { IServerClient } from "../w6api/server-client";
import { ModAddedToServer } from "../events/mod-added-to-server";
import { RemovedModFromServer } from "../events/removed-mod-from-server";
export { ModAddedToServer, RemovedModFromServer }

export class ManagedServer extends EntityExtends.BaseEntity {
  private static SUBSCRIPTION_QUERY = gql`
subscription($serverId: ID!) {
  serverStateChanged(serverId: $serverId) {
    state
    message
    address
    endtime
  }
}
`;

  id: string;
  unsaved: boolean;

  location: ServerLocation = ServerLocation.WestEU;
  size: ServerSize = ServerSize.Normal;
  secondaries: Array<{ size: ServerSize; }> = [];

  additionalSlots = 0;

  name: string;
  password: string;
  adminPassword: string;

  // TODO: Game specific
  settings: IArmaSettings = <any>{
    battlEye: true, drawingInMap: true, enableDefaultSecurity: true, verifySignatures: true, vonQuality: 12,
  };

  mods: Map<string, { id: string }> = new Map<string, { id: string }>();
  missions: Map<string, { id: string }> = new Map<string, { id: string }>();
  status: IServerSession;

  globalId: string;

  constructor(private data) {
    super();
    this.status = this.getDefaultState();
    Object.assign(this, data);
    this.globalId = toGlobalId("ManagedServer", this.id);
  }

  getDefaultState() { return <any>{ state: ServerState.Initializing }; }

  async monitor(client: IServerClient) {
    const s = gcl.subscribe({
      query: ManagedServer.SUBSCRIPTION_QUERY,
      variables: { serverId: this.globalId },
    }).subscribe({
      next: (data) => this.status = data.serverStateChanged,
      error: (err) => Tools.Debug.error("Error while processing event", err),
    });
    await this.refreshState(client);
    return s;
  }

  async refreshState(client: IServerClient) {
    const status = await this.graphRefreshState();
    this.status = status ? status : this.getDefaultState();
    /*
    try {
      this.status = await client.servers.session(this.id);
    } catch (err) {
      if (err.status === 404 || err.toString().indexOf('Failed request 404') > -1) {
        this.status = this.getDefaultState();
        this.unsaved = true;
      } else { throw err; }
    }
    */
  }

  // Optimize this server-side, so that GQL doesnt actually pull in the whole server? :-P
  async graphRefreshState() {
    const { data }: IGQLResponse<{ managedServerStatus: { address: string; state: ServerState; message: string; endtime: string } }>
      = await gcl.query({
        forceFetch: true,
        query: gql`
                query GetServerStatus($id: ID!) {
                  managedServerStatus(id: $id) {
                    address
                    state
                    message
                    endtime
                  }
                }`,
        variables: {
          id: this.globalId,
        },
      });

    if (!data.managedServerStatus) {
      return this.getDefaultState();
    } else {
      const { state, message, address, endtime } = data.managedServerStatus;
      return { state, message, address, endtime: endtime ? new Date(endtime) : null };
    }
  }

  toggleMod(mod: IBasketItem) {
    if (this.mods.has(mod.id)) {
      this.mods.delete(mod.id);
      const { id } = this;
      ManagedServer.eventPublisher(new RemovedModFromServer(mod, id));
    } else {
      this.mods.set(mod.id, mod);
      const { id } = this;
      ManagedServer.eventPublisher(new ModAddedToServer(mod, id));
    }
  }

  toggleMission(mission: { id: string; name: string }) {
    if (this.missions.has(mission.id)) { this.missions.delete(mission.id); } else { this.missions.set(mission.id, mission); }
  }

  hasMod(id: string) { return this.mods.has(id); }
  hasMission(id: string) { return this.missions.has(id); }

  // TODO: Decreased interval while actions are running..
  start(client: IServerClient) { return client.servers.start(this.id); }
  stop(client: IServerClient) { return client.servers.stop(this.id); }
  restart(client: IServerClient) { return client.servers.restart(this.id); }
  prepare(client: IServerClient) { return client.servers.prepare(this.id); }
}
