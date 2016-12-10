import { gql, handlerFor, ManagedServer, Query, ServerState, ViewModel } from "../../../framework";
import { ServerHandler } from "../../rside-bar/control/actions/base";

export class Show extends ViewModel {
  data;
  State = ServerState;

  get server() { return this.data.server; }
  get user() { return this.data.user; }

  async activate({ slug, serverSlug }) {
    this.data = await this.request(new GetUserServer(slug, serverSlug));
    this.subd(d => d(this.data.observable.subscribe(x => this.server.status = x))); // this is not great, but how else to do it..
  }

  get isRunning() { return this.server.status.state === ServerState.GameIsRunning; }
}


export class GetUserServer extends Query<{ server; user }> {
  constructor(public userSlug: string, public serverSlug: string) { super(); }
}

@handlerFor(GetUserServer)
export class GetUserServerHandler extends ServerHandler<GetUserServer, { server; user; }> {
  async handle(req: GetUserServer) {
    const { data } = await this.gql.ac.query({
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

    // TODO: We should be able to do this externally
    const s = ManagedServer.observe(this.gql, data.managedServerByUser.id);

    return {
      server: data.managedServerByUser,
      user: data.managedServerByUser.user,
      observable: s
    }
  }
}