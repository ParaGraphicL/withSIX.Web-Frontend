import {ViewModel, Mdb, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class MdbInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetMdbInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetMdbInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetMdbInfo)
@inject(Mdb, W6Context)
class GetMdbInfoHandler extends DbQuery<GetMdbInfo, { body: string }> {
  constructor(private xen: Mdb, ctx) { super(ctx) }
  handle(request: GetMdbInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/(www\.)?moddb.com\//, `${W6Urls.proxy}/api11/`), "http://www.moddb.com/")
  }
}
