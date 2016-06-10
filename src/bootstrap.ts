import {bootstrap} from 'aurelia-bootstrapper-webpack';

//import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/font-awesome/css/font-awesome.css';
//import '../styles/styles.css';

import {Container, inject, transient, singleton, Lazy, All, Optional, Parent} from 'aurelia-dependency-injection';
import {Aurelia, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Toastr, UiContext, Mediator, ErrorLoggingMediatorDecorator, InjectingMediatorDecorator, BasketService, Client,
  CollectionDataService, ModDataService, MissionDataService, UploadService, ToastLogger, PromiseCache,
  UserInfo, IUserInfo, LegacyBasketService, W6Context, ClientMissingHandler} from './services/lib';
import {HttpClient} from 'aurelia-http-client';
import {AbortError, LoginBase} from './services/auth-base';

import legacySetup = MyApp.setup;
import legacyBootAngular = MyApp.bootAngular;

import Linq from 'linq4es2015';
import numeral from 'numbro';

bootstrap(async (aurelia: Aurelia) => {

  Tk.Debug.log("AURELIA: configuring aurelia");

  Linq.setExtensions();
  //["123"].asEnumerable().select(x => true).toArray();

  function configureApp(site: string, useRouter: boolean, authConfig) {
    Tk.Debug.log("AURELIA: configuring app");
    aurelia.use
      .standardConfiguration()
      .plugin('aurelia-auth', baseConfig => baseConfig.configure(authConfig))
      .plugin('aurelia-animator-css')
      //.plugin('aurelia-animator-velocity')
      .plugin('aurelia-validation')
      .plugin('aurelia-computed', { // install the plugin
        //enableLogging: Tk.getEnvironment() != Tk.Environment.Production // enable debug logging to see aurelia-computed's observability messages.
      })
      .plugin('aurelia-dialog', config => {
        config.useDefaults();
        config.settings.lock = false;
        config.settings.centerHorizontalOnly = true;
      })
      .plugin('aurelia-ui-virtualization')
      .feature('resources')
      .feature('features');

    if (Tk.getEnvironment() != Tk.Environment.Production) {
      aurelia.use.developmentLogging();
      //LogManager.setLevel(Tk.getEnvironment() != Tk.Environment.Production ? LogManager.logLevel.debug : LogManager.logLevel.warn);
    }

    if (useRouter)
      aurelia.use.router();
  }

  async function startApp() {
    new ContainerSetup(Container.instance, angular.element("body").injector());
    Tk.Debug.log("AURELIA: starting app");
    var app = await aurelia.start();
    Tk.Debug.log("AURELIA: app started");
    await app.setRoot();
  }

  //@{ var scheme = w6.Urls.CurrentPage.Scheme; }
  var env = Tk.getEnvironment();

  var domain = window.location.host;
  var envPiece = "";
  if (env == Tk.Environment.Production)
    domain = "withsix.com";
  else if (env == Tk.Environment.Staging) {
    domain = "staging.withsix.net";
    envPiece = "-staging";
  } else {
    domain = "local.withsix.net";
    envPiece = "-dev";
  }

  var actualDomain = window.location.host;

  var site = "main";
  if (actualDomain.startsWith("play")) {
    site = "play";
  } else if (actualDomain.startsWith("connect")) {
    site = "connect";
  }

  var uc = "withsix-usercontent";

  var w6Urls = new W6Urls({
    environment: Tk.getEnvironment(),
    domain: domain,
    site: site,
    cdn: "",
    // TODO: Inject these from somewhere??
    serial: 667, //'@Environments.Serial', // CryptoString.GetRandomAlphanumericString(8)
    cacheBuster: 71,
    assetSalt: 5, //@Environments.AssetSalt,
    buckets: {
      "withsix-usercontent": envPiece ? uc + envPiece + ".s3-eu-west-1.amazonaws.com" : uc + "-cdn.withsix.com"
    }
  });

  function toSsl(host) {
    return host.replace(":9000", ":9001");
  }

  // hack for electron cant communicate with popup
  if (window.location.search.startsWith("?code=")) {
    window.localStorage.setItem('auth-search', window.location.search);
    window.localStorage.setItem('auth-hash', window.location.hash);
    throw new Error("Window was used for auth code handling");
  }

  var something = {
    PublisherId: "19223485",
    AdsenseId: "ca-pub-8060864068276104"
  }

  Container.instance.registerSingleton(W6Urls, () => w6Urls);

  window.w6Cheat.w6Urls = w6Urls;
  window.w6Cheat.container = Container.instance;
  window.w6Cheat.containerObjects.eventBus = <any>EventAggregator;
  window.w6Cheat.containerObjects.toastr = <any>Toastr;
  window.w6Cheat.containerObjects.mediator = Mediator;
  window.w6Cheat.containerObjects.login = LoginBase;
  window.w6Cheat.containerObjects.uiContext = UiContext;
  window.w6Cheat.containerObjects.basketService = BasketService;
  window.w6Cheat.containerObjects.client = Client;
  window.w6Cheat.numeral = numeral;
  var authConfig = {
    //our Aurelia App Address
    baseUrl: window.location.protocol + w6Urls.main,
    loginRedirect: false,
    providers: {
      localIdentityServer: {
        clientId: LoginBase.localClientId,
        authorizationEndpoint: w6Urls.authSsl + '/identity/connect/authorize/',
        url: w6Urls.authSsl + '/api/login/auth',
        redirectUri: window.location.protocol + "//" + window.location.host + '/',
        scope: ['openid', 'profile', 'extended_profile', 'roles', 'api', 'offline_access', 'premium'],
        scopePrefix: '',
        scopeDelimiter: ' ',
        requiredUrlParams: ['scope'],
        display: 'popup',
        popupOptions: { width: 1020, height: 618 },
        loginRedirect: false
      }
    }
  }

  configureApp(site, true, authConfig);

  try {
    // TODO: Find a way to export angular services before booting angular?
    await bs(w6Urls, something);
    await startApp();
  } catch (err) {
    Tk.Debug.error(err);
    throw err;
  }
});

