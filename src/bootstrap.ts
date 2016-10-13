import {bootstrap} from "aurelia-bootstrapper-webpack";
import {Aurelia, LogManager, Container, inject, transient, singleton, Lazy, All, Optional, Parent} from "aurelia-framework";
import {Router} from "aurelia-router";
import {EventAggregator} from "aurelia-event-aggregator";
import {HttpClient} from "aurelia-http-client";
import {HttpClient as FetchClient} from "aurelia-fetch-client";
import numeral from "numbro";
import breeze from "breeze-client";

import {bootAngular} from "./legacy";

import {Toastr, UiContext, Mediator, ErrorLoggingMediatorDecorator, InjectingMediatorDecorator, BasketService, Client,
  CollectionDataService, ModDataService, MissionDataService, PromiseCache,
  IUserInfo, W6Context, ClientMissingHandler, EntityExtends,
  W6Urls, W6, Tools, Environment, StateChanged} from "./services/lib";
import {ToastLogger, GlobalErrorHandler, LogAppender} from "./services/legacy/logger";
import { AbortError, LoginBase, UserInfo } from "./services/auth-base";
import {Api} from "./services/api";

// hack for electron cant communicate with popup
if (window.location.search.startsWith("?code=")) {
  window.localStorage.setItem("auth-search", window.location.search);
  window.localStorage.setItem("auth-hash", window.location.hash);
  throw new Error("Window was used for auth code handling");
}

const getInstance = <T>(o) => <T> Container.instance.get(o);

