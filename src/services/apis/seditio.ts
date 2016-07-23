import {W6, W6Urls} from '../withSIX';
import { inject } from 'aurelia-framework';
import { HtmlFetcher } from './parser';

@inject(HtmlFetcher)
export class Seditio {
  constructor(private fetcher: HtmlFetcher) { }

  async getPost(url: string, baseUrl = url): Promise<{ body: string }> {
    const p = await this.fetcher.fetch(url, baseUrl);
    const firstPost = p.find(doc => doc.find("table").first());
    var bodyEl = firstPost.find("div.pagedlbg").first();
    var body = p.toHtml(bodyEl);
    // var authorInfo = firstPost.find(".author_info").first();
    // var userName = authorInfo.find(".post-member-title").first().find("span").first().text();
    // var posted = firstPost.find(".published").first();
    // var dateTime = posted.attr('title');
    // var title = p.find(doc => doc.find("h1.ipsType_pagetitle").first()).text();
    var images = p.extractImages(bodyEl);
    var interestingLinks = p.extractInterestingLinks(bodyEl);
    return {
      body, images, interestingLinks
    }
  }
}

export interface Post {
  body: string; userName: string; dateTime: string; title: string;
}
