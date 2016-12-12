import {
  BasketItemType, DbQuery, fragments gql, handlerFor, idFromGlobalId, ManagedServer,
  Query, toGlobalId, uiCommand2, ViewModel
} from "../../../framework";
import { ServerHandler } from "../actions";

export class Index extends ViewModel {
  server: ManagedServer
  async activate(server) {
    this.server = server;
    // TODO: Collection vs Mod type
    const items = Array.from(this.server.mods.keys()).map((id) => toGlobalId(BasketItemType[this.server.mods.get(id).type], id));
    const modInfo = await this.request(new GetModInfo(server.id, items));
    modInfo.filter(x => !!x).forEach((x) => {
      const m = this.server.mods.get(idFromGlobalId(x.id));
      const { name, avatarUrl, authorDisplayName, authorUrl, sizePacked, latestStableVersion } = x;
      Object.assign(m, { name, avatarUrl, authorDisplayName, authorUrl, sizePacked, latestStableVersion });
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
      contents(ids: $ids) {
        __typename
        ...ContentInfo
      }
    }
    ${fragments.contentDisplay}
`, variables: { ids: req.contentIDs }
    });
    return data.contents;
  }
}
