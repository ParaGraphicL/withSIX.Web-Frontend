import {W6, W6Urls} from "../withSIX";
import { inject } from "aurelia-framework";
import { HtmlFetcher } from "./parser";

@inject(HtmlFetcher)
export class Gametracker {
  constructor(private fetcher: HtmlFetcher) { }

  async getPost(url: string, baseUrl = url): Promise<Post> {
    const p = await this.fetcher.fetch(url, baseUrl);
    let bodyEl = p.find(doc => doc.find("body").first()).first();
    let body = p.toHtml(bodyEl);
    let images = p.extractImages(bodyEl);
    let interestingLinks = p.extractInterestingLinks(bodyEl);
    return {
      body, userName: null, dateTime: null, title: null, images, interestingLinks,
    };
  }
}

interface Post {
  body: string; userName: string; dateTime: string; title: string; images: string[]; interestingLinks?: {};
}
