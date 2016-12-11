import { Base } from "./base";
import { EntityExtends } from "./entity-extends";
import { GQLClient, gql, toGlobalId, idFromGlobalId, fromGraphQL, IGQLResponse, IGQLViewerResponse } from "./graphqlclient";
import { Tools } from "./tools";
import { W6 } from "./withSIX";
import { inject } from "aurelia-framework";
import { IBasketItem } from "./legacy/baskets";

import { ICancellationToken } from "./reactive";

import { IManagedServer, IArmaSettings, IServerSession, ServerLocation, ServerSize, ServerState } from "./w6api/servers-api";
import { IServerClient } from "./w6api/server-client";
import { ModAddedToServer } from "./events/mod-added-to-server";
import { RemovedModFromServer } from "./events/removed-mod-from-server";
export { ModAddedToServer, RemovedModFromServer }

import { Game } from "./models/game";
import { ManagedServer } from "./models/managed-server";

export { Game, ManagedServer }

interface IGame { id: string; servers: IManagedServer[]; }

const fragments = {
    interesting: gql`
  fragment InterestingSettings on ManagedServerSettings {
    battlEye
    verifySignatures
    persistent
    disableVon
    drawingInMap
    forceRotorLibSimulation
    allowedFilePatching
    enableDefaultSecurity
    vonQuality
    motd
  }
`,
    basic: gql`
  fragment BasicServerInfo on ManagedServer {
    slug
    scope
    id
    name
    gameId
    userId
    size
    location
  }`,
    fullServer: gql`
  fragment Server on ManagedServer {
    ...BasicServerInfo
    description
    adminPassword
    password
    additionalSlots
    settings {
      ...InterestingSettings
    }
    status {
      state
      address
      message
      endtime
    }
    secondaries {
      size
    }
    mods {
      edges {
        constraint
        node {
            __typename
            ... on ContentInterface {
                id
                name
                avatarUrl
                authorUrl
                authorDisplayName
                sizePacked
            }
            ... on Mod {
                latestStableVersion
            }
        }
      }
    }
    missions {
      edges {
        node {
          id
          name
        }
      }
    }
  }
  `,
};

@inject(W6)
export class ServerStore {
    games: Map<string, Game>;


    public static storageToServer(s: IManagedServer): ManagedServer {
        return new ManagedServer({
            additionaSlots: s.additionalSlots,
            adminPassword: s.adminPassword,
            description: s.description,
            id: s.id,
            location: s.location,
            missions: s.missions.toMap(x => x.id),
            mods: s.mods.toMap(x => x.id),
            name: s.name,
            password: s.password,
            scope: s.scope,
            secondaries: s.secondaries,
            settings: s.settings,
            size: s.size,
            slug: s.slug,
            status: s.status,
        });
    }

    public static serverToStorage(s: ManagedServer): IManagedServer {
        return {
            additionalSlots: s.additionalSlots,
            adminPassword: s.adminPassword,
            description: s.description,
            id: s.id,
            location: s.location,
            missions: Array.from(s.missions.keys()).map(id => ({ id })),
            mods: Array.from(s.mods.keys()).map(id => ({ id, constraint: (<any>s.mods.get(id)).constraint })),
            name: s.name,
            password: s.password,
            scope: s.scope,
            secondaries: s.secondaries,
            settings: s.settings,
            size: s.size,
            slug: s.slug,
            status: s.status,
        };
    }

    constructor(private w6: W6) {
        this.load();
    }

    interval = 2 * 1000; // todo; adjust interval based on state, also should restart on each action?

    get activeServer() { return this.activeGame.activeServer; }

    // TODO: re-monitor on WebSockets reconnect, while the subscription is active
    async monitor(client: IServerClient, gcl: GQLClient, ct: ICancellationToken) {
        let sub;
        const sub2 =
            Base.observeEx(this.activeServer, x => x.unsaved)
                .combineLatest(Base.observeEx(this.activeServer, x => x.unsaved), (x, y) => null)
                .switchMap(x => Base.observeEx(this, x => x.activeServer)
                    .filter(x => !x.unsaved))
                .flatMap(x => x.monitor(client, gcl))
                .subscribe(s => {
                    if (sub) sub.unsubscribe();
                    sub = s;
                })
        const sub3 = Base.observeEx(ct, x => x.isCancellationRequested)
            .skip(1)
            .subscribe(x => {
                if (sub) sub.unsubscribe();
                sub2.unsubscribe();
                sub3.unsubscribe();
            })
    }

