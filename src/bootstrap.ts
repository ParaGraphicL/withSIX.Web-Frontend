import '../node_modules/font-awesome/css/font-awesome.css';
import {bootstrap} from 'aurelia-bootstrapper-webpack';
import {Container, inject, transient, singleton, Lazy, All, Optional, Parent} from 'aurelia-dependency-injection';
import {Aurelia, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {HttpClient} from 'aurelia-http-client';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import Linq from 'linq4es2015';
import numeral from 'numbro';
import breeze from 'breeze-client';


import {Toastr, UiContext, Mediator, ErrorLoggingMediatorDecorator, InjectingMediatorDecorator, BasketService, Client,
  CollectionDataService, ModDataService, MissionDataService, PromiseCache,
  EntityExtends, IUserInfo, W6Context, ClientMissingHandler,
  W6Urls, W6, Tools} from './services/lib';
import {ToastLogger} from './services/legacy/logger';
import {AbortError, LoginBase} from './services/auth-base';
import {Api} from './services/api';

import {MyApp} from './legacy/app';
import legacySetup = MyApp.setup;
import legacyBootAngular = MyApp.bootAngular;


// hack for electron cant communicate with popup
if (window.location.search.startsWith("?code=")) {
  window.localStorage.setItem('auth-search', window.location.search);
  window.localStorage.setItem('auth-hash', window.location.hash);
  throw new Error("Window was used for auth code handling");
}

bootstrap(async (aurelia: Aurelia) => {
  Tools.Debug.log("AURELIA: configuring aurelia");

  require('breeze-client-labs/breeze.getEntityGraph');
  // workaround
  (<any>breeze.EntityManager.prototype).getEntityGraph = (<any>window).breeze.EntityManager.prototype.getEntityGraph

  breeze.NamingConvention.camelCase.setAsDefault();
  breeze.DataType.parseDateFromServer = function(source) {
    var date = moment(source);
    return date.toDate();
  };

  Linq.setExtensions();
  //["123"].asEnumerable().select(x => true).toArray();

  var site = "main";
  let w6Urls = createW6Urls(site);

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
    await bs(w6Urls);
    await startApp();
  } catch (err) {
    Tools.Debug.error(err);
    throw err;
  }

  function configureApp(site: string, useRouter: boolean, authConfig) {
    Tools.Debug.log("AURELIA: configuring app");
    aurelia.use
      .standardConfiguration()
      .plugin('aurelia-auth', baseConfig => baseConfig.configure(authConfig))
      .plugin('aurelia-fetch-client', config => {
        Tools.Debug.log("$$$ fetch!!", config)
      })
      .plugin('aurelia-animator-css')
      //.plugin('aurelia-animator-velocity')
      .plugin('aurelia-validation')
      .plugin('aurelia-computed', { // install the plugin
        //enableLogging: Tools.getEnvironment() != Tools.Environment.Production // enable debug logging to see aurelia-computed's observability messages.
      })
      .plugin('aurelia-dialog', config => {
        config.useDefaults();
        config.settings.lock = false;
        config.settings.centerHorizontalOnly = true;
      })
      .plugin('aurelia-ui-virtualization')
      .plugin('aurelia-breeze')
      .feature('resources')
      .feature('features');

    if (Tools.getEnvironment() != Tools.Environment.Production) {
      aurelia.use.developmentLogging();
      //LogManager.setLevel(Tools.getEnvironment() != Tools.Environment.Production ? LogManager.logLevel.debug : LogManager.logLevel.warn);
    }

    if (useRouter)
      aurelia.use.router();
  }

  function createW6Urls(site: string) {
    var env = Tools.getEnvironment();
    var domain = window.location.host;
    var envPiece = "";
    if (env == Tools.Environment.Production)
      domain = "withsix.com";
    else if (env == Tools.Environment.Staging) {
      domain = "staging.withsix.net";
      envPiece = "-staging";
    } else {
      domain = "local.withsix.net";
      envPiece = "-dev";
    }

    var actualDomain = window.location.host;

    var uc = "withsix-usercontent";

    return new W6Urls({
      environment: Tools.getEnvironment(),
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
  }

  async function bs(w6Urls: W6Urls) {
    Container.instance.registerSingleton(W6Urls, () => w6Urls);
    let login = new LoginBase(Container.instance.get(HttpClient), Container.instance.get(FetchClient), w6Urls, Container.instance.get(EventAggregator));
    let userInfo: IUserInfo = null;
    try {
      userInfo = await login.getUserInfo();
    } catch (err) {
      if (err instanceof AbortError) throw err;
      Tools.Debug.log("Error logging in", err);
      userInfo = new EntityExtends.UserInfo();
      userInfo.failedLogin = true;
    }

    let rx = /[&\?]port=(\d+)/
    let match = window.location.search.match(rx);
    let port = match ? parseInt(match[1]) : null;
    Container.instance.registerSingleton(Client, () => new Client(Container.instance.get(EventAggregator), Container.instance.get(PromiseCache), port ? port : undefined))

    const client: Client = Container.instance.get(Client);
    const api: Api = Container.instance.get(Api);
    window.w6Cheat = { api }
    // WARNING CANT PASS THE ROUTER INSTANCE HERE OR Aurelia STOPS ROUTING
    const w6 = W6.instance = new W6(w6Urls, userInfo, client, api);
    Container.instance.registerSingleton(W6, () => w6);
    legacySetup({
      dfp: { publisherId: "19223485" },
      adsense: { client: "ca-pub-8060864068276104" },
      w6
    });
    (<any>client).connection.promise(); // kick off the connection early

    await legacyBootAngular(w6Urls);
  }

  async function startApp() {
    new ContainerSetup(Container.instance, angular.element("body").injector());
    Tools.Debug.log("AURELIA: starting app");
    var app = await aurelia.start();
    Tools.Debug.log("AURELIA: app started");
    await app.setRoot();
  }
});

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
    this.instance.registerTransient(UiContext);
    this.registerAngularSingletons(['commandExecutor']);

    this.instance.registerSingleton(Mediator,
      () => new ErrorLoggingMediatorDecorator(new InjectingMediatorDecorator(new Mediator(), this.instance.get(W6)), this.instance.get(Toastr), this.instance.get(ClientMissingHandler), this.instance.get(W6)));
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
