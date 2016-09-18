import {Tools} from './tools';
import {Client, IMiniClientInfo, PreferredClient, CollectionScope} from 'withsix-sync-api';
import breeze from 'breeze-client';
import {IUserInfo} from './dtos';

export interface IAvatarInfo {
  avatarURL?: string;
  avatarUrl?: string;
  avatarUpdatedAt?: string;
  hasAvatar: boolean;
  emailMd5: string;
}

enum Sites {
  Main,
  Play,
  Connect
}


export interface IExternalInfo { 
  forumUrl?: string; steamInfo; gitHubRepo?: string; armaholicUrl?: string; chucklefishUrl?: string; nmsmUrl?: string; nexusUrl?: string; description?: string; homepageUrl?: string;
  mdbUrl?: string; curseUrl?: string;
}


if (!window.RedactorPlugins) window.RedactorPlugins = <any>{};

window.RedactorPlugins.bufferbuttons = () => {
  return {
    init: function() {
      var undo = this.button.addFirst('undo', 'Undo');
      var redo = this.button.addAfter('undo', 'redo', 'Redo');

      this.button.addCallback(undo, this.buffer.undo);
      this.button.addCallback(redo, this.buffer.redo);
    }
  };
};
export var globalRedactorOptions = { plugins: [], linebreaks: true }; // 'p', 'h1', 'h2', 'pre' // allowedTags: ['spoiler', 'code', 'p', 'h1', 'h2', 'pre']
globalRedactorOptions.plugins = ['bufferbuttons', 'image', 'video', 'table', 'fullscreen'];

/*
                    globalRedactorOptions.buttons = [
                        'html', 'formatting', 'bold', 'italic', 'deleted',
                        'unorderedlist', 'orderedlist', 'outdent', 'indent',
                        'image', 'file', 'link', 'alignment', 'horizontalrule'
                    ];
*/

export class W6Urls {
  imageCdn = "https://withsix-img.azureedge.net";
  static getProxyUrl = (site: string) => `https://${site}-proxy.withsix.com/`
  urlNonSsl: string;
  constructor(urls) {
    Object.assign(this, urls);
    var siteSuffix = "withSIX";
    if (this.site)
      siteSuffix = this.site.toUpperCaseFirst() + " " + siteSuffix;
    this.siteTitle = siteSuffix;

    this.setupDomain();

    this.contentCdn = "//" + this.buckets["withsix-usercontent"];
    this.docsCdn = "//withsix-cdn.azureedge.net";
    this.img = {
      play: this.getAssetUrl('img/play-icon.png'),

      steam: this.getAssetUrl('img/hosts/steam-512.gif'),
      chucklefish: this.getAssetUrl('img/hosts/chucklefish.png'),
      unknown: this.getAssetUrl('img/avatar/noava_72.jpg')
    }
    this.version = this.getAssetHashed("version");
  }
  img: {
    play: string; chucklefish: string; steam: string; unknown: string;
  }
  version: string;

  get currentPath() { return window.location.pathname; }

  getCurrentPageWithoutHash() { return window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search; }

  get selectedSite() {
    // todo: Use routing table instead??!
    var path = window.location.pathname;
    if (path == "/p" || path.startsWith("/p/"))
      return Sites.Play;
    if (path == "/me" || path.startsWith("/me/"))
      return Sites.Connect;
    if (path == "/u" || path.startsWith("/u/"))
      return Sites.Connect;
    if (path == "/login" || path == "/register")
      return Sites.Connect;
    return Sites.Main;
  }

  get redirectUrl() { return encodeURIComponent(this.currentPage); }

  get isRoot() { return window.location.pathname == "/"; }

  get tools() { return Tools }

  environment = Tools.env;

  private toSsl(host) { return host.replace(":9000", ":9001"); }
  private fromSsl(host) { return host.replace(":9001", ":9000"); }

