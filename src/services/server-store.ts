import { Base } from "./base";
import { EntityExtends } from "./entity-extends";
import { GQLClient, gql, toGlobalId, idFromGlobalId, fromGraphQL, IGQLResponse, IGQLViewerResponse } from "./graphqlclient";
import { Tools } from "./tools";
import { W6 } from "./withSIX";
import { inject } from "aurelia-framework";
import { BasketItemType, IBasketItem } from "./legacy/baskets";

import { ICancellationToken } from "./reactive";

import { IManagedServer, IManagedServerSetup, IManagedServerSetupBase, IManagedServerStatus, IArmaSettings, ServerLocation, ServerSize, ServerState } from "./w6api/servers-api";
import { IServerClient } from "./w6api/server-client";
import { ModAddedToServer } from "./events/mod-added-to-server";
import { RemovedModFromServer } from "./events/removed-mod-from-server";
export { ModAddedToServer, RemovedModFromServer }

import { Game } from "./models/game";
import { ManagedServer } from "./models/managed-server";

export { Game, ManagedServer }

interface IGame { id: string; servers: IManagedServer[]; }

export const fragments = {
    interesting: gql`
  fragment InterestingSettings on ManagedServerSettings {
    adminPassword
    password
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
    contentDisplay: gql`
    fragment ContentInfo on Content {
        ... on ContentInterface {
            id
            name
            avatarUrl
            authorUrl
            authorDisplayName
            sizePacked
            latestStableVersion
        }
        ... on Mod {
            packageName
        }
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
  }`,
    fullServer: gql`
  fragment Server on ManagedServer {
    ...BasicServerInfo
    description
    setup {
        additionalSlots
        secondaries {
            size
        }
        size
        location
        settings {
            ...InterestingSettings
        }
        mods {
            edges {
                constraint
                node {
                    __typename
                    ...ContentInfo
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
    status {
      state
      address
      message
      endtime
    }
  }
  `,
};

@inject(W6)
export class ServerStore {
    games: Map<string, Game>;


    public static storageToServer(s: IManagedServer): ManagedServer {
        return new ManagedServer(this.storeToServerObj(s));
    }

    public static storeToServerObj(s: IManagedServer) {
        return {
            description: s.description,
            id: s.id,
            name: s.name,
            scope: s.scope,
            slug: s.slug,
            setup: s.setup,
            missions: s.setup.missions.toMap(x => x.id),
            mods: s.setup.mods.toMap(x => x.id),
            status: s.status,
        }
    }

    public static serverToStorage(s: ManagedServer): IManagedServer {
        return {
            description: s.description,
            id: s.id,
            //gameId: s.gameId,
            name: s.name,
            scope: s.scope,
            setup: {
                ...s.setup,
                settings: {
                    "$type": "withSIX.ServerAgent.Api.Arma3ServerSettings, withSIX.ServerAgent.Api",
                    ...s.setup.settings,
                },
                missions: Array.from(s.missions.keys()).map(id => ({ id })),
                mods: Array.from(s.mods.keys()).map(id => {
                    const {constraint, type } = (<any>s.mods.get(id)); return ({ id, constraint, type })
                }),
            },
            slug: s.slug,
            status: s.status,
            //gameId: s.gameId,
            //
        };
    }

    constructor(private w6: W6) {
        this.load();
    }

    interval = 2 * 1000; // todo; adjust interval based on state, also should restart on each action?

    get activeServer() { return this.activeGame.activeServer; }
    get unsaved() { return this.activeServer.unsaved; }

    public async createOrUpdate(gameId: string, serverId: string, req, client: IServerClient) {
        const server = this.get(gameId).servers.get(serverId);
        const s = await client.servers.createOrUpdate(req);
        Object.assign(server, ServerStore.storeToServerObj(s), { status: server.status });
        server.unsaved = undefined;
    }

    // TODO: re-monitor on WebSockets reconnect, while the subscription is active
    async monitor(client: IServerClient, gcl: GQLClient, ct: ICancellationToken) {
        // If there is an active server, and it is not unsaved, monitor it
        // When the active server changes, stop monitoring the previous, and start monitoring the next
        return Base.observeEx(this, (x) => x.activeServer)
            .switchMap((x) => x.prepareMonitor(client, gcl))
            .takeUntil(Base.observeEx(ct, (x) => x.isCancellationRequested)
                .skip(1)
                .take(1))
            .subscribe();
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
        ${fragments.contentDisplay}
        ${fragments.fullServer}
        ${fragments.interesting}
    `, variables: {
                id: toGlobalId("ManagedServer", id),
            },
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
        ${fragments.contentDisplay}
        ${fragments.fullServer}
        ${fragments.interesting}
    `});
        const server = data.viewer.firstServer.edges[0];
        // TODO: or would we change the shape of our views instead?
        // TODO: We could drop the edges indirection for non paged requirements, hmz
        const firstServer = server ? this.toManagedServer(server.node) : null;
        return {
            firstServer,
            overview: data.viewer.managedServers.edges.map((x) => fromGraphQL(x.node)),
        };
    }

    // todo; User and GameId from user and game nodes?
    toManagedServer(server: IServerDataNode) {
        const { setup, description, gameId, id, name, scope,
            slug, status, userId } = server;
        const man = {
            description,
            gameId,
            id: idFromGlobalId(id),
            location,
            name,
            scope,
            userId,
            slug,
            setup: {
                ...setup,
                missions: setup.missions.edges.map((x) => fromGraphQL(x.node)),
                mods: setup.mods.edges.map((x) => ({ constraint: x.constraint, ...fromGraphQL(x.node), type: BasketItemType[x.node.__typename] })),
            },
            status,
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

interface IServerSetupNode extends IManagedServerSetupBase {
    mods: {
        edges: Array<{
            constraint
            node: {
                name;
                id;
                constraint;
                __typename;
            };
        }>,
    };
    missions: {
        edges: Array<{
            node: {
                id;
                name;
            },
        }>,
    };
}

interface IServerDataNode {
    description
    id
    name
    slug
    scope
    gameId
    userId
    setup: IServerSetupNode;
    status: IManagedServerStatus;
}

