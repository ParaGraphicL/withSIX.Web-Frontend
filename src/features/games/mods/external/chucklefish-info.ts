import {ViewModel, XenForo, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class ChucklefishInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetChucklefishInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetChucklefishInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetChucklefishInfo)
@inject(XenForo, W6Context)
class GetChucklefishInfoHandler extends DbQuery<GetChucklefishInfo, { body: string }> {
  constructor(private xen: XenForo, ctx) { super(ctx) }
  handle(request: GetChucklefishInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/community.playstarbound.com\//, `${W6Urls.proxy}/api8/`), "http://community.playstarbound.com/")
  }
}