  private setupDomain() {
    var host = window.location.host;
    this.currentSite = "//" + host;
    this.url = "//" + host;
    if (window.location.port && window.location.port != "80" && window.location.port != "443") host = host + ":" + window.location.port;

    this.urlSsl = "https:" + this.toSsl(this.url);
    this.urlNonSsl = "http:" + this.fromSsl(this.url);
    this.main = "";
    this.play = "/p";
    this.connect = this.main;
    this.connectSsl = this.urlSsl;

    var auth = "//auth." + this.domain;
    this.authSsl = "https:" + this.toSsl(auth);
    this.api = this.authSsl + "/api";
    this.ws = this.authSsl + "/signalr";

    this.cdn = this.url;
    if (window.assetHash && window.assetHash["cdn"]) this.cdn = window.assetHash["cdn"];
  }

  public getUserUrl = (user: any): string => { return this.getUserSlugUrl(user.slug); };
  public getUserSlugUrl = (userSlug: string): string => { return this.connect + "/u/" + userSlug; };
  public calculateAvatarUrl = (model: IAvatarInfo, size?) => {
    if (!size) size = 72;
    return model.hasAvatar ? this.getCustomAvatarUrl(model, size) : this.getGravatarUrl(model, size);
  };

  // TODO: Images should get added to manifest etc..
  public getSerialUrl(asset) { return this.getAssetUrl(asset); }
  public getAssetUrl(asset) {
    var hashed = this.getAssetHashed(asset);
    return this.cdn + '/' + (hashed || asset);
  }
  private getAssetHashed(asset) { return window.assetHash && window.assetHash[asset] };

  public getUsercontentUrl(asset: string, updatedAt?: Date) {
    asset = this.processAssetVersion(asset, updatedAt);
    if (asset == null) return asset;
    return this.contentCdn + '/' + asset;
  }

  public getUsercontentUrl2(asset: string, updatedAt?: Date) {
    asset = this.processAssetVersion(asset, updatedAt);
    if (asset == null) return asset;
    return this.tools.uriHasProtocol(asset) ? asset : this.contentCdn + '/' + asset;
  }

  public getContentAvatarUrl(avatar: string, updatedAt?: Date): string {
    if (!avatar || avatar == "")
      return null;
    return this.getUsercontentUrl2(avatar, updatedAt);
  }

  public processAssetVersion(avatar: string, updatedAt?: Date): string {
    if (avatar == null) return null;
    if (!updatedAt) return avatar;
    if (avatar.startsWith("blob:")) return avatar;
    return avatar + "?" + Math.round(updatedAt.getTime() / 1000);
  }

  // TODO: Convert to CDNUrl (currently AzureCDN)
  private getGravatarUrl(model: IAvatarInfo, size?) {
    return "//www.gravatar.com/avatar/" + model.emailMd5 +
      "?size=" + size + "&amp;d=%2f%2fwithsix2.azureedge.net%2fimg%2favatar%2fnoava_" + size + ".jpg";
  }

  // TODO: Date.parse seems to be inaccurate...
  private getCustomAvatarUrl(model: IAvatarInfo, size?) {
    var v = model.avatarUpdatedAt ? ("?v=" + Date.parse(model.avatarUpdatedAt)) : "";
    //this.contentCdn + "/account/" + model.id + "/profile/avatar/"
    let url = model.avatarURL || model.avatarUrl;
    return url + size + "x" + size + ".jpg" + v;
  }

  defaultContentImage = 'https://cdn4.iconfinder.com/data/icons/defaulticon/icons/png/256x256/help.png';

  domain: string;
  serial: string;
  authSsl: string;
  url: string;
  urlSsl: string;
  connectSsl: string;
  connect: string;
  play: string;
  kb: string;
  admin: string;
  main: string;
  api: string;
  ws: string;
  cacheBuster: string;
  site: string;
  contentCdn: string;
  cdn: string;
  docsCdn: string;
  buckets: {
    [key: string]: string;
  };
  siteTitle: string;
  currentPage: string;
  currentSite: string;
}

