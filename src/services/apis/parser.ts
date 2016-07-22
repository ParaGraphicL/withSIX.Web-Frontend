import { sanitizeHtml, parseBBCode } from '../../helpers/utils/string';
import { HttpClient as FetchClient } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';

export { parseBBCode }

export class HtmlParser {
  toJquery(text: string, baseUrl?: string, transformer?) {
    return new Parser($(this.createDocument(text, "imported html")), baseUrl, this)
  }

  createDocument(html, title) {
    var doc = document.implementation.createHTMLDocument(title)
    doc.documentElement.innerHTML = html
    return doc
  }

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
    !url.match(/^(\/\/)|(https?:\/)\//) //url.match(/^((\.)?\/[^\/]/)
      ? this.combineUrls(baseUrl, url)
      : null;

  combineUrls = (baseUrl: string, url: string) => {
    if (url.startsWith(".")) url = url.substring(1);
    if (url.startsWith("/")) url = url.substring(1);
    return baseUrl + url;
  }

  quote = (html: string) => this.surround('blockquote', html);
  surround = (tag: string, html: string) => `<${tag}>${html}</${tag}>`;

  static shouldIncludeImage = (i) => {
    return true;
  }

  static compareImage = (x, i) => {
    return (i.href && i.href === x.href)
      || (i.thumbnail && i.thumbnail === x.thumbnail)
      || (i.youtube && i.youtube === x.youtube)
      || (i.vimeo && i.vimeo === x.vimeo);
    // TODO: compare the filename..
  }
}

export class Parser {
  constructor(private doc: JQuery, private baseUrl: string, private p: HtmlParser) { }

  find(finder: (doc: JQuery) => JQuery) {
    let el = finder(this.doc);
    return this.p.parseElement(el, this.baseUrl);
  }
  // TODO: wrap the output elements so that we do this automatically on .html() calls..
  toHtml(el?: JQuery) {
    return sanitizeHtml(el.html());
  }
  extractImages(el: JQuery) {
    let images: { href: string; title: string; thumbnail?: string, youtube?: string, vimeo?: string, poster?: string; type?: string; }[] = [];
    let handledImages = [];
    el.find("iframe").each((i, x) => {
      let el = $(x);
      let src = el.attr('src');

      let video = this.tryVideo(src);
      if (video) images.push(video);
      // TODO: Vimeo
    })

    el.find("a").each((i, x) => {
      let el = $(x);
      let link = el.attr('href');
      let linkTitle = el.attr('title');
      el.find('img').each((ii, ix) => {
        if (handledImages.includes(ix)) return;
        let iel = $(ix);
        let linkImage = this.isImage(link) ? link : null;
        let imgSrc = iel.attr('src') || linkImage;
        if (imgSrc) images.push({ href: linkImage ? linkImage : imgSrc, title: linkTitle || iel.attr('alt') || iel.attr('title'), thumbnail: imgSrc })
        handledImages.push(iel);
      })

      if (link) {
        let isMp4 = link.endsWith('.mp4');
        if (isMp4 || link.endsWith('.ogg')) {
          images.push({
            href: link,
            title: linkTitle,
            type: `video/${isMp4 ? 'mp4' : 'ogg'}`
          })
        } else {
          let video = this.tryVideo(link);
          if (video) images.push(video);
        }
      }
    })

    el.find("img").each((i, x) => {
      if (handledImages.includes(x)) return;
      let el = $(x);
      let imgSrc = el.attr('src');
      if (imgSrc) images.push({ href: imgSrc, title: el.attr('title') || el.attr('alt'), thumbnail: imgSrc })
      handledImages.push(x);
    })
    let newImages = [];
    images.forEach(x => { if (HtmlParser.shouldIncludeImage(x) && !newImages.some(i => HtmlParser.compareImage(x, i))) newImages.push(x) });
    return newImages;
  }
  tryVideo = (src: string) => {
    if (!src) return null;
    let m;
    if ((src.includes('youtube.com/embed/') || src.includes('youtu.be/embed/')) && (m = src.match(/embed\/([^\/]+)/))) {
      let id = m[1];
      return {
        href: src,
        title: 'Video',
        type: 'text/html',
        youtube: id,
        poster: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      };
    }
    return null;
  }
  isImage = (url: string) => {
    // TODO: improve
    return url && [".png", ".gif", ".jpg"].some(x => url.endsWith(x));
  }
}

@inject(FetchClient, HtmlParser)
export class HtmlFetcher {
  constructor(private http: FetchClient, private parser: HtmlParser) { }

  async fetch(url: string, baseUrl = url, transformer?: (html: string) => string) {
    let x = await this.http.fetch(url);
    let text = await x.text();
    return this.parser.toJquery(transformer ? transformer(text) : text, baseUrl);
  }
}
