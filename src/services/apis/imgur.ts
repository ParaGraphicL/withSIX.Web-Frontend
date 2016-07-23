import { HtmlFetcher } from './parser';
import { inject } from 'aurelia-framework';
import { W6Urls } from '../withSIX';

@inject(HtmlFetcher)
export class Imgur {
  apiUrl = `${W6Urls.proxy}/api7/`;
  constructor(private fetcher: HtmlFetcher) { }

  async getImages(url: string) {
    let r = await this.fetcher.fetch(url.replace(/https?:\/\/imgur.com\//, this.apiUrl));
    return r.extractImages(r.find(d => d.find('.post-images')));
  }
}