export class W6Ads {
  constructor(private url: W6Urls) {
    this.adsenseId = "ca-pub-8060864068276104";

    this.slots = <any>{
      "main_leaderboard_atf": 9799381642,
      "main_leaderboard_btf": 2276114842,
      "main_rectangle_atf": 6845915243,
      "main_rectangle_btf": 8322648446,
      "main_skyscraper_atf": 3752848047,
      "main_skyscraper_btf": 5229581246,
      "connect_leaderboard_atf": 9799381642,
      "connect_leaderboard_btf": 2276114842,
      "connect_rectangle_atf": 6845915243,
      "connect_rectangle_btf": 8322648446,
      "connect_skyscraper_atf": 3752848047,
      "connect_skyscraper_btf": 5229581246,
      "play_leaderboard_atf": 3613247242,
      "play_leaderboard_btf": 5089980446,
      "play_rectangle_atf": 9659780847,
      "play_rectangle_btf": 2136514044,
      "play_skyscraper_atf": 6706314446,
      "play_skyscraper_btf": 8183047642,
      play: {
        "hz_large": 6485988441,
        "hz_medium": 7962721641,
        "vt_xlarge": 9439454845,
        "vt_large": 1916188043,
        "vt_medium": 3392921241,
        "vt_small": 4869654448
      },
      main: {
        "hz_large": 6346387644,
        "hz_medium": 9299854041,
        "vt_xlarge": 3253320446,
        "vt_large": 4730053648,
        "vt_medium": 7683520042,
        "vt_small": 3113719643
      },
      connect: {

      }
    }
  }

  defineSlot(slot: string, tag: string, sizes: any[][]) {
    var adSlot = googletag.defineSlot("/" + this.adsenseId + "/" + slot, sizes, tag).addService(googletag.pubads());
    var mapping = googletag.sizeMapping();
    sizes.forEach(v => mapping = mapping.addSize(v[0], v[1]));
    mapping.build();

    var resolutions = [];
    sizes.forEach(v => resolutions.push(v[0]));

    adSlot.defineSizeMapping(mapping);
    adSlot.set('adsense_channel_ids', this.slots[slot]);

    googletag.sbNgTags.push([adSlot, resolutions]);
  }

  check = () => {
    if (window.location.protocol == 'https:' || document.location.protocol == 'https:') {
      $('.add-container').empty();
    } else {
      // Refresh
      $(".add-container.add-b").each((e, t) => {
        var adEl = $(t).find("div");
        this.placeAltAd(adEl);
      });

      setTimeout(() => {
        // Find new with 0 height..
        $(".add-container").each((e, t) => {
          var $t = $(t);
          if ($t.hasClass("add-b"))
            return;
          var adEl = $t.find("div");
          if (adEl.height() == 0) {
            this.placeAltAd(adEl);
            $t.addClass('add-b');
          }
        });
      }, 5000);
    }
  };
  placeAltAd = container => {
    if (container.hasClass('add-leaderboard')) {
      this.generateAltLeaderboardAd(container);
    } else if (container.hasClass('add-skyscraper')) {
      this.generateAltSkyscraperAd(container);
    } else {
      this.generateAltRectangleAd(container);
    }
  };
  generateAltLeaderboardAd = container => {
    var adWidth = container.width();
    var img;
    if (adWidth >= 970) {
      img = '97090.png';
    } else if (adWidth >= 728) {
      img = '72890.png';
    } else if (adWidth >= 468) {
      img = '46860.png';
    } else if (adWidth >= 320) {
      img = '32050.png';
    } else {
      img = '125125.png';
    }

    this.appendHtml(container, img);
  };
  generateAltSkyscraperAd = container => {
    var adWidth = container.width();
    var img;
    if (adWidth >= 160) {
      img = '160600.png';
    } else {
      img = '120600.png';
    }

    this.appendHtml(container, img);
  };
  generateAltRectangleAd = container => {
    var adWidth = container.width();
    var parentHeight = 280;
    // Workaround for height in grid..
    var isGrid = container.hasClass('grid-add');
    if (isGrid)
      parentHeight = container.parent().parent().height();

    var img;
    if (adWidth >= 336 && parentHeight >= 280) {
      img = '336280.png';
    } else if (adWidth >= 300 && parentHeight >= 250) {
      img = '300250.png';
    } else if (adWidth >= 250 && parentHeight >= 250) {
      img = '250250.png';
    } else if (adWidth >= 200 && parentHeight >= 200) {
      img = '200200.png';
    } else if (adWidth >= 180 && parentHeight >= 150) {
      img = '180150.png';
    } else {
      img = '125125.png';
    }

    this.appendHtml(container, img);
  };
  appendHtml = (container, img) => {
    container.html('<a href="' + this.url.urlSsl + '/gopremium?ref=0"><img src="' + this.url.cdn + '/img/noa/' + img + "?v=" + this.url.cacheBuster + '" alt="no ads" /></a>');
    /*
            container.empty();
            setTimeout(() => {
                container.append('<a href="' + this.url.urlSsl + '/gopremium?ref=0"><img src="' + this.url.cdn + '/img/noa/' + img + "?v=" + this.url.cacheBuster + '" alt="no ads" /></a>');
            }, 200);
    */
  };

