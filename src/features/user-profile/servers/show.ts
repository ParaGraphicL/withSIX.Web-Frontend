import { gql, handlerFor, Query, ServerState, ViewModel } from "../../../framework";
import { ServerHandler } from "../../rside-bar/control/actions/base";

export class Show extends ViewModel {
  data;
  State = ServerState;

  get server() { return this.data.server; }
  get user() { return this.data.user; }

  async activate({ slug, serverSlug }) {
    const { data } = await new GetUserServer(slug, serverSlug).handle(this.mediator);
    this.data = {
      server: data.managedServerByUser,
      user: data.managedServerByUser.user,
    }
  }

  get isRunning() { return this.server.status.state === ServerState.GameIsRunning; }
}


export class GetUserServer extends Query<{ data }> {
  constructor(public userSlug: string, public serverSlug: string) { super(); }
}

@handlerFor(GetUserServer)
export class GetUserServerHandler extends ServerHandler<GetUserServer, { data }> {
  handle(req: GetUserServer) {
    return this.gql.ac.query({
      query: gql`
      query ManagedServer($user: String!, $name: String!) {
          managedServerByUser(user: $user, name: $name) {
          id
          name
          slug
          user {
            displayName
            slug
          }
          status {
            state
            address
          }
        }
      }
    `, variables: { user: req.userSlug, name: req.serverSlug, },
      forceFetch: true, // todo
    });
  }
}