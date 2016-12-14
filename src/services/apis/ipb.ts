import { W6, W6Urls } from "../withSIX";
import { inject } from "aurelia-framework";
import { HtmlFetcher } from "./parser";

@inject(HtmlFetcher)
export class IpboardService {
  constructor(private fetcher: HtmlFetcher) { }

  async getPost(url: string, baseUrl = url): Promise<Post> {
    const p = await this.fetcher.fetch(url, baseUrl);

    const firstPost = p.find((doc) => doc.find("[data-role=commentFeed]").find("article").first());
    let bodyEl = firstPost.find("[data-role=commentContent]").first();
    let body = p.toHtml(bodyEl);
    let authorInfo = firstPost.find(".ipsComment_author").first();
    let userName = authorInfo.find("[itemprop=name] > a").first().text();
    let posted = firstPost.find("time").first();
    let dateTime = posted.attr("title"); // "datetime";
    let title = p.find((doc) => doc.find("h1.ipsType_pageTitle").first()).text();
    let images = p.extractImages(bodyEl);
    let interestingLinks = p.extractInterestingLinks(bodyEl);
    return {
      body, userName, dateTime, title, images, interestingLinks,
    };
  }
}

interface Post {
  body: string; userName: string; dateTime: string; title: string; images: string[]; interestingLinks?: {};
}
