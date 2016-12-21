import {
  BasketService, Client, ClientMissingHandler, CloseTabs, ConnectionState, ContentDeleted, GameChanged, GameClientInfo,
  IMiniClientInfo, IUserError, LS, MenuItem, StateChanged, Tools, UiContext, ViewModel, W6, uiCommand2,
} from "./framework";

import {
  OpenAddModDialog, OpenAddModsToCollectionsDialog, OpenCreateCollectionDialog, OpenSettings, RestoreBasket, RouteHandler, Test,
} from "./services/api";
import { Login } from "./services/auth";
import { LoginBase, LoginUpdated } from "./services/auth-base";
import { RenderService } from "./services/renderer/render-service";

import { GameBaskets } from "./features/game-baskets";
import { AddModsToCollections } from "./features/games/add-mods-to-collections";
import { CreateCollectionDialog } from "./features/games/collections/create-collection-dialog";
import { BetaDialog } from "./features/games/servers/beta-dialog";
import { GetClientDialog } from "./features/games/get-client-dialog";
import { HostServer } from "./features/games/servers/host-server";
import { ServerRender } from "./features/games/servers/server-render";
import { FeaturesModule } from "./features/index";
import { Finalize } from "./features/login/finalize";
import { MessageDialog } from "./features/message-dialog";
import { EditDependency } from "./features/profile/content/edit-dependency";
import { NewGroupDialog } from "./features/profile/groups/new-group-dialog";
import { Index as SettingsIndex } from "./features/settings/index";
import { EditPlaylistItem } from "./features/side-bar/playlist/edit-playlist-item";
import { SideBar } from "./features/side-bar/side-bar";
import { RsideBar } from "./features/rside-bar/rside-bar";
import { TopBar } from "./features/top-bar/top-bar";
import { UserErrorDialog } from "./features/user-error-dialog";

import { Container, TaskQueue, inject } from "aurelia-framework";
import { HttpClient } from "aurelia-http-client";
import { Origin } from "aurelia-metadata";
import { NavigationInstruction, Redirect, Router, RouterConfiguration } from "aurelia-router";
import { BindingSignaler } from "aurelia-templating-resources";

@inject(UiContext, HttpClient, Login, RouteHandler, TaskQueue, Client, BasketService, LS, ClientMissingHandler, BindingSignaler, FeaturesModule)
export class App extends ViewModel {
  newVersionInterval;
  modules: any[];
  router: Router;
  original: boolean;
  first: boolean;
  firefoxTimeoutPassed = false;
  breadcrumbs: { title: string, path: string }[];
  gameInfo: GameClientInfo = new GameClientInfo(undefined, undefined, undefined);
  game: { id: string; slug: string } | { id: null; slug: null } = { id: null, slug: null };
  template = "v2";
  userMenuItems = [];
  dialogMap = [];
  isApiBusy = false;
  openSettings = uiCommand2("Settings", async () => this.navigateInternal("/me/settings"));
  openLibrary = uiCommand2("Library", async () => this.navigateInternal("/me"));
  openFriends = uiCommand2("Friends", async () => this.navigateInternal("/me/friends"));
  openMessages = uiCommand2("Messages", async () => this.navigateInternal("/me/messages"));
  openLogout = uiCommand2("Logout", async () => this.login.logout());
  sideBar: SideBar;
  rsideBar: RsideBar;
  topBar: TopBar;
  newAppVersionAvailable: boolean;

  get clientInfo() { return this.gameInfo.clientInfo; };
  get userErrors() { return this.clientInfo.userErrors; }
  get showFirefoxNotice() {
    return this.w6.isFirefox && this.w6.settings.downloadedSync && this.firefoxTimeoutPassed
      && !this.w6.miniClient.isConnected && !this.basketService.hasConnected;
  }

  get currentRoute() { return this.router.currentInstruction; }
  get shouldFinalizeAccount() { return this.isLoggedIn && (!this.w6.userInfo.emailConfirmed && !this.w6.userInfo.passwordSet); };
  get shouldConfirmEmail() { return this.isLoggedIn && (!this.w6.userInfo.emailConfirmed && this.w6.userInfo.passwordSet); }

  get overlayShown() {
    return (this.topBar && this.topBar.search.showResults)
      || (this.sideBar && this.sideBar.selectedTab && this.sideBar.selectedTab.type != "dropdown")
      || (this.topBar && this.topBar.selectedTab && this.topBar.selectedTab.type != "dropdown");
  }

