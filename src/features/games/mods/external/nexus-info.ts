import {ViewModel, Nexus, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class NexusInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetNexusInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetNexusInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetNexusInfo)
@inject(Nexus, W6Context)
class GetNexusInfoHandler extends DbQuery<GetNexusInfo, { body: string }> {
  constructor(private xen: Nexus, ctx) { super(ctx) }
  handle(request: GetNexusInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/(www\.)?nexusmods.com\//, W6Urls.getProxyUrl('nexus')), "http://www.nexusmods.com/")
  }
}
