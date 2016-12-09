import { Tools } from "./tools";
import { ReactiveObject } from "rxui";
import { Subject, Observable } from "rxjs";

import ApolloClient, { createBatchingNetworkInterface } from "apollo-client";
import { DeprecatedWatchQueryOptions } from "apollo-client/core/watchQueryOptions";
import gql from "graphql-tag";
export { gql }
import { Client } from 'subscriptions-transport-ws';
import { print } from 'graphql-tag/printer';

export interface IGQLResponse<T> {
  data: T;
}

export interface IGQLViewerResponse<T> extends IGQLResponse<{ viewer: T }> { }



const addGraphQLSubscriptions = (networkInterface, wsClient) => Object.assign(networkInterface, {
  subscribe: (request, handler) => wsClient.subscribe({
    query: print(request.query),
    variables: request.variables,
  }, handler),
  unsubscribe: (id) => wsClient.unsubscribe(id),
});

// TODO: Include graph also on the frontend domain, so that we can use it during development?
// TODO: What about a graph for the Client (and what about hybrid; e.g get me these Mods, and if client connected, also the installed status)
// TODO: Investigate batching http://dev.apollodata.com/core/network.html#query-batching

export const toGlobalId = (type: string, id: string) => btoa([type, id].join(":"));
export const fromGlobalId = (gid: string) => {
  const dec = atob(gid);
  const split = dec.split(":");
  return {
    id: split[1],
    type: split[0],
  }
}

export const idFromGlobalId = (gid: string) => fromGlobalId(gid).id;

export const fromGraphQL = node => ({ ...node, id: idFromGlobalId(node.id) });

export class GQLClient {
  ac: ApolloClient;
  wsReconnected: Observable<void>;
  constructor() {

    const ep = Tools.env <= Tools.Environment.Staging ? "https://graph.withsix.com" : "http://localhost:5000";
    const wsClient = new Client(ep.replace("https:", "wss:").replace("http:", "ws:") + "?token=" + localStorage.getItem('aurelia_token'));
    // todo// update URL when authtoken updates... 

    const reconnected = new Subject<void>();
    this.wsReconnected = reconnected.asObservable();

    const f = () => {
      class Monitor extends ReactiveObject {
        constructor(private client: Client) {
          super();
          this.whenAnyValue((x) => x.client.client.reconnecting)
            .filter((x) => !x)
            .skip(1)
            .subscribe((x) => reconnected.next());
        }
      }
      return new Monitor(wsClient);
    }
    const monitor = f();

    // It would be just so much better if calling subscribe (and resubscribe) would give an initial value..
    //const wsInternalClient: W3CWebSocket = wsClient.client; // only accessible after .connect() etc

    /*
            switch (this.client.readyState) {
                case this.client.OPEN:
                    this.client.send(JSON.stringify(message));
                    break;
                case this.client.CONNECTING:
                    this.unsentMessagesQueue.push(message);
                    break;
                case this.client.CLOSING:
                case this.client.CLOSED:
                default:
                    if (!this.reconnecting) {
                        throw new Error('Client is not connected to a websocket.');
                    }
            }
    */

    const networkInterface = createBatchingNetworkInterface({
      batchInterval: 15,
      uri: `${ep}/graphql`,
      opts: {
        //credentials: 'same-origin',
      },
    });
    const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
      networkInterface,
      wsClient,
    );
    networkInterface.use([{
      applyMiddleware(req, next) {
        if (!req.options.headers) {
          req.options.headers = {};  // Create the header object if needed.
        }
        const token = localStorage.getItem("aurelia_token");
        req.options.headers["authorization"] = token ? `Bearer ${token}` : null;
        next();
      }
    }]);

    this.ac = new ApolloClient({ networkInterface: networkInterfaceWithSubscriptions });
  }
}