  get isPageExcluded() { return window.location.href.includes("QEDuk6uVNE2ecQyHMP_uXQ"); }

  public processAdSlots(previous, current) {
    var slots = [];
    for (var i in googletag.sbNgTags) {
      var slot = googletag.sbNgTags[i];
      if (this.processAdSize(slot[0], slot[1], current, previous))
        slots.push(slot[0]);
    }

    googletag.pubads().refresh(slots);
    this.check();
  }

  public processAdSize(adSlot, sizes, current, previous) {
    for (var i in sizes) {
      var x = sizes[i];
      if (current >= x[0]) {
        if (previous < x[0])
          return true;
        break;
      }

      if (previous >= x[0]) {
        if (current < x[0])
          return true;
        break;
      }
      /*
  // then in reverse order and condition?
  x = sizes[sizes.length - 1 - i];
  if (current < x[0]) {
      if (previous >= x[0])
          return true;
      break;
  }
*/
    }
    return false;
  }

  refreshAds() {
    if (googletag && googletag.pubads)
      googletag.pubads().refresh();
    this.check();
  }

  slots: { play: { hz_large: number; hz_medium: number; vt_xlarge: number; vt_large: number; vt_medium: number; vt_small: number }; main: { hz_large: number; hz_medium: number; vt_xlarge: number; vt_large: number; vt_medium: number; vt_small: number } };
  adsenseId: string;
}

interface IClient {
  open_pws_uri(url: string): any;
  login(accessToken: string): void;
}

export class W6Client {
  constructor(private client: IClient) {
    this.clientFound = client != null;
  }

  openPwsUri(url: string) {
    this.client.open_pws_uri(url);
  }

  login(accessToken: string) {
    this.client.login(accessToken);
  }

  clientFound: boolean;
}

enum UpdateState {
  Uptodate, // 0
  UpdateInstalled, // 1
  UpdateAvailable, // 2
  UpdateDownloading, // 3
  Updating // 4
}


interface ISettings {
  template?: string; hasSync?: boolean; downloadedSync?: boolean; downloadedPWS?: boolean; remindedFinalize?: boolean;
}

export class W6 {
  public static instance: W6;
  public subSlogan = "The ultimate community driven content delivery platform";
  public slogan = "Because the game is just the beginning";
  public chromeless: any;
  public enableBasket: boolean;
  public isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  public collection2: ICollectionData;
  aureliaReady: boolean;
  libraryParent;
  collection;
  redirected: boolean;
  redirectedWasLoggedIn: boolean;
  public w6OBot = "60f61960-23a3-11e4-8c21-0800200c9a66";

  get isLoggedIn() { return this.userInfo && this.userInfo.id != null; }

  showFooter = true;

  activeGame: { id: string; slug: string }
  settings: ISettings = {}

  get enableAds() { return !this.userInfo.isPremium }
  get renderAds() { return this.enableAds && !this.ads.isPageExcluded; }
  get isClient() { return window.six_client != null }

