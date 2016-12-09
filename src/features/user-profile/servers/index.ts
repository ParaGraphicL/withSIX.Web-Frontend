import { gql, handlerFor, Query, ViewModel } from "../../../framework";
import { ServerHandler } from "../../rside-bar/control/actions/base";

export class Index extends ViewModel {
  data;
  get user() { return this.data; }
  get servers() { return this.data.servers; }

  async activate({ slug }) {
    const { data } = await new GetUserServers(slug).handle(this.mediator);
    this.data = {
      displayName: "Testaccount1",
      slug: "Testaccount1",
      servers: {
        edges: data.managedServersByUser,
        totalCount: data.managedServersByUser.length,
      }
    };
  }
}

export class GetUserServers extends Query<{ data }> {
  constructor(public userSlug: string) { super(); }
}

@handlerFor(GetUserServers)
export class GetUserServersHandler extends ServerHandler<GetUserServers, { data }> {
  handle(req: GetUserServers) {
    return this.gql.ac.query({
      query: gql`
      query ManagedServers($user: String!) {
          managedServersByUser(user: $user) {
          id
          name
          slug
        }
      }
    `, variables: { user: req.userSlug },
      forceFetch: true, // todo
    });
  }
}