export async function bs(w6Urls: W6Urls, something) {
  let login = new LoginBase(new HttpClient(), w6Urls, Container.instance.get(EventAggregator));
  let userInfo: IUserInfo = null;
  try {
    userInfo = await login.getUserInfo();
  } catch (err) {
    if (err instanceof AbortError) throw err;
    Tk.Debug.log("Error logging in", err);
    userInfo = new UserInfo();
    userInfo.failedLogin = true;
  }

  let rx = /[&\?]port=(\d+)/
  let match = window.location.search.match(rx);
  let port = match ? parseInt(match[1]) : null;
  Container.instance.registerSingleton(Client, () => new Client(Container.instance.get(EventAggregator), Container.instance.get(PromiseCache), port ? port : undefined))

  let client: Client = Container.instance.get(Client);
  (<any>client).connection.promise(); // kick off the connection early
  window.w6Cheat.w6 = new W6(w6Urls, !userInfo.isPremium, window.w6Cheat.isClient, null, userInfo, client);
  legacySetup({
    dfp: { publisherId: something.PublisherId },
    adsense: { client: something.AdsenseId },
    environment: Tk.getEnvironment(),
    w6: window.w6Cheat.w6
  });

  await legacyBootAngular();
}


export class ContainerSetup {
  constructor(private instance: Container, private angularInjector) {
    if (instance == null) throw "instance null";
    if (angularInjector == null) throw "angularInjector null";
    // this.instance.registerSingleton(HttpClient, () => {
    //   var client = new HttpClient();
    //   client.configure(x => {
    //     //x.withInterceptor(new RequestInterceptor());
    //   });
    //   return client;
    // });
    this.instance.registerSingleton(W6, () => window.w6Cheat.w6);
    this.instance.registerTransient(UiContext);
    //this.instance.registerSingleton(ObservableEventAggregator);
    //this.instance.registerSingleton(EventAggregator, () => this.instance.get(ObservableEventAggregator));
    this.registerAngularSingletons([
      // Legacy framework/3rdparty services
      'commandExecutor', 'DoubleClick',
      // Legacy app services
      { name: "logger", cls: ToastLogger }, { name: "collectionDataService", cls: CollectionDataService }, { name: "modDataService", cls: ModDataService }, { name: "missionDataService", cls: MissionDataService }, { name: "basketService", cls: LegacyBasketService }, { name: 'dbContext', cls: W6Context }, { name: 'UploadService', cls: UploadService }
    ]);
    this.instance.registerSingleton(Mediator,
      () => new ErrorLoggingMediatorDecorator(new InjectingMediatorDecorator(new Mediator(), this.instance.get(W6)), this.instance.get(Toastr), this.instance.get(ClientMissingHandler)));
  }

  registerAngularSingletons(services) {
    services.forEach(s => this.registerAngularSingleton(s));
  }

  registerAngularSingleton(name) {
    if (name.name) {
      if (name.cls) this.instance.registerSingleton(name.cls, () => this.angularInjector.get(name.name));
      else this.instance.registerSingleton(name.name, () => this.angularInjector.get(name.name));
    } else this.instance.registerSingleton(name, () => this.angularInjector.get(name));
  }
}


// bootstrap(function(aurelia) {
//   aurelia.use
//     .standardConfiguration()
//     .developmentLogging();
//
//   aurelia.start().then(() => aurelia.setRoot('app', document.body));
// });