  get classes() {
    return `${this.w6.renderAds ? null : "no-adds"} ${this.w6.miniClient.isConnected ? "client-active" : null} ${this.w6.miniClient.isConnected && this.gameInfo.isLocked ? "client-busy" : null} ${this.isApiBusy ? "api-busy" : ""} ${this.w6.userInfo.id ? "logged-in" : null} ${window.location.pathname.startsWith("/errors") ? "is-error" : ""}`;
  }
  get isNavigating() { return this.router.isNavigating; }
  get isRequesting() { return this.login.isRequesting; }
  get showSidebar() { return this.w6.enableBasket; }

  get tabActive() { return (this.sideBar && this.sideBar.selectedTab) || (this.topBar && this.topBar.selectedTab) || (this.rsideBar && this.rsideBar.selectedTab); }
  get tabAsTabActive() {
    const side = this.sideBar && this.sideBar.selectedTab;
    const top = this.topBar && this.topBar.selectedTab;
    const rside = this.rsideBar && this.rsideBar.selectedTab;
    return (side && side.type !== "dropdown") || (top && top.type !== "dropdown")
      || (rside && rside.type !== "dropdown");
  }


  get obsoleteClientVersion() {
    let mc = this.w6.miniClient;
    return mc.isConnected && mc.clientInfo.updateState <= 1
      && mc.clientInfo.version && (this.tools.versionCompare(mc.clientInfo.version, "1.0.15") === -1);
  }
  get showSlogan() { return this.w6.url.site === "main" && this.w6.url.isRoot; }

  constructor(ui: UiContext, public http: HttpClient, private login: Login, private routeHandler: RouteHandler,
    private taskQueue: TaskQueue, private client: Client, private basketService: BasketService, private ls: LS,
    private clientMissingHandler: ClientMissingHandler, private signaler: BindingSignaler, featuresModule: FeaturesModule) {
    super(ui);
    this.modules = [featuresModule];
    this.original = this.w6.enableBasket;
    this.breadcrumbs = this.setupBreadcrumbs();
    this.w6.openLoginDialog = evt => { if (evt) { evt.preventDefault(); } return this.login.login(); };
    this.w6.logout = () => this.logout();
    setInterval(() => signaler.signal("timeago"), 60 * 1000);
    this.w6.api.openGeneralDialog = (model: { model; viewModel: string }) => {
      return this.dialog.open({ model, viewModel: "features/general-dialog" });
    };

    let rs: RenderService = Container.instance.get(RenderService);
    this.w6.api.render = (options) => rs.open(options);

    this.w6.api.createGameBasket = (gameId, basketModel) => {
      let gm = Container.instance.get(GameBaskets);
      gm.activate(gameId, basketModel);
      return gm;
    };
    // this.eventBus.subscribe('router:navigation:processing', () => console.log("$$$ processing route"));
    if (Tools.env > Tools.Environment.Staging) { window.w6Debug.app = this; }
    // this.eventBus.subscribe('router:navigation:complete', () => console.log("$$$ complete route"));
  }