  constructor(public url: W6Urls, public userInfo: IUserInfo, public miniClient: Client, public api: IApi) {
    this.chromeless = window.location.search.includes("chromeless") || this.isClient;
    this.enableBasket = !this.isClient;
    if (this.isClient)
      this.client = new W6Client(<IClient>window.six_client);

    let settings = window.localStorage.getItem('w6.settings');
    this.settings = settings ? JSON.parse(settings) : {};
    this.activeGame = this.deserializeActiveGame();
    let hash = window.location.hash;

    let hasSslRedir = window.location.hash.includes('sslredir=1');
    let hasLoggedIn = window.location.hash.includes('loggedin=1');
    if (hasSslRedir) {
      this.redirected = true;
      hash = Tools.cleanupHash(hash.replace(/\&?sslredir=1/g, ""));
    }
    if (hasLoggedIn) {
      hash = Tools.cleanupHash(hash.replace(/\&?loggedin=1/g, ""))
      this.redirectedWasLoggedIn = true;
    }
    if (hasSslRedir || hasLoggedIn) this.updateHistory(window.location.pathname + window.location.search + hash);
  }


  updateHistory = (desired) => {
    Tools.Debug.log("$$$ updating history", desired);
    history.replaceState("", document.title, desired)
  }

  deserializeActiveGame() {
    let r = window.localStorage.getItem(this.activeGameKey);
    if (!r) return {};
    return JSON.parse(r);
  }

  activeGameKey = 'withSIX.activeGame';

  setActiveGame(info) {
    // TODO: Save in settings
    this.activeGame = info;
    window.localStorage.setItem(this.activeGameKey, JSON.stringify(info));
  }

  updateSettings(cmd: (settings: ISettings) => void) {
    cmd(this.settings);
    this.saveSettings();
  }

  // TODO: Only when changed?
  saveSettings() { window.localStorage.setItem('w6.settings', JSON.stringify(this.settings)); }

  updateUserInfo = (newUserInfo: IUserInfo, userInfo: IUserInfo) => {
    Object.assign(userInfo, newUserInfo);
    userInfo.clearAvatars();
  }

  reload() {
    window.onbeforeunload = undefined;
    window.location.reload(true);
  }

  public userTitling(title?: string) {
    var titling = this.userInfo.id ? this.userInfo.userName + "'s" : "Your";
    return title ? `${titling} ${title}` : titling;
  }

  contentRowClasses() { return ""; }

  versionedAsset(path: string): string {
    return this.url.getAssetUrl(path);
  }

  versionedImage(path: string): string {
    return this.url.getAssetUrl("img/" + path);
  }

  iso8601RegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;

  public convertToClient<T>(obj, convertPropertyNames = true) {
    var converter = breeze.NamingConvention.defaultInstance;
    if (obj instanceof Array) {
      var newAr = [];
      angular.forEach(obj, (v, i) => newAr[i] = this.convertToClient(v, convertPropertyNames));
      return <T><any>newAr;
    } else if (obj instanceof Date) {
      return <T><any>obj;
    } else if (obj instanceof Object) {
      var newObj = {};
      if (convertPropertyNames) angular.forEach(obj, (v, p) => newObj[converter.serverPropertyNameToClient(p)] = this.convertToClient(v, convertPropertyNames));
      else angular.forEach(obj, (v, p) => newObj[p] = this.convertToClient(v, convertPropertyNames));
      return <T>newObj;
    } else if (typeof(obj) === 'string') {
      if (this.iso8601RegEx.test(obj)) return <T><any>breeze.DataType.parseDateFromServer(obj);
    } else if (obj instanceof String) {
      if (this.iso8601RegEx.test(obj.toString())) return <T><any>breeze.DataType.parseDateFromServer(obj);
    }

    return <T>obj;
  }

  private convertToServer<T>(obj: T) {
    var converter = breeze.NamingConvention.defaultInstance;
    if (obj instanceof Array) {
      var newAr = [];
      angular.forEach(obj, (v, i) => newAr[i] = this.convertToServer(v));
      return <T><any>newAr;
    } else if (obj instanceof Date) {
      return <T><any>obj;
    } else if (obj instanceof Object) {
      var newObj = {};
      angular.forEach(obj, (v, p) => newObj[converter.clientPropertyNameToServer(p)] = v instanceof Object ? this.convertToServer(v) : v);
      return <T>newObj;
    }
    return obj;
  }
  // Divisable by 8! Keep in sync with C#: ImageConstants
  public imageSizes = {
    smallSquare: {
      w: 48,
      h: 48
    },
    smallRectangle: {
      w: 384,
      h: 216
    },
    bigRectangle: {
      w: 1024,
      h: 576
    },
    missionThumb: {
      w: 160,
      h: 100
    },
    missionOriginalFileName: 'original.jpg'
  };
  public usermenu = {
    init: () => {
      // toggle...
      if ($('#usermenu').hasClass('hidden')) {
        $('#usermenu').removeClass('hidden');
      } else {
        $('#usermenu').addClass('hidden');
      }

    }
  };

