import {ViewModel, SteamService, Query, DbQuery, W6Context, handlerFor, UiContext} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, ModGallery } from '../mod-gallery';

export class SteamInfo extends ViewModel {
  //model: { id: string; name: string; steamId?: string}
  model;
  url: string;
  steamUrl: string;

  getDate = (t) => new Date(t * 1000)

  async activate(model: { id: string; name: string; steamId?: string }) {
    this.model = model;
    let info;
    try {
      if (model.steamId) {
        info = await new GetSteamInfo2(model.steamId).handle(this.mediator);
      } else {
        let i = await new GetSteamInfo(model.id).handle(this.mediator);
        this.model.steamId = i.id;
        info = i.info;
      }
      if (info) {
        this.model.steamInfo = info;
        ModGallery.handleImgurGalleries(info.interestingLinks);
        //this.url = `http://withsix.com/p/Arma-3/mods/${model.id.toShortId()}/${model.name.sluggify()}`;
        this.steamUrl = `https://steamcommunity.com/sharedfiles/filedetails/${this.model.steamId}`;
        if (info.images.length > 0) this.eventBus.publish(new UpdateGallery(info.images));
      }
    } catch (ex) { }
  }
}

class GetSteamInfo extends Query<{ id: string; info }> {
  constructor(public id: string) { super() }
}

@handlerFor(GetSteamInfo)
@inject(SteamService, W6Context)
class GetSteamInfoHandler extends DbQuery<GetSteamInfo, { id: string; info }> {
  constructor(private steam: SteamService, ctx) { super(ctx) }
  async handle(request: GetSteamInfo) {
    let mods = await this.steam.getW6Mods();
    if (mods.has(request.id)) {
      let m = mods.get(request.id);
      let r = await this.steam.getSteamInfo(m.steamId);
      if (r.length > 0) return { id: m.steamId, info: r[0] }
    }
    return null;
  }
}

class GetSteamInfo2 extends Query<{}> {
  constructor(public id: string) { super() }
}

@handlerFor(GetSteamInfo2)
@inject(SteamService, W6Context)
class GetSteamInfo2Handler extends DbQuery<GetSteamInfo2, {}> {
  constructor(private steam: SteamService, ctx) { super(ctx) }
  async handle(request: GetSteamInfo2) {
    let r = await this.steam.getSteamInfo(request.id);
    if (r.length > 0) return r[0]
    return null;
  }
}
