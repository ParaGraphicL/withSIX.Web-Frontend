import { Base } from "../base";
import { EntityExtends } from "../entity-extends";
import { GQLClient, gql, toGlobalId, idFromGlobalId, fromGraphQL, IGQLResponse, IGQLViewerResponse } from "../graphqlclient";
import { Tools } from "../tools";
import { W6 } from "../withSIX";
import { inject } from "aurelia-framework";
import { IBasketItem, BasketItemType } from "../legacy/baskets";

import { ICancellationToken } from "../reactive";
import { Observable, Subject } from "rxjs";
import { CollectionScope } from "withsix-sync-api";

import { IManagedServer, IManagedServerStatus, IManagedServerSetup, IArmaSettings, ServerLocation, ServerSize, ServerState } from "../w6api/servers-api";
import { IServerClient } from "../w6api/server-client";
import { ModAddedToServer } from "../events/mod-added-to-server";
import { RemovedModFromServer } from "../events/removed-mod-from-server";

interface IContentEntry {
  id: string; constraint?: string; type?: BasketItemType;
}

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

  name: string;

  // TODO: Game specific
  setup = <IManagedServerSetup>{
    additionalSlots: 0,
    location: ServerLocation.WestEU,
    secondaries: <Array<{ size: ServerSize; }>>[],
    size: ServerSize.Normal,
    settings: <IArmaSettings>{
      battlEye: true, drawingInMap: true, enableDefaultSecurity: true, verifySignatures: true, vonQuality: 12,
    }
  }

  mods: Map<string, IContentEntry> = new Map<string, IContentEntry>();
  missions: Map<string, { id: string }> = new Map<string, { id: string }>();
  status: IManagedServerStatus;

  globalId: string;

  constructor(private data) {
    super();
    this.status = this.getDefaultState();
    Object.assign(this, data);
    this.globalId = toGlobalId("ManagedServer", this.id);
  }

  getDefaultState() { return <IManagedServerStatus>{ state: ServerState.Initializing }; }

  // TODO: Make a state/eventID, so that we can ignore older/newer updates
  static observe(gcl: GQLClient, serverId: string): Observable<IManagedServerStatus> {
    return Observable.create((obs: Subject<IManagedServerStatus>) => {
      const sub = gcl.ac.subscribe({
        query: ManagedServer.SUBSCRIPTION_QUERY,
        variables: { serverId },
      }).subscribe({
        error: (err) => obs.error(err),
        next: (data) => obs.next(data.serverStateChanged),
      });
      return () => sub.unsubscribe();
    });
  }

  prepareMonitor(client: IServerClient, gcl: GQLClient) {
    return Base.observeEx(this, (x) => x.unsaved)
      .filter((x) => !x)
      .switchMap((x) => this.monitor(client, gcl))
      .do((x) => this.updateStatus(x));
  }

  private monitor(client: IServerClient, gcl: GQLClient) {
    return ManagedServer.observe(gcl, this.globalId)
      .merge(gcl.wsReconnected.flatMap((x) => this.refreshState(client, gcl)));
    // we already get the state in the query upon save, and upon start..
    //.merge(Observable.fromPromise(this.refreshState(client, gcl)));
  }

  // Optimize this server-side, so that GQL doesnt actually pull in the whole server? :-P
  async graphRefreshState(gcl: GQLClient) {
    const { data }: IGQLResponse<{ managedServerStatus: IManagedServerStatus }>
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
      return { state, message, address, endtime };
    }
  }

  toggleMod(mod: IBasketItem) {
    if (this.mods.has(mod.id)) {
      this.mods.delete(mod.id);
      ManagedServer.eventPublisher(new RemovedModFromServer(mod, this.id));
    } else {
      const { id, constraint } = mod;
      this.mods.set(mod.id, {
        id, constraint, type: mod.itemType,
      });
      ManagedServer.eventPublisher(new ModAddedToServer(mod, this.id));
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

  private updateStatus(status: IManagedServerStatus) {
    this.status = status ? status : this.getDefaultState();
  }
}
