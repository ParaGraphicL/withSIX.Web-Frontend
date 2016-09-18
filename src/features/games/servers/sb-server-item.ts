import { IIPEndpoint, GameHelper } from "../../../framework";


export class SbServerItem {
  model;
  address: string;
  slug: string;

  activate(model: { address: IIPEndpoint, gameId: string }) {
    const w6Cheat = <any> window.w6Cheat;
    const servers = w6Cheat.servers || (w6Cheat.servers = {});
    const gameServers: Map<string, any> = servers[model.gameId];
    this.model = gameServers.get(this.address = GameHelper.toAddresss(model.address));
    this.slug = `${this.address.replace(/\./g, "-")}/${this.name ? this.name.sluggifyEntityName() : "no-name"}`;
  }

  get name() { return this.model.info.name; };
  get numPlayers() { return this.model.info.numPlayers; };
  get maxPlayers() { return this.model.info.maxPlayers; };
  get mission() { return this.model.info.mission; };
}
