import {sanitizeHtml, parseBBCode} from '../../helpers/utils/string';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';

export { parseBBCode }

export class HtmlParser {
  parseElement(htmlElement: JQuery, domain: string) {
    $.each(htmlElement.find('a'), (i, v) => {
      let el = $(v);
      this.handleAttr(el, 'href', domain);
      el.attr('target', '_blank');
    });
    $.each(htmlElement.find('img'), (i, v) => {
      let el = $(v);
      this.handleAttr(el, 'src', domain);
    });
    return htmlElement;
  }

  handleAttr = (el: JQuery, attr: string, baseUrl: string) => {
    let src = el.attr(attr);
    let updatedUrl = src && this.handleRelativeUrl(src, baseUrl);
    if (updatedUrl) el.attr(attr, updatedUrl);
  }

  handleRelativeUrl = (url: string, baseUrl: string) =>
    !url.match(/^(\/\/)|(https?):\/\//) //url.match(/^((\.)?\/[^\/]/)
      ? this.combineUrls(baseUrl, url)
      : null;

  combineUrls = (baseUrl: string, url: string) => {
    if (url.startsWith(".")) url = url.substring(1);
    if (url.startsWith("/")) url = url.substring(1);
    return baseUrl + url;
  }

  quote = (html: string) => this.surround('blockquote', html);
  surround = (tag: string, html: string) => `<${tag}>${html}</${tag}>`;
}

export class Parser {
  constructor(private doc: JQuery, private baseUrl: string, private p: HtmlParser) { }

  find(finder: (doc: JQuery) => JQuery) {
    let el = finder(this.doc);
    return this.p.parseElement(el, this.baseUrl);
  }
  // TODO: wrap the output elements so that we do this automatically on .html() calls..
  toHtml(htmlElement: JQuery) {
    return sanitizeHtml(htmlElement.html());
  }
}

@inject(FetchClient, HtmlParser)
export class HtmlFetcher {
  constructor(private http: FetchClient, private parser: HtmlParser) { }

  async fetch(url: string, baseUrl = url, transformer?: (html: string) => string) {
    let x = await this.http.fetch(url);
    let text = await x.text();
    return new Parser($(transformer ? transformer(text) : text), baseUrl, this.parser);
  }
}