  activate() {
    if (this.hasApi) {
      window.onbeforeunload = () => {
        this.tools.Debug.warn("Tried to unload, prevented", window.location.href);
        return false;
      };
    }

    this.activateNg();

    let w = <any>window;
    if (Tools.env >= Tools.Environment.Staging && w.api) {
      let test = Container.instance.get(Test);
      w.test = test;
    }

    // workaround for dialogs not working
    Origin.set(SettingsIndex, { moduleId: "features/settings/index", moduleMember: "Index" });
    Origin.set(CreateCollectionDialog, {
      moduleId: "features/games/collections/create-collection-dialog", moduleMember: "CreateCollectionDialog"
    });
    Origin.set(AddModsToCollections, { moduleId: "features/games/add-mods-to-collections", moduleMember: "AddModsToCollections" });
    Origin.set(EditDependency, { moduleId: "features/profile/content/edit-dependency", moduleMember: "EditDependency" });
    Origin.set(EditPlaylistItem, { moduleId: "features/side-bar/playlist/edit-playlist-item", moduleMember: "EditPlaylistItem" });
    Origin.set(NewGroupDialog, { moduleId: "features/profile/groups/new-group-dialog", moduleMember: "NewGroupDialog" });
    Origin.set(UserErrorDialog, { moduleId: "features/user-error-dialog", moduleMember: "UserErrorDialog" });
    Origin.set(MessageDialog, { moduleId: "features/message-dialog", moduleMember: "MessageDialog" });
    Origin.set(Finalize, { moduleId: "features/login/finalize", moduleMember: "Finalize" });
    Origin.set(BetaDialog, { moduleId: "features/games/servers/beta-dialog", moduleMember: "BetaDialog" });
    Origin.set(GetClientDialog, { moduleId: "features/games/get-client-dialog", moduleMember: "GetClientDialog" });
    Origin.set(HostServer, { moduleId: "features/games/servers/host-server", moduleMember: "HostServer" });
    Origin.set(ServerRender, { moduleId: "features/games/servers/server-render", moduleMember: "ServerRender" });

    let isSync = window.location.search.includes("sync=1") ? true : false;
    if (isSync) { this.w6.updateSettings(x => x.hasSync = true); }
    this.template = "v2";
    if (window.location.pathname === "/plugin") { this.template = "plugin"; }

    this.userMenuItems.push(new MenuItem(this.openSettings));
    if (!this.features.library) { this.userMenuItems.push(new MenuItem(this.openLibrary)); }
    this.userMenuItems.push(new MenuItem(this.openFriends));
    this.userMenuItems.push(new MenuItem(this.openMessages));
    this.userMenuItems.push(new MenuItem(this.openLogout));

    setTimeout(async () => {
      this.firefoxTimeoutPassed = true;
      if (!this.w6.settings.hasSync && (this.w6.miniClient.isConnected || this.basketService.hasConnected)) {
        this.w6.updateSettings(x => x.hasSync = true);
      }
      // TODO: put it on a connected handler?
      if (!this.w6.miniClient.isConnected && this.w6.settings.hasSync && this.features.clientAutostart) {
        await this.clientMissingHandler.addClientIframe(true);
      }
    }, 15 * 1000);

    this.w6.navigate = (url: string) => this.navigateInternal(url);
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe("router:navigation:error", async (x) => {
        // TODO: This seems to be a fatal error... Must refresh completely to fix!
        if (!x.result || !x.result.output) { return this.redirectToError(500); }
        let err: Error = x.result.output;
        // TODO: Or better to rethrow higher up?
        if (err instanceof Tools.NotFoundException) {
          return this.redirectToError(404);
        }
        if (err instanceof Tools.Forbidden) { return this.redirectToError(403); }
        if (err instanceof Tools.RequiresLogin
          || err instanceof Tools.LoginNoLongerValid) { return await this.login.login(); }
        return this.redirectToError(500);
      }));

      // TODO: we might be better off abstracting this away in a service instead,
      // so that we dont have all these eventclasses laying around just for interop from Angular...
      d(this.eventBus.subscribe(RestoreBasket, this.restoreBasket));
      d(this.eventBus.subscribe(OpenCreateCollectionDialog, this.openCreateCollectionDialog));
      d(this.eventBus.subscribe(OpenAddModDialog, this.openAddModDialog));
      d(this.eventBus.subscribe(OpenAddModsToCollectionsDialog, this.openAddModsToCollectionsDialog));
      d(this.eventBus.subscribe(LoginUpdated, this.loginUpdated));
      d(this.eventBus.subscribe(OpenSettings, this.openClientSettings));
      d(this.toProperty(this.whenAnyValue(x => x.isRequesting)
        .combineLatest(this.whenAnyValue(x => x.isNavigating), (api, router) => api || router)
        .debounceTime(250), x => x.isApiBusy));
      d(this.whenAnyValue(x => x.currentRoute).subscribe(_ => this.signaler.signal("router-signal")));
      d(this.whenAnyValue(x => x.isNavigating)
        .skip(1)
        .filter(x => !x)
        .subscribe(this.notifyAngularInternal));

      d(this.whenAnyValue(x => x.overlayShown)
        .subscribe(x => {
          if (x) {
            $("body").addClass("overlay-shown");
          } else {
            $("body").removeClass("overlay-shown");
          }
        }));

