import {ViewModel, IpboardService, Query, DbQuery, W6Context, handlerFor, UiContext, Post, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class BifInfo extends ViewModel {
  //model: { id: string; name: string; steamId?: string}
  model;
  url: string;
  forumUrl: string;
  getDate = (t) => new Date(t * 1000)

  async activate(forumUrl: string) {
    this.forumUrl = forumUrl;
    try {
      this.model = await new GetIpbInfo(forumUrl).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(forumUrl)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetIpbInfo extends Query<{ id: string; info }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetIpbInfo)
@inject(IpboardService, W6Context)
class GetIpbInfoHandler extends DbQuery<GetIpbInfo, Post> {
  constructor(private ipb: IpboardService, ctx) { super(ctx) }
  handle(request: GetIpbInfo) {
    return this.ipb.getPost(request.url.replace(/https?:\/\/forums.bistudio.com\//, `${W6Urls.proxy}/api3/`), "https://forums.bistudio.com/")
  }
}
