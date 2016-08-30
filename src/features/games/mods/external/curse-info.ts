import {ViewModel, Curse, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class CurseInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetCurseInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetCurseInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetCurseInfo)
@inject(Curse, W6Context)
class GetCurseInfoHandler extends DbQuery<GetCurseInfo, { body: string }> {
  constructor(private xen: Curse, ctx) { super(ctx) }
  handle(request: GetCurseInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/mods.curse.com\//, `${W6Urls.proxy}/api12/`), "http://mods.curse.com/")
  }
}