      const changed = this.appEvents.gameChanged;
      d(changed.subscribe(info => this.w6.setActiveGame({ id: info.id, slug: info.slug })));
      d(changed
        .filter(game => game && game.id && game.isPageChange && this.w6.miniClient.isConnected)
        .concatMap(game => this.client.selectGame(game.id))
        .subscribe());
      d(changed.startWith(this.w6.activeGame)
        .do(this.gameChanged)
        .filter(x => !!x.id)
        .switchMap(game => this.basketService.getGameInfo(game.id))
        .subscribe(x => this.gameInfo = x));
      d(this.clientWrapper.stateChanged
        .startWith(<StateChanged>{ newState: this.client.isConnected ? ConnectionState.connected : null })
        .filter(state => state.newState === ConnectionState.connected)
        .subscribe(state => this.infoReceived(this.client.clientInfo)));
      const userErrors = this.whenAnyValue(x => x.userErrors).filter(x => x != null);
      d(userErrors.subscribe(_ => {
        // close all open dialogs when userErrors get replaced
        this.dialogMap.forEach(id => {
          this.eventBus.publish("client.userErrorResolved", { id });
          this.tools.removeEl(this.dialogMap, id);
        });
      }));
      d(userErrors.flatMap(x => x)
        .merge<IUserError>(this.clientWrapper.userErrorAdded.map(x => x.userError))
        .subscribe(x => { if (!this.dialogMap.some(id => id === x.id)) { this.showUserErrorDialog(x); } }));
      d(this.eventBus.subscribe('router:navigation:complete', _ => this.w6.scrollTo(0, 600)));
    });

    this.loginLegacyClient({ accessToken: this.w6.userInfo.id ? window.localStorage.getItem(LoginBase.token) : null });
    if (this.w6.enableBasket) { this.client.getInfo().catch(x => { /* Ignore */ }); } // instead of connection.promise();
    $("body").attr("style", "");

    if (this.w6.url.version) {
      this.checkVersion();
      this.newVersionInterval = setInterval(() => this.checkVersion(), 15 * 60 * 1000);
    }

    this.ls.on("w6.event", (v, old, url) => this.raiseCrossEvent(v.name, v.data));
    window.addEventListener("keydown", this.myKeypressCallback, false);

    if (this.shouldFinalizeAccount && !this.w6.settings.remindedFinalize) {
      this.w6.updateSettings(x => {
        this.finalizeAccount();
        x.remindedFinalize = true;
      });
    }
  }

  finalizeAccount = () => this.dialog.open({ viewModel: Finalize });
  gameChanged = async (info: GameChanged) => {
    if (this.game.id === info.id) { return; }
    this.game.id = info.id;
    this.game.slug = info.slug;
  }
  openClientSettings = (evt: OpenSettings) => this.dialog.open({ viewModel: SettingsIndex, model: evt.model })
  openCreateCollectionDialog = (event: OpenCreateCollectionDialog) =>
    this.requireLoggedIn(() => this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: event.game } }));
  openAddModsToCollectionsDialog = (event: OpenAddModsToCollectionsDialog) =>
    this.requireLoggedIn(() =>
      this.dialog.open({
        viewModel: AddModsToCollections, model: { gameId: event.gameId, mods: event.mods, collections: event.collections }
      }));
  openAddModDialog = (event: OpenAddModDialog) => this.requireLoggedIn(() =>
    this.legacyMediator.openAddModDialog(event.game.slug, event.info))

  infoReceived = (info: IMiniClientInfo) => {
    // TODO: Parse version + semver info,
    // TODO: Retrieve and store latest infos for each branch, by periodically getting the info from the withsix.com CDN?
    // TODO: Perhaps use this rather as last resort. but rather have the info query include if the client is uptodate ;-)
    // newVersion = "1.0.0-beta201507091";
    // if (info.version != newVersion) {
    // this.newVersionAvailable(newVersion);
    // }
    if (this.client.currentVersion >= "3") {
      this.client.login({ accessToken: this.w6.userInfo.id ? window.localStorage.getItem(LoginBase.token) : null });
    }

    if (info.newVersionAvailable != null) { this.newVersionAvailable(info.newVersionAvailable); }
  };

  newVersionAvailable = newVersion => {
    if (window.location.href.includes("/update")) { return; }
    setTimeout(() => {
      this.toastr.info(
        `Client v${newVersion} is available for download, click here to update now.`,
        "Sync Update available!", {
          timeOut: 10 * 1000,
        }).then(x => x ? this.navigateInternal("/update") : "");
    }, 3000);
  };

  requireLoggedIn = async (act: () => Promise<any>) => {
    if (this.w6.isLoggedIn) { return await act(); }
    if (await this.toastr.warning("To continue this action you have to login", "Login Required")) {
      this.w6.openLoginDialog(null);
    }
  }
  restoreBasket = () => this.w6.enableBasket = this.original;
  loginUpdated = (evt: LoginUpdated) => {
    let info = { accessToken: evt.accessToken };
    if (this.client.isConnected && this.client.currentVersion >= "3") { this.client.login(info); }
    this.loginLegacyClient(info);
  }

  redirectToError(statusCode: number) {
    return this.router.navigate(`/errors/${statusCode}?resource=${encodeURIComponent(window.location.href)}#initial=1`);
  }

  async showUserErrorDialog(userError: IUserError) {
    this.dialogMap.push(userError.id);
    await this.dialog.open({ model: userError, viewModel: UserErrorDialog, lock: true });
    // TODO: What about reshowing when closed prematurely??
    this.tools.removeEl(this.dialogMap, userError.id);
  }

  myKeypressCallback = ($event: KeyboardEvent) => {
    if ($event.keyCode === 27) { // escape
      this.closeTabs();
    }
  }

  raiseCrossEvent(name: string, data: any) {
    switch (name) {
      case "content-deleted": { this.eventBus.publish(new ContentDeleted(data.gameId, data.id)); break; }
      case "login": { if (!this.w6.userInfo) { this.login.handleUserUpgrade(); break; } }
      case "logout": { if (this.w6.userInfo) { this.w6.reload(); break; } }
      case "refresh-playlist": { this.basketService.refresh(); this.sideBar.refreshPlaylist(); }
      default: { }
    }
  }

  setTemplate(template: string) {
    this.template = template;
    this.w6.updateSettings(x => x.template = template);
  }

  deactivate() {
    window.removeEventListener("keypress", this.myKeypressCallback);
  }

  activateNg() {
    if (!this.first) {
      let iv = setInterval(() => {
        if (this.w6.aureliaReady) { return; }
        let row = angular.element("#root-content-row");
        if (row.length === 0) { return; }
        clearInterval(iv);
        this.tools.Debug.log("activating ng from app..");
        let el = angular.element("#content");
        row.append(el);
        this.w6.aureliaReady = true;
      }, 100);
      this.first = true;
    }
    return null;
  }

  closeTabs() {
    this.eventBus.publish(new CloseTabs());
    return true;
  }

  async checkVersion() {
    let version = await this.http.get(this.w6.url.cdn + "/volatile/version2.json");
    let newVersion = version.content.version;
    if (this.w6.url.version !== newVersion) {
      this.newAppVersionAvailable = true;
      clearInterval(this.newVersionInterval);
    }
  }

  refresh() { this.w6.reload(); }

  // TODO: https://identityserver.github.io/Documentation/docs/endpoints/endSession.html
  logout() { return this.login.logout(); }

  loginLegacyClient(info: { accessToken: string }) {
    if (window.six_client) {
      if (window.six_client.login) {
        try {
          window.six_client.login(info.accessToken);
        } catch (err) {
          this.tools.Debug.error("error while logging in client", err);
        }
      }
    }
  }

  setupBreadcrumbs() {
    let path = [];
    let breadcrumbs = [];

    if (this.w6.url.site && this.w6.url.site != "main") {
      breadcrumbs.push({
        title: this.w6.url.siteTitle,
        path: this.w6.url[this.w6.url.site],
      });
    }

    let pathname = window.location.pathname.trim();
    if (pathname === "/") { return breadcrumbs; }

    pathname.split("/").forEach(x => {
      if (!x) { return; }
      path.push(x);
      let joinedPath = "/" + path.join("/");
      breadcrumbs.push({
        title: x,
        path: pathname === joinedPath ? null : joinedPath,
      });
    });

    return breadcrumbs;
  }

  async configureRouter(config: RouterConfiguration, router: Router) {
    config.title = "withSIX";
    config.options.pushState = true;
    config
      .addPipelineStep("authorize", SslStep)
      .addPipelineStep("authorize", AuthorizeStep)
      .addPipelineStep("postcomplete", {
        run: (context, next) => {
          this.breadcrumbs = this.setupBreadcrumbs();
          return next();
        },
      });

    let site = this.w6.url.site || "main";
    await this.routeHandler.configure(site);
    let map = (instruction: NavigationInstruction): any => {
      this.tools.Debug.log("$$ AURELIA: Mapping unknown route for site: " + site, instruction);
      let match = this.routeHandler.getRouteMatch(instruction.fragment);
      if (!match) {
        this.tools.Debug.warn("$$ AURELIA: did not found match in routing map! 404", instruction, this.routeHandler.routingData[site]);
        return "errors/404";
      }

      if (match.type === "aurelia") {
        this.tools.Debug.error("$$$ AURELIA: Found aurelia unmatched route, must be error?!", match, instruction);
        return "errors/404";
      }

      if (!match.type || match.type === "angular") {
        this.tools.Debug.log("$$ AURELIA: found angular match!", instruction);
        return "features/pages/angular";
      }
      if (match.type === "static") {
        if (match.redirectTo) {
          this.tools.Debug.log("$$ AURELIA: found static redirect!", instruction);
          return { redirect: match.redirectTo };
        }
        this.tools.Debug.log("$$ AURELIA: found static page!", instruction);
        return "features/pages/static";
      }
      throw new Error("Unsupported routing state");
    };
    config.mapUnknownRoutes(map);
    this.modules.forEach(m => m.configureRouter(config, router));
    this.router = router;
  }
}

