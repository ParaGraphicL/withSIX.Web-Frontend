import { DbQuery, gql, handlerFor, idFromGlobalId, ManagedServer, Query, toGlobalId, uiCommand2, ViewModel } from "../../../framework";
import { ServerHandler } from "../actions";

export class Index extends ViewModel {
  server: ManagedServer
  async activate(server) {
    this.server = server;
    // TODO: Collection vs Mod type
    const modInfo = await this.request(new GetModInfo(server.id, Array.from(this.server.mods.keys()).map((id) => toGlobalId("Mod", id))));
    modInfo.forEach((x) => {
      const m = this.server.mods.get(idFromGlobalId(x.id));
      const { name, avatarUrl, authorDisplayName, authorUrl, sizePacked } = x;
      Object.assign(m, { name, avatarUrl, authorDisplayName, authorUrl });
    });
  }
  get mods() { return this.server.mods; }
  remove(m) { this.mods.delete(m.id); }
}

class GetModInfo extends Query<Array<any>> { constructor(public id: string, public contentIDs: string[]) { super(); } }

@handlerFor(GetModInfo)
class GetModInfoHandler extends ServerHandler<GetModInfo, Array<any>> {
  async handle(req: GetModInfo) {
    const { data } = await this.gql.ac.query({
      query: gql`
    query GetContent($ids: [ID]!) {
      content(ids: $ids) {
        __typename
        ... on ContentInterface {
          id
          name
          avatarUrl
          authorUrl
          sizePacked
        }
        ... on Mod {
          packageName
        }
      }
    }
`, variables: { ids: req.contentIDs }
    });
    return data.content;
  }
}
