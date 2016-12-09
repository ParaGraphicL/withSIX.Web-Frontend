import { gql, handlerFor, Query, ViewModel } from "../../../framework";
import { ServerHandler } from "../../rside-bar/control/actions/base";

export class Show extends ViewModel {
  data;

  get server() { return this.data.server; }
  get user() { return this.data.user; }

  async activate({ slug, serverSlug }) {
    const { data } = await new GetUserServer(slug, serverSlug).handle(this.mediator);
    this.data = {
      server: data.managedServerByUser,
      user: {
        displayName: "Testaccount1",
        slug: "Testaccount1",
      },
    }
  }
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
        }
      }
    `, variables: { user: req.userSlug, name: req.serverSlug, },
      forceFetch: true, // todo
    });
  }
}