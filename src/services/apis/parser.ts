import { sanitizeHtml, parseBBCode } from '../../helpers/utils/string';
import { createUrlSafe, Url } from '../../helpers/utils/url';
import { HttpClient as FetchClient } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';

export { parseBBCode }

interface Media { href: string; title: string; thumbnail?: string, youtube?: string, vimeo?: string, poster?: string; type?: string; originalLink?: string }

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
    !url.match(/^(\/\/)|(https?:\/)\//) //url.match(/^((\.)?\/[^\/\?#\s]/)
      ? this.combineUrls(baseUrl, url)
      : null;

  combineUrls = (baseUrl: string, url: string) => {
    if (url.startsWith(".")) url = url.substring(1);
    if (url.startsWith("/")) url = url.substring(1);
    return baseUrl + url;
  }

  quote = (html: string) => this.surround('blockquote', html);
  surround = (tag: string, html: string) => `<${tag}>${html}</${tag}>`;

  static shouldIncludeImage = (i: Media) => !i.href || (!HtmlParser.filterHref(i.href) && (!i.originalLink || !HtmlParser.filterHref(i.originalLink)));

  static shouldFilterHref = [
    '/logos/banner-420x120.png',

    'emoticon',

    '//forums.bistudio.com/',
    '//www.bistudio.com/assets/img/licenses',
    '//www.bistudio.com/license',

    // both www. and main
    'armaholic.com/images/pfs/',
    'armaholic.com/datas/users/news_download',
    'armaholic.com/skins/',

    '//button.moddb.com/',
    '//staticdelivery.nexusmods.com/contents/images',

    '//store.akamai.steamstatic.com/public/shared/images/',
    '//cfl.dropboxstatic.com/static/images/',
    '//wmtransfer.com/',
    '//paypalobjects.com/',
    '//www.paypal.com/',
    '//creativecommons.org/',
    '//patreon.com/'
  ]

  static filterHref(href: string) { return this.shouldFilterHref.some(x => href.toLowerCase().includes(x)); }

  static compareImage = (x, i) => {
    return (i.href && i.href === x.href)
      || (i.thumbnail && i.thumbnail === x.thumbnail)
      || (i.youtube && i.youtube === x.youtube)
      || (i.vimeo && i.vimeo === x.vimeo)
      || (i.href && x.href && HtmlParser.fileNameMatch(createUrlSafe(i.href), createUrlSafe(x.href)));
  }
  static fileNameMatch = (x: Url, i: Url) => {
    const rxFn = /\.\w+$/
    if (!i.pathname.match(rxFn) || !x.pathname.match(rxFn)) return false;
    const rx = /\/([^\/\?#\s]+)$/;
    let xfn = x.pathname.match(rx)[1];
    let ifn = i.pathname.match(rx)[1];
    return xfn === ifn;
  }
}

// TODO: Pickup Publishers
export abstract class InterestingLink {
  displayImage: string;
  title: string;
  get displayName() { return this.title || this.url; }
  constructor(public url: string, public images: string[] = []) {
    if (images && images.length > 0) this.displayImage = images[0];
    if (!this.displayImage) this.displayImage = this.getDisplayImage();
 }
 protected getDisplayImage() { return null; }
}
export class ImgurGallery extends InterestingLink {
  title = "Imgur Gallery"
  constructor(url, images) { super(url, images); this.displayImage = null }
}
export class SocialMedia extends InterestingLink {
  title = "Social Media"
 }
 export class GithubUrl extends InterestingLink {
   title = "GitHub Repo"
 }
export class WorkshopUrl extends InterestingLink {
  title = "Steam Workshop"
}
export class ArmaholicUrl extends InterestingLink {
  title = "Armaholic"
}
export class ForumUrl extends InterestingLink {
  title = "Community Forum"
  constructor(public url: string, public images: string[] = []) {
    super(url, images);
    if (url.includes("armaholic.com")) this.title = "Armaholic Forums";
  }
}
export class HomepageUrl extends InterestingLink {
  title = "Homepage"
}
export class VideoUrl extends InterestingLink {
  title = "Video Channel";
}
export class DonationUrl extends InterestingLink {
  title = "Support the Author"
  protected getDisplayImage() {
    if (this.url.includes('patreon.com/')) return 'https://s3.amazonaws.com/patreon_public_assets/toolbox/patreon_logo.png';
    else if (this.url.includes('paypal.com/')) return 'https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png';
    return super.getDisplayImage();
  }
}
export class LicenseUrl extends InterestingLink {
  title = "License"
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

  extractInterestingLinks(el: JQuery) {
    let interestingLinks: InterestingLink[] = [];
    el.find("a").each((i, x) => {
      let el = $(x);
      let link = el.attr('href');
      let images = [];
      el.find("img").each((i, x) => {
        let iel = $(x);
        let src = iel.attr('src');
        if (src) images.push(src);
      })
      if (link) {
        let r: InterestingLink;
        if ((r = this.determineInterestingLink(link, images)) && !interestingLinks.some(x => x.url === r.url))
          interestingLinks.push(r);
      }
    });
    return interestingLinks;
  }

  determineInterestingLink(url: string, images: string[]): InterestingLink {
    if (url.startsWith('http://imgur.com/a/')
      || url.startsWith('https://imgur.com/a/')
      || url.startsWith('http://imgur.com/gallery/')
      || url.startsWith('https://imgur.com/gallery/'))
      return new ImgurGallery(url, images);

    if (url.startsWith('https://facebook.com/')
      || url.startsWith('https://www.facebook.com/')
      || url.startsWith('https://plus.google.com/')
      || url.startsWith('https://twitter.com/'))
      return new SocialMedia(url, images);

// TODO: better distinguishing...
/*
    if (url.startsWith('https://forums.bistudio.com/')
      || url.startsWith('http://community.playstarbound.com/')
      || url.startsWith('http://www.armaholic.com/forums.php'))
      return new ForumUrl(url, images);

    if (url.startsWith('http://www.armaholic.com/page.php?id='))
      return new ArmaholicUrl(url, images);
*/
    if (url.startsWith('http://www.youtube.com/playlist')
      || url.startsWith('https://www.youtube.com/playlist')
      || url.startsWith('http://www.youtube.com/user')
      || url.startsWith('https://www.youtube.com/user'))
      return new VideoUrl(url, images); // TODO

    if (url.includes('patreon.com/') || url.includes('paypal.com/') || url.includes('wmtransfer.com/') || url.includes('webmoney.ru'))
      return new DonationUrl(url, images);

    if (url.includes('creativecommons.org/') || url.includes('www.bistudio.com/license'))
      return new LicenseUrl(url, images);

    return null;
  }

  extractImages(root: JQuery) {
    let images: Media[] = [];
    let handledImages = [];
    root.find("iframe").each((i, x) => {
      let src = $(x).attr('src');

      let video = this.tryVideo(src);
      if (video) images.push(video);
      // TODO: Vimeo
    })

    root.find("a").each((i, x) => {
      let el = $(x);
      let link = el.attr('href');
      let linkTitle = el.attr('title');
      el.find('img').each((ii, ix) => {
        if (handledImages.includes(ix)) return;
        let iel = $(ix);
        let linkImage = this.isImage(link) ? link : null;
        let imgSrc = iel.attr('src') || linkImage;
        if (imgSrc) {
          let vid = this.tryImageVideo(imgSrc);
          if (vid) images.push(vid)
          else images.push({ href: this.growImage(linkImage ? linkImage : imgSrc), title: linkTitle || iel.attr('alt') || iel.attr('title'), thumbnail: imgSrc, originalLink: link })
        }
        handledImages.push(ix);
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

    root.find("img").each((i, x) => {
      if (handledImages.includes(x)) return;
      let el = $(x);
      let imgSrc = el.attr('src');
      if (imgSrc) {
        let vid = this.tryImageVideo(imgSrc);
        if (vid) images.push(vid)
        else images.push({ href: this.growImage(imgSrc), title: el.attr('title') || el.attr('alt'), thumbnail: imgSrc })
      }
      handledImages.push(x);
    })
    let newImages = [];
    images.forEach(x => { if (HtmlParser.shouldIncludeImage(x) && !newImages.some(i => HtmlParser.compareImage(x, i))) newImages.push(x) });
    return newImages;
  }

  rxInterpolation = /(.*\/)\?interpolation=/

  growImage = (url: string) => {
    let m = url.match(this.rxInterpolation);
    return m ? m[1] : url;
  }

  rxImageVideo = /img\.youtube\.com\/vi\/([^\/\?#\s]+)/
  tryImageVideo = (imgSrc: string) => {
    let m;
    if (m = imgSrc.match(this.rxImageVideo)) {
      let id = m[1];
      return {
        href: `https://youtube.com/embed/${id}`,
        title: 'Video',
        type: 'text/html',
        youtube: id,
        poster: `https://img.youtube.com/vi/${id}/0.jpg`
      }
    }
    return null;
  }

  tryVideo = (src: string) => {
    if (!src) return null;
    let m;
    if (
      (src.includes('youtube.com/embed/') || src.includes('youtu.be/embed/') || src.includes('youtube-nocookie.com/embed/'))
        && (m = src.match(/embed\/([^\/\?#\s]+)/))) {
      let id = m[1];
      return {
        href: src,
        title: 'Video',
        type: 'text/html',
        youtube: id,
        poster: `https://img.youtube.com/vi/${id}/0.jpg` // maxresdefault just doesnt always exist! http://stackoverflow.com/questions/34763547/youtube-maxresdefault-thumbnails
      };
    }
    return null;
  }
  isImage = (url: string) => {
    if (!url) return false;
    // TODO: improve
    const imageExt = [".png", ".gif", ".jpg"];
    let safeUrl = createUrlSafe(url);
    return url && imageExt.some(x => url.endsWith(x)) || imageExt.some(x => safeUrl.pathname.endsWith(x));
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