@inject(Login, TaskQueue)
class AuthorizeStep {
  get tools() { return Tools; }
  constructor(public login: Login, private taskQueue: TaskQueue) { }
  run(routingContext: NavigationInstruction, next) {
    if (routingContext.getAllInstructions().some((i: any) => {
      return i.config.auth;
    })) {
      let isLoggedIn = this.login.authService.isAuthenticated();
      if (!isLoggedIn) {
        // var loginRoute = this.auth.getLoginRoute();
        // return next.cancel(new Redirect(loginRoute));
        this.taskQueue.queueMicroTask(() => {
          // var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
          this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
        });
        return next.cancel();
      }
    }

    return next();
  }
}

@inject(RouteHandler, W6, Login, TaskQueue)
class SslStep extends AuthorizeStep {
  constructor(private routeHandler: RouteHandler, private w6: W6, login: Login, taskQueue: TaskQueue) { super(login, taskQueue); }
  run(routingContext: NavigationInstruction, next) {
    let matches = routingContext.getAllInstructions().map(x => this.routeHandler.getRouteMatch(x.fragment)).filter(x => x != null);
    if (matches.length === 0) return next();

    let isLoggedIn = this.w6.userInfo.id ? true : false;
    if (!isLoggedIn && matches.some(x => x.auth)) {
      // We only do this here because we have also non Aurelia routes with auth requirements..
      setTimeout(() => {
        // var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
        this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
      });
      return next.cancel();
    }

    if (this.w6.userInfo.failedLogin) {
      setTimeout(() => {
        // var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
        this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
      });
      return next();
    }

    let isHttps = window.location.protocol === "https:";
    let isPremium = this.w6.userInfo.isPremium;
    if (isHttps) {
      if (!isPremium && matches.every(x => !x.ssl)) {
        // Problem: We don't know if we got redirected for premium purposes, or because of required SSL, so hm
        if (this.w6.redirected && !isLoggedIn) {
          setTimeout(() => {
            // var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
            this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
          });
          return next.cancel();
          // var loginRoute = this.auth.getLoginRoute();
          // return next.cancel(new Redirect(loginRoute));
        }
        this.tools.Debug.log("$$$ SslStep: Using SSL, but is not premium, nor page requires SSL. Switching to non-SSL");
        return next.cancel(this.getRedirect(LoginBase.toHttp(isLoggedIn)));
      }
    } else {
      let requiresSsl = matches.some(x => x.ssl);
      if (isPremium || requiresSsl) {
        this.tools.Debug.log("$$$ SslStep: Using non-SSL, but is premium or page requires SSL. Switching to SSL", isPremium);
        return next.cancel(this.getRedirect(LoginBase.toHttps(isLoggedIn)));
      }
    }
    if (this.w6.redirected && !isLoggedIn && this.w6.redirectedWasLoggedIn) {
      setTimeout(() => {
        // var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
        this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
      });
      return next.cancel();
    }
    return next();
  }

  getRedirect(url) {
    this.tools.Debug.log("$$$ router redirect", url);
    this.login.resetUnload();
    return new Redirect(url);
  }
}
