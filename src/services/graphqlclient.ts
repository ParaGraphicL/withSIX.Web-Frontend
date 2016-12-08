import { Tools } from "./tools";

import ApolloClient, { createBatchingNetworkInterface, createFragment } from "apollo-client";
import { DeprecatedWatchQueryOptions } from "apollo-client/core/watchQueryOptions";
import gql from "graphql-tag";
export { gql, createFragment }
import { Client } from 'subscriptions-transport-ws';
import { print } from 'graphql-tag/printer';

const ep = Tools.env <= Tools.Environment.Staging ? "https://graph.withsix.com" : "http://localhost:5000";
const wsClient = new Client(ep.replace("https:", "wss:").replace("http:", "ws:")); // todo


const addGraphQLSubscriptions = (networkInterface, wsClient) => Object.assign(networkInterface, {
  subscribe: (request, handler) => wsClient.subscribe({
    query: print(request.query),
    variables: request.variables,
  }, handler),
  unsubscribe: (id) => {
    wsClient.unsubscribe(id);
  },
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

const networkInterface = createBatchingNetworkInterface({
  batchInterval: 15,
  uri: ep,
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

const ac = new ApolloClient({ networkInterface: networkInterfaceWithSubscriptions });

if (Tools.env >= Tools.Environment.Staging) {
  const SUBSCRIPTION_QUERY = gql`
  subscription onCommentAdded($repoFullName: String!){
    commentAdded(repoFullName: $repoFullName)
  }
`;

  ac.subscribe({
    query: SUBSCRIPTION_QUERY,
    variables: { repoFullName: 'test' },
  }).subscribe({
    next: (data) => {
      console.log("$$$$$ DATA", data);
      // ... call updateQuery to integrate the new comment
      // into the existing list of comments
    },
    error: (err) => { console.error('$$$$$ err', err); },
  });
}

class W6GraphClient {
  constructor(private ac: ApolloClient) { }
  query<T>(opts: DeprecatedWatchQueryOptions) { return <Promise<{ data: T; loading: boolean; networkStatus; }>>this.ac.query(opts); }
}

export const gcl = new W6GraphClient(ac);