import {ViewModel, Nmsm, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class NmsmInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetNmsmInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetNmsmInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetNmsmInfo)
@inject(Nmsm, W6Context)
class GetNmsmInfoHandler extends DbQuery<GetNmsmInfo, { body: string }> {
  constructor(private xen: Nmsm, ctx) { super(ctx) }
  handle(request: GetNmsmInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/nomansskymods.com\//, W6Urls.getProxyUrl('nmsm')), "https://nomansskymods.com/")
  }
}
