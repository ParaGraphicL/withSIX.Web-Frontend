import {inject} from 'aurelia-framework';
import {breeze, IBreezePost, Mediator, DbQuery, Query, handlerFor} from '../../framework';

class GetBlogs extends Query<IBreezePost[]> {
  constructor(public team = false) { super(); }
}

@handlerFor(GetBlogs)
class GetBlogsHandler extends DbQuery<GetBlogs, IBreezePost[]> {
  handle(request: GetBlogs) {
    return this.context.executeQuery<IBreezePost>(breeze.EntityQuery.from("Posts")
      .where("category", breeze.FilterQueryOp.Equals, request.team ? "Team" : "General")
      .orderByDesc("created")
      .top(12)
      .select(["slug", "title", "summary", "author", "commentsCount", "created", "isPublished", "updated"]))
      .then(r => r.results)
  }
}

@inject(Mediator)
export class Blog {
  constructor(private mediator: Mediator) { }
  blogs = [];

  activate(params, routeConfig) {
    return new GetBlogs().handle(this.mediator)
      .then(x => this.blogs = x);
  }
}