  public forms = {
    init: () => {
      // Implement MarkdownDeep Editor
      if ($('.wmd-input').length > 0) {
        this.forms.markdownEditor();
      }
      if ($('.html-input').length > 0) {
        this.forms.htmlEditor();
      }
    },
    markdownEditor: () => {
      $('.wmd-input').each((index, element: any) => {
        var converter = Markdown.getSanitizingConverter();
        var editor = new Markdown.Editor(converter);
        editor.run(element.id);
      });
    },
    htmlEditor: () => { (<any>$('.html-input')).redactor(globalRedactorOptions); }
  };

  public scrollToAnchor(anchorname): void {
    var anchor = $("a[name='" + anchorname + "']");
    this.scrollTo(anchor.offset().top, 300);
  }

  public scrollTo(position, duration): void {
    $('html, body').animate({
      scrollTop: position
    }, duration);
  }

  public ads = new W6Ads(this.url);

  public slider = {
    init: () => {
      // set items
      this.slider.items = $('#mediaslider').find('ul li').length + 1;

      // set item width
      this.slider.itemWidth = $($('#mediaslider').find('ul li')[0]).outerWidth(true);

      // set slider width
      this.slider.sliderWidth = $('#mediaslider').width();

      // events
      $('#mediaslider').find('.btn-left').on('click', e => {
        e.preventDefault();
        this.slider.moveLeft();
      });
      $('#mediaslider').find('.btn-right').on('click', e => {
        e.preventDefault();
        this.slider.moveRight();
      });
    },
    currentPosition: 0,
    sliderWidth: 0,
    items: 0,
    itemWidth: 0,
    moveLeft: () => {
      if (this.slider.currentPosition < ((this.slider.itemWidth * -1) + this.slider.itemWidth)) {
        this.slider.move(this.slider.itemWidth * -1);
      }
    },
    moveRight: () => {
      if (this.slider.currentPosition > ((this.slider.itemWidth * this.slider.items) - (this.slider.itemWidth * 2)) * -1) {
        this.slider.move(this.slider.itemWidth);
      }
    },
    move: direction => {
      $('#mediaslider').find('ul').animate({
        'margin-left': this.slider.currentPosition - direction
      }, 200, () => {
        this.slider.currentPosition = this.slider.currentPosition - direction;
      });
    }
  };

  basketUrlDisabled() { return /[?\&]basket=0/.test(window.location.href); }

  client: W6Client;
  adsenseId: string;
  get openLoginDialog() { return this.api.login }
  set openLoginDialog(value) { this.api.login = value }
  get logout() { return this.api.logout }
  set logout(value) { this.api.logout = value }
  openRegisterDialog: (evt?) => void;
  get navigate() { return this.api.navigate }
  set navigate(value) { this.api.navigate = value }
};

export interface ICollectionData {
  id: string;
  name: string;
  gameId: string;
  groupId?: string;
  items: IShowDependency[];
  servers: IServer[];
  repositories: string;
  scope: CollectionScope;
  updatedAt: Date;
  author: { id?: string; displayName?: string; userName?: string; }
  preferredClient: PreferredClient;
}


export interface IDependency {
  dependency: string;
  id?: string;
  constraint?: string;
  isRequired?: boolean;
  type: string;
  availableVersions?: string[];
  version: string;
}

export interface IShowDependency extends IDependency {
  name?: string;
  image?: string;
  newlyAdded?: number;
  gameId: string;
  //avatarUpdatedAt?: Date;
}

export interface IServer {
  address: string;
  password: string;
}
