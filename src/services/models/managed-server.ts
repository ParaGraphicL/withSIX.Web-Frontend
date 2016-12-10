import { Base } from "../base";
import { EntityExtends } from "../entity-extends";
import { GQLClient, gql, toGlobalId, idFromGlobalId, fromGraphQL, IGQLResponse, IGQLViewerResponse } from "../graphqlclient";
import { Tools } from "../tools";
import { W6 } from "../withSIX";
import { inject } from "aurelia-framework";
import { IBasketItem } from "../legacy/baskets";

import { ICancellationToken } from "../reactive";
import { Observable, Subject } from "rxjs";
import { CollectionScope } from "withsix-sync-api";

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
  slug: string;
  description: string;
  scope: CollectionScope;
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

  static observe(gcl: GQLClient, serverId: string): Observable<IServerSession> {
    return Observable.create((obs: Subject<IServerSession>) => {
      return gcl.ac.subscribe({
        query: ManagedServer.SUBSCRIPTION_QUERY,
        variables: { serverId },
      }).subscribe({
        error: (err) => obs.error(err),
        next: (data) => obs.next(data.serverStateChanged),
      });
    })

  }

  async monitor(client: IServerClient, gcl: GQLClient) {
    const s = ManagedServer.observe(gcl, this.globalId)
      .subscribe(x => this.status = x);
    gcl.ac.subscribe({
      query: ManagedServer.SUBSCRIPTION_QUERY,
      variables: { serverId: this.globalId },
    }).subscribe({
      error: (err) => Tools.Debug.error("Error while processing event", err),
      next: (data) => this.status = data.serverStateChanged,
    });
    const sub = gcl.wsReconnected.flatMap((x) => this.refreshState(client, gcl)).subscribe((x) => this.updateStatus(x));
    this.updateStatus(await this.refreshState(client, gcl));
    return { unsubscribe: () => { s.unsubscribe(); sub.unsubscribe(); } };
  }

  // Optimize this server-side, so that GQL doesnt actually pull in the whole server? :-P
  async graphRefreshState(gcl: GQLClient) {
    const { data }: IGQLResponse<{ managedServerStatus: IServerSession }>
      = await gcl.ac.query({
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
    if (this.missions.has(mission.id)) {
      this.missions.delete(mission.id);
    } else {
      this.missions.set(mission.id, mission);
    }
  }

  hasMod(id: string) { return this.mods.has(id); }
  hasMission(id: string) { return this.missions.has(id); }

  // TODO: Decreased interval while actions are running..
  start(client: IServerClient) { return client.servers.start(this.id); }
  stop(client: IServerClient) { return client.servers.stop(this.id); }
  restart(client: IServerClient) { return client.servers.restart(this.id); }
  prepare(client: IServerClient) { return client.servers.prepare(this.id); }


  private refreshState(client: IServerClient, gcl: GQLClient) {
    return this.graphRefreshState(gcl);
  }

  private updateStatus(status) { this.status = status ? status : this.getDefaultState(); }
}
