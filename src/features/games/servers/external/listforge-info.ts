import {ViewModel, Listforge, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ForumUrl} from '../../../../framework';
import {inject} from 'aurelia-framework';

//import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class ListforgeInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetListforgeInfo(url).handle(this.mediator);
      //if (this.model.images.length > 0) this.eventBus.publish(new UpdateGallery(this.model.images));
      //this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetListforgeInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetListforgeInfo)
@inject(Listforge, W6Context)
class GetListforgeInfoHandler extends DbQuery<GetListforgeInfo, { body: string }> {
  constructor(private xen: Listforge, ctx) { super(ctx) }
  handle(request: GetListforgeInfo) {
    return this.xen.getPost(request.url.replace(/https?:\/\/starbound-servers.net\//, W6Urls.getProxyUrl('starbound-servers')), "https://starbound-servers.net/")
  }
}
