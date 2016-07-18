import {ViewModel, IpboardService, Query, DbQuery, W6Context, handlerFor, UiContext, Post} from '../../../framework';
import {inject} from 'aurelia-framework';


export class IpbInfo extends ViewModel {
  //model: { id: string; name: string; steamId?: string}
  model;
  url: string;
  forumUrl: string;
  getDate = (t) => new Date(t * 1000)

  async activate(forumUrl: string) {
    this.forumUrl = forumUrl;
    this.model = await new GetIpbInfo(forumUrl).handle(this.mediator);
  }
}

class GetIpbInfo extends Query<{id: string; info}> {
  constructor(public url: string) { super() }
}

@handlerFor(GetIpbInfo)
@inject(IpboardService, W6Context)
class GetIpbInfoHandler extends DbQuery<GetIpbInfo, Post> {
  constructor(private ipb: IpboardService, ctx) { super(ctx) }
   handle(request: GetIpbInfo) {
    return this.ipb.getPost(request.url)
  }
}