export async function configure(aurelia: Aurelia) {
  Tools.Debug.log("AURELIA: configuring aurelia");

  require("breeze-client-labs/breeze.getEntityGraph");
  require("breeze-client-labs/breeze.saveErrorExtensions");
  breeze.NamingConvention.camelCase.setAsDefault();
  breeze.DataType.parseDateFromServer = function(source) {
    // if (typeof(source) === 'string' && !source.endsWith("Z")) source = source + "Z"
    let date = moment(source);
    return date.toDate();
  };

  let site = "main";
  let w6Urls = createW6Urls(site);

  let authConfig = {
    // our Aurelia App Address
    baseUrl: window.location.protocol + w6Urls.main,
    loginRedirect: false,
    providers: {
      localIdentityServer: {
        clientId: LoginBase.localClientId,
        authorizationEndpoint: w6Urls.authSsl + "/identity/connect/authorize/",
        url: w6Urls.authSsl + "/api/login/auth",
        redirectUri: window.location.protocol + "//" + window.location.host + "/",
        scope: ["openid", "profile", "extended_profile", "roles", "api", "offline_access", "premium"],
        scopePrefix: "",
        scopeDelimiter: " ",
        requiredUrlParams: ["scope"],
        display: "popup",
        popupOptions: { width: 1020, height: 618 },
        loginRedirect: false,
      },
    },
  };

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
       new ContainerSetup(aurelia.use.container);
 
    aurelia.use
      .standardConfiguration()
      .plugin("aurelia-auth", baseConfig => baseConfig.configure(authConfig))
      .plugin("aurelia-fetch-client")
      .plugin("aurelia-animator-css")
      // .plugin('aurelia-animator-velocity')
      .plugin("aurelia-validation")
      .plugin("aurelia-computed", { // install the plugin
        // enableLogging: Tools.env != Tools.Environment.Production // enable debug logging to see aurelia-computed's observability messages.
      })
      .plugin("aurelia-dialog", config => {
        config.useDefaults();
        config.settings.lock = false;
        config.settings.centerHorizontalOnly = true;
      })
      .plugin("aurelia-ui-virtualization")
      .plugin("aurelia-breeze")
      .feature("resources")
      .feature("features");

    if (Tools.env !== Environment.Production) {
      aurelia.use.developmentLogging();
      // LogManager.setLevel(Tools.env != Tools.Environment.Production ? LogManager.logLevel.debug : LogManager.logLevel.warn);
    }
    if (useRouter) aurelia.use.router();
  }

  function createW6Urls(site: string) {
    let env = Tools.env;
    let domain = window.location.host;
    let envPiece = "";
    if (env === Environment.Production) {
      domain = "withsix.com";
    } else if (env === Environment.Staging) {
      domain = "withsix.com";
    } else {
      domain = "local.withsix.net";
      envPiece = "-dev";
    }

    let actualDomain = window.location.host;

    let uc = "withsix-usercontent";

    return new W6Urls({
      environment: Tools.env,
      domain: domain,
      site: site,
      cdn: "",
      // TODO: Inject these from somewhere??
      serial: 667, // '@Environments.Serial', // CryptoString.GetRandomAlphanumericString(8)
      cacheBuster: 71,
      assetSalt: 5, // @Environments.AssetSalt,
      buckets: {
        "withsix-usercontent": envPiece ? uc + envPiece + ".s3-eu-west-1.amazonaws.com" : uc + ".azureedge.net",
      },
    });
  }

  async function bs(w6Urls: W6Urls) {
    Container.instance.registerSingleton(W6Urls, () => w6Urls);
    let login = getInstance<LoginBase>(LoginBase);
    login.setHeaders();
    let userInfo: IUserInfo = null;
    try {
      userInfo = await login.getUserInfo();
    } catch (err) {
      if (err instanceof AbortError) throw err;
      Tools.Debug.log("Error logging in", err);
      userInfo = new UserInfo();
      userInfo.failedLogin = true;
    }

    let rx = /[&\?]port=(\d+)/;
    let match = window.location.search.match(rx);
    let port = match ? parseInt(match[1]) : null;
    Container.instance.registerSingleton(Client, () => {
      const client = new Client(getInstance<PromiseCache>(PromiseCache), getInstance<FetchClient>(FetchClient), port ? port : undefined);
      const eventBus: EventAggregator = Container.instance.get(EventAggregator);
      const debug = Tools.env > Tools.Environment.Staging;
      client.onAny((event, ...args) => {
        if (debug) Tools.Debug.log(`$WSAPI: ${event}`, ...args);
        if (event.startsWith("command.")) return;
        if (event === "connection.state-changed") {
          eventBus.publish(new StateChanged(args[0], args[1]));
          return;
        }
        let params = [event].concat(args);
        let callParams = params.length < 3 ? params : [event, args];
        eventBus.publish.apply(eventBus, callParams);
      });

      // Rx.Observable.fromEvent(client, 'command.executed', (commandName, command, result) => { return  { commandName, command, result} } ) // or, if unknown (...args) => args
        // .subscribe(x => console.log("$$$$ Received ", x))
      return client;
    });

    const client = getInstance<Client>(Client);
    const api = getInstance<Api>(Api);
    // WARNING CANT PASS THE ROUTER INSTANCE HERE OR Aurelia STOPS ROUTING
    const w6 = W6.instance = new W6(w6Urls, userInfo, client, api);
    EntityExtends.BaseEntity.w6 = w6; // pff
    window.w6Cheat = { api, navigate: (url: string) => w6.navigate(url) };
    Container.instance.registerSingleton(W6, () => w6);
    if (Tools.env > Tools.Environment.Staging) window.w6Debug = { w6, container: Container.instance };

    LogManager.addAppender(getInstance<LogAppender>(LogAppender));
    const eh = getInstance<GlobalErrorHandler>(GlobalErrorHandler);
    // window.addEventListener("error", (e: ErrorEvent) => { eh.handleWindowError(e.message, e.filename, e.lineno, e.colno, e.error); });
    let existing = window.onerror;
    window.onerror = (message, file, line, col, error?) => {
      eh.handleWindowError(message, file, line, col, error);
      if (existing) (<any> existing)(message, file, line, col, error);
    };

    if (w6.enableBasket) { (<any> client).connection.promise().catch(x => { /* Ignore */ }); } // kick off the connection early

    await bootAngular(w6);
  }

  async function startApp() {
    Tools.Debug.log("AURELIA: starting app");
    let app = await aurelia.start();
    Tools.Debug.log("AURELIA: app started");
    await app.setRoot();
  }
}

// Does not catch mixed-in variants for obvious reasons..
export class LoggingEventAggregator extends EventAggregator {
  publish(x, y) {
    Tools.Debug.log("$AUR.EA.publish", x, y);
    super.publish(x, y);
  }
  subscribe(x, y) {
    Tools.Debug.log("$AUR.EA.subscribe", x.name || x, y.name);
    return super.subscribe(x, y);
  }
}

export class ContainerSetup {
  constructor(private instance: Container) {
    if (instance == null) { throw "instance null"; }
    this.instance.registerTransient(UiContext);
    if (Tools.env > Tools.Environment.Staging) { this.instance.registerSingleton(EventAggregator, () => new LoggingEventAggregator()); }

    this.instance.registerSingleton(Mediator,
      () => new ErrorLoggingMediatorDecorator(
        new InjectingMediatorDecorator(
          new Mediator(x => instance.get(x)),
          this.instance.get(W6)
        ),
        this.instance.get(Toastr)
      )
    );
  }
}