    get activeGame() {
        const id = this.w6.activeGame.id;
        if (id == null) { return null; }

        if (!this.games.has(id)) {
            this.games.set(id, new Game({ id, servers: new Map<string, ManagedServer>() }));
        }
        return this.games.get(this.w6.activeGame.id);
    }

    load() {
        const storage = window.localStorage.getItem("w6.servers");
        const m: { games: IGame[] } = storage ? JSON.parse(storage) : { games: [] };
        this.games = storage ? m.games.map(x => this.storageToGame(x)).toMap(x => x.id) : new Map<string, Game>();
    }

    get(id: string) { return this.games.get(id); }

    async select(id: string, gcl: GQLClient) {
        const game = this.activeGame;
        const { data }: IGQLResponse<{ managedServer: IServerDataNode }> = await gcl.ac.query({
            query: gql`
        query GetServer($id: ID!) {
          managedServer(id: $id) {
            ...Server
          }
        }
        ${fragments.basic}
        ${fragments.fullServer}
        ${fragments.interesting}
    `, variables: {
                id: toGlobalId("ManagedServer", id),
            }
        });
        const { managedServer } = data;
        const s = ServerStore.storageToServer(this.toManagedServer(managedServer));
        game.servers.set(managedServer.id, s);
        game.activeServer = s;
    }

    async getServers(client: IServerClient, gcl: GQLClient) {
        const game = this.activeGame;

        const { firstServer, overview } = await this.queryServers(gcl);
        if (overview.length > 0) { game.overview = overview; }
        if (firstServer) {
            const s = ServerStore.storageToServer(firstServer);
            game.servers.set(s.id, s);
            game.activeServer = s;
        }
    }

    async queryServers(gcl: GQLClient): Promise<{ firstServer: IManagedServer, overview: { id: string, name: string }[] }> {
        const { data }: IGQLViewerResponse<{ firstServer: IServerData, managedServers: { edges: { node: { id, name } }[] } }> = await gcl.ac.query({
            query: gql`
        query GetServers {
          viewer {
            managedServers {
              edges {
                node {
                  id
                  name
                }
              }
                totalCount
            }
            firstServer: managedServers(first: 1) {
              edges {
                node {
                  ...Server
                }
              }
              totalCount
            }
          }
        }
        ${fragments.basic}
        ${fragments.fullServer}
        ${fragments.interesting}
    `});
        const server = data.viewer.firstServer.edges[0];
        // TODO: or would we change the shape of our views instead?
        // TODO: We could drop the edges indirection for non paged requirements, hmz
        const firstServer = server ? this.toManagedServer(server.node) : null;
        return {
            firstServer,
            overview: data.viewer.managedServers.edges.map(x => fromGraphQL(x.node)),
        };
    }

    // todo; User and GameId from user and game nodes?
    toManagedServer(server: IServerDataNode) {
        const { additionalSlots, adminPassword, description, gameId, id, location, name, password, scope, secondaries,
            settings, size, slug, status, userId, mods, missions } = server;
        const man = {
            additionalSlots, adminPassword, description, gameId, id: idFromGlobalId(id), location,
            name, password, scope, secondaries, settings, size, status, userId,
            slug,
            missions: missions.edges.map(x => fromGraphQL(x.node)),
            mods: mods.edges.map(x => ({ constraint: x.constraint, ...fromGraphQL(x.node) })),
        };
        return man;
    }

    save() {
        const games = Array.from(this.games.values()).map(x => this.gameToStorage(x));
        window.localStorage.setItem("w6.servers", JSON.stringify({ games }));
    }

    private storageToGame(game: IGame) {
        return new Game({ id: game.id, servers: game.servers.map(x => ServerStore.storageToServer(x)).toMap(x => x.id) });
    }

    private gameToStorage(game: Game) {
        return {
            id: game.id,
            servers: Array.from(game.servers.values()).map(x => ServerStore.serverToStorage(x)),
        }
    }
}


interface IServerData {
    edges: {
        node: IServerDataNode
    }[]
}

interface IServerDataNode {
    description
    id
    name
    slug
    scope
    gameId
    userId
    size: ServerSize
    location: ServerLocation
    adminPassword
    password
    additionalSlots
    settings: {
        battlEye
        verifySignatures
        persistent
        disableVon
        drawingInMap
        forceRotorLibSimulation
        allowedFilePatching
        enableDefaultSecurity
        vonQuality
        motd
    }
    status: {
        address
        state
        message
        endtime
    }
    secondaries: {
        size: ServerSize
    }[]
    mods: {
        edges: {
            constraint
            node: {
                name
                id
            }
        }[]
    }
    missions: {
        edges: {
            node: {
                id
                name
            }
        }[]
    }
}

