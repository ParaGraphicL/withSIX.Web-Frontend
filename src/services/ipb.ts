
import {W6, W6Urls} from './withSIX';
import {sanitizeHtml} from '../helpers/utils/string';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';

export interface Post {
  body: string; userName: string; dateTime: string; title: string;
}

@inject(FetchClient)
export class IpboardService {
  constructor(private http: FetchClient) {}

  async getPost(url: string): Promise<Post> {
    let x = await this.http.fetch(url.replace(/https?:\/\/forums.bistudio.com\//, `${W6Urls.proxy}/api3/`));
    var doc = $(await x.text());
    var firstPost = doc.find("div#ips_Posts").first().find("div").first();
    var bodyEl = firstPost.find("div.post.entry-content").first();
    var domain = "https://forums.bistudio.com";
    $.each(bodyEl.find('a'), function(i, v) {
      var href = $(v).attr('href');
      if (href && href.match(/^\/[^\/]/)) $(v).attr('href', domain + href);
      $(v).attr('target', '_blank');
    });
    $.each(bodyEl.find('img'), function(i, v) {
      var href = $(v).attr('src');
      if (href.match(/^\/[^\/]/)) $(v).attr('src', domain + href);
    });
    var body = sanitizeHtml(bodyEl.html());
    var authorInfo = firstPost.find(".author_info").first();
    var userName = authorInfo.find(".post-member-title").first().find("span").first().text();
    var posted = firstPost.find(".published").first();
    var dateTime = posted.attr('title');
    var title = doc.find("h1.ipsType_pagetitle").first().text();

    return {
      body, userName, dateTime, title
    }
  }
}
