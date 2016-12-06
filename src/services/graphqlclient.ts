import { Tools } from "./tools";

import ApolloClient, { createNetworkInterface, createFragment } from "apollo-client";
import { DeprecatedWatchQueryOptions } from "apollo-client/core/watchQueryOptions";
import gql from "graphql-tag";
export { gql, createFragment }

// TODO: Include graph also on the frontend domain, so that we can use it during development?
// TODO: What about a graph for the Client (and what about hybrid; e.g get me these Mods, and if client connected, also the installed status)
// TODO: Investigate batching http://dev.apollodata.com/core/network.html#query-batching

const networkInterface = createNetworkInterface({
  uri: Tools.env <= Tools.Environment.Staging ? "https://graph.withsix.com" : "http://localhost:5000/graphql",
  opts: {
    //credentials: 'same-origin',
  },
});
networkInterface.use([{
  applyMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};  // Create the header object if needed.
    }
    req.options.headers["authorization"] = localStorage.getItem("aurelia_token") ? `Bearer ${localStorage.getItem("aurelia_token")}` : null;
    next();
  }
}]);
const ac = new ApolloClient({ networkInterface });

class W6GraphClient {
  constructor(private ac: ApolloClient) { }
  query<T>(opts: DeprecatedWatchQueryOptions) { return <Promise<{ data: T; loading: boolean; networkStatus; }>>this.ac.query(opts); }
}

export const gcl = new W6GraphClient(ac);