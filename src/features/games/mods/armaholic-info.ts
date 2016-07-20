import {ViewModel, Seditio, Query, DbQuery, W6Context, handlerFor, UiContext, W6Urls} from '../../../framework';
import {inject} from 'aurelia-framework';

export class ArmaholicInfo extends ViewModel {
  model;
  url: string;
  getDate = (t) => new Date(t * 1000)

  async activate(url: string) {
    this.url = url;
    this.model = await new GetArmaholicInfo(url).handle(this.mediator);
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
    return this.sed.getPost(request.url.replace(/https?:\/\/(www\.)?armaholic.com\//, `${W6Urls.proxy}/api5/`), "http://www.armaholic.com/")
  }
}
