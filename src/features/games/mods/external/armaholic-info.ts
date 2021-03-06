import { ViewModel, Seditio, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls, ArmaholicUrl } from '../../../../framework';
import { inject } from 'aurelia-framework';

import { UpdateGallery, UpdateInterestingLinks } from '../mod-gallery';

export class ArmaholicInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;

    try {
      this.model = await new GetArmaholicInfo(url).handle(this.mediator);
      if (this.model.images.length > 0) { this.eventBus.publish(new UpdateGallery(this.model.images)); }
      this.eventBus.publish(new UpdateInterestingLinks([new ArmaholicUrl(url)].concat(this.model.interestingLinks)));
    } catch (ex) { }
  }
}

class GetArmaholicInfo extends Query<{ body: string }> {
  constructor(public url: string) { super() }
}

@handlerFor(GetArmaholicInfo)
@inject(Seditio, W6Context)
class GetArmaholicInfoHandler extends DbQuery<GetArmaholicInfo, { body: string }> {
  constructor(private sed: Seditio, ctx) { super(ctx) }
  handle(request: GetArmaholicInfo) {
    return this.sed.getPost(request.url.replace(/https?:\/\/(www\.)?armaholic.com\//, W6Urls.getProxyUrl('armaholic')), "http://www.armaholic.com/")
  }
}
