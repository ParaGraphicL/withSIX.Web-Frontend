import {ViewModel, SteamService, Query, DbQuery, W6Context, handlerFor, UiContext} from '../../../framework';
import {inject} from 'aurelia-framework';


@inject(SteamService, UiContext)
export class SteamInfo extends ViewModel {
  constructor(private steam: SteamService, ui) { super(ui) }
  //model: { id: string; name: string; steamId?: string}
  model;
  url: string;
  steamUrl: string;
  parseText = (t) => t ? this.steam.parser.parseString(t) : t // .replace(/(\r\n)|\n/g, "<br />")

  getDate = (t) => new Date(t * 1000)

  async activate(model: { id: string; name: string}) {
    this.model = model;
    let info = await new GetSteamInfo(model.id).handle(this.mediator);
    if (info) {
      this.model.steamInfo = info.info;
      this.model.steamId = info.id;
      //this.url = `http://withsix.com/p/Arma-3/mods/${model.id.toShortId()}/${model.name.sluggify()}`;
      this.steamUrl = `https://steamcommunity.com/sharedfiles/filedetails/${this.model.steamId}`;
    }
  }
}

class GetSteamInfo extends Query<{id: string; info}> {
  constructor(public id: string) { super() }
}

@handlerFor(GetSteamInfo)
@inject(SteamService, W6Context)
class GetSteamInfoHandler extends DbQuery<GetSteamInfo, {id: string; info}> {
  constructor(private steam: SteamService, ctx) { super(ctx) }
  async handle(request: GetSteamInfo) {
    let mods = await this.steam.getW6Mods();
    if (mods.has(request.id)) {
      let m = mods.get(request.id);
      let r = await this.steam.getSteamInfo(m.steamId);
      if (r.length > 0) return {id: m.steamId, info: r[0] }
    }
    return null;
  }
}
