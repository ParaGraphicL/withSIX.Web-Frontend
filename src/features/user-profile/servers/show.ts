import { gql, handlerFor, IManagedServerStatus, ManagedServer, Query, ServerState, ViewModel } from "../../../framework";
import { Observable } from "rxjs";
import { ServerHandler } from "../../rside-bar/control/actions/base";
import { GetServer } from "./server-info";

export class Show extends ViewModel {
  data: Ret;
  State = ServerState;
  online = false;

  get server() { return this.data.server; }
  get user() { return this.data.user; }

  async activate({ slug, serverSlug }) {
    this.data = await this.request(new GetUserServer(slug, serverSlug));
    this.subd(d => {
      // It's not great to have the observable passed from the app layer, but how else to do it..
      d(this.data.observable.subscribe(x => this.server.status = x));
      const iv = setInterval(async () => {
        if (this.state !== ServerState.GameIsRunning || this.online) {
          return;
        }
        const servers = await this.request(new GetServer(this.w6.activeGame.id, [this.info.address]));
        this.online = servers.items.length > 0;
      }, 15 * 1000);
      d(() => clearInterval(iv));
    });
  }

  get state() { return <ServerState>this.server.status.state; }
  get statusText() {
    if (this.state === 0) { return "Offline"; }
    return ServerState[this.state];
  }

  get info() {
    return {
      address: this.toQuery(this.server.status.address)
    }
  }

  toQuery(a: string) { return `${a.substring(0, a.length - 1)}${parseInt(a[a.length - 1]) + 1}`; }

  get isRunning() { return this.server.status.state === ServerState.GameIsRunning; }
}

interface Ret { server; user; observable: Observable<IManagedServerStatus> }

export class GetUserServer extends Query<Ret> {
  constructor(public userSlug: string, public serverSlug: string) { super(); }
}

@handlerFor(GetUserServer)
export class GetUserServerHandler extends ServerHandler<GetUserServer, Ret> {
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