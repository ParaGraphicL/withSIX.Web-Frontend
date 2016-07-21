import {W6, W6Urls} from '../withSIX';
import { inject } from 'aurelia-framework';
import { HtmlFetcher } from './parser';

@inject(HtmlFetcher)
export class IpboardService {
  constructor(private fetcher: HtmlFetcher) { }

  async getPost(url: string, baseUrl = url): Promise<Post> {
    const p = await this.fetcher.fetch(url, baseUrl);
    const firstPost = p.find(doc => doc.find("div#ips_Posts").first().find("div").first());
    var bodyEl = firstPost.find("div.post.entry-content").first();
    var body = p.toHtml(bodyEl);
    var authorInfo = firstPost.find(".author_info").first();
    var userName = authorInfo.find(".post-member-title").first().find("span").first().text();
    var posted = firstPost.find(".published").first();
    var dateTime = posted.attr('title');
    var title = p.find(doc => doc.find("h1.ipsType_pagetitle").first()).text();
    var images = p.extractImages(bodyEl);
    return {
      body, userName, dateTime, title, images
    }
  }
}

interface Post {
  body: string; userName: string; dateTime: string; title: string;
}
