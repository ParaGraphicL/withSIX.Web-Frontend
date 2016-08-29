import breeze from 'breeze-client';

import {IBreezeMod, IBreezeUser, IBreezeCollection, IBreezeMission, IBreezeCollectionVersionDependency, IBreezePost, IBreezeModUpdate, IBreezeCollectionVersion, IBreezeGame, IBreezeAWSUploadPolicy,
  IBreezeMissionComment, IBreezeMissionVersion, IBreezeCollectionImageFileTransferPolicy, IBreezeModInfo,
  IBreezeCollectionComment, IBreezePostComment, AbstractDefs, BreezeInitialzation, IBreezeModUserGroup, IBreezeModComment, IBreezeModImageFileTransferPolicy,
  IBreezeModMediaItem, IUserInfo, Resource, Permission, Role,
  EntityExtends, BreezeEntityGraph, _IntDefs} from '../services/dtos';

import {LegacyMediator} from '../services/mediator';
import {ModHelper, CollectionHelper, MissionHelper} from '../services/helpers';

import {RestoreBasket, OpenCreateCollectionDialog, OpenAddModDialog, OpenAddModsToCollectionsDialog} from '../services/api';
import {ForkCollection} from '../features/profile/content/collection';
import {W6, W6Urls, globalRedactorOptions} from '../services/withSIX';
import {Tools} from '../services/tools';
import {W6Context, IQueryResult, BooleanResult, Result} from '../services/w6context';
import {Tk} from '../services/legacy/tk'
import {IRootScope, IMicrodata, IPageInfo, IBaseScope, IBaseScopeT, IHaveModel, DialogQueryBase, DbCommandBase, DbQueryBase, BaseController, BaseQueryController, DialogControllerBase, ModelDialogControllerBase } from './app-base'
import {ITagKey, ICreateComment, ICQWM, IModel, IMenuItem, IHandleCommentsScope} from '../services/legacy/base'
import { Publisher } from '../services/apis/lib';
import {EventAggregator} from 'aurelia-event-aggregator';

import {Mediator} from 'aurelia-mediator';
import {Client, IClientInfo, ItemState} from 'withsix-sync-api';

import {IBasketItem, BasketItemType} from '../services/legacy/baskets';
import {BasketService} from '../services/basket-service';
import {ModsHelper, Helper} from '../services/legacy/misc';
import {ToastLogger} from '../services/legacy/logger';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';
import {joinUri} from '../helpers/utils/url'

import { app, registerCQ, registerService, registerController, IBaseGameScope, IContentScopeT } from './play.ts'
import { GetForumPostQuery, ModExistsQuery, ModNameExistsQuery, GetLatestInfo, GetModTagsQuery } from './mods';
import { OpenTermsDialogQuery } from './components';

//export interface IMultiPageDialogScope extends IBaseScope {
//    page: string;
//}

export interface IGameScope extends IBaseScopeT<IBreezeGame>, IBaseGameScope { }



export interface IAddCollectionDialogScope extends IMultiPageDialogScope {
  model;
  claimToken: string;
  cancel: Function;
  ok: Function;
  verifyToken: Function;
  verificationFailed: Boolean;
  formatProvider: string;
  error: string;
  hasHomepageUrl: boolean;
  copy: () => void;
  reload: () => void;
  okNew: () => void;
  okImport: () => void;
  quote: string;
  folderPattern: RegExp;
  versionPattern: RegExp;
  openTerms: () => void;
  addDependency: (data) => boolean;
  removeDependency: (data) => void;
  getDependencies: (query) => any;
  gameName: string;
  hints: any;
  checkingPackageName: boolean;
  inlineHints: any;
  branches: { displayName: string; value: string }[];
  getForumPost: () => any;
  checkingDownloadLink: boolean;
  importResult: string[];
}

export class AddCollectionDialogController extends DialogControllerBase {
  static $name = 'AddCollectionDialogController';
  static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game'];
  static $viewBaseFolder = '/src_legacy/app/play/games/stream/dialogs/';
  private $viewBaseFolder = AddCollectionDialogController.$viewBaseFolder;
  private $newViewBaseFolder = this.$viewBaseFolder + 'add-collection-new/';
  private $importViewBaseFolder = this.$viewBaseFolder + 'add-collection-import/';
  static $view = AddCollectionDialogController.$viewBaseFolder + 'add-collection-dialog.html';
  private $subViewBaseFolder: string;
  private authorSubmission = false;

  constructor(public $scope: IAddCollectionDialogScope, logger, private $routeParams, private $location: ng.ILocationService, $modalInstance, $q, private $timeout: ng.ITimeoutService, private model: IBreezeGame) {
    super($scope, logger, $modalInstance, $q);
    this.$subViewBaseFolder = this.$viewBaseFolder;
    $scope.cancel = this.cancel;
    $scope.ok = this.ok;
    $scope.okNew = this.okNew;
    $scope.okImport = this.okImport;
    $scope.model = {
      gameId: model.id,
      uri: null
    };

    $scope.gameName = model.name;
    $scope.page = this.$subViewBaseFolder + 'add-collection-1.html';
    $scope.quote = this.getQuote();
    $scope.openTerms = () => $scope.request(OpenTermsDialogQuery);
    $scope.hints = AddModDialogController.hints;
    $scope.inlineHints = AddModDialogController.inlineHints;
  }

  private getQuote = (): string => {
    var arr = [
      "A good mod can be part of a great many"
    ];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  private cancel = () => this.$modalInstance.close();
  private reload = () => this.$scope.w6.reload();

  private ok = async () => {
    var data = this.$scope.model;
    if ((<string>data.uri).endsWithIgnoreCase("config.yml")) {
      await this.$scope.request<{ data: any[] }>(NewImportedCollectionCommand, { data: data })
        .then(result =>
          this.applyIfNeeded(() => {
            if (result.data.length == 1) {
              var modId = result.data[0].toShortId();
              this.$modalInstance.close();
              //var slug = <string>data.name.sluggifyEntityName();
              this.$location.path(joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
            } else {
              this.$scope.importResult = [];
              for (var i = 0; i < result.data.length; i++) {
                this.$scope.importResult[i] = joinUri([this.$scope.url.play, this.model.slug, "collections", result.data[i].toShortId(), "slug"]);
              }
              this.$scope.page = this.$newViewBaseFolder + 'add-collection-3.html';
            }
          })
        )
        .catch(this.httpFailed);
    } else {
      await this.$scope.request<{ data: string }>(NewMultiImportedCollectionCommand, { data: data })
        .then(result => {
          var modId = result.data.toShortId();
          this.$modalInstance.close();
          //var slug = <string>data.name.sluggifyEntityName();
          this.$location.path(joinUri([this.$scope.url.play, this.model.slug, "collections", modId, "slug"])).search('landingrepo', 1);
        })
        .catch(this.httpFailed);
    }
  };

  private okNew = () => {
    this.$subViewBaseFolder = this.$newViewBaseFolder;
    this.$scope.page = this.$newViewBaseFolder + 'add-collection-2.html';
  };

  donePre: boolean = false;

  private okImport = () => {
    this.$subViewBaseFolder = this.$importViewBaseFolder;

    this.$scope.page = this.$importViewBaseFolder + 'add-collection-2.html';
  };

  public static hints = {
    example: "exmaple text"
  };

  public static inlineHints = {
    repoLink: "Must not be empty and must start with 'http://'"
  };
}

registerController(AddCollectionDialogController);

export interface IMultiPageDialogScope extends IBaseScope {
  page: string;
}

export interface IAddModDialogScope extends IMultiPageDialogScope {
  model: {
    mod: {
      download: string;
      branch: string;
      versionUnknown: boolean;
      packageName: string;
      groupId: string;
      name?: string;
      author?: string;
      description?: string;
      version?: string;
      gameSlug: string;
      homepage?: string;
      tags?: string[];
    },
    info: {
      type: string;
      folder: string;
      userName: string;
      password: string;
    },
    acceptToS: boolean;
    amAuthor: boolean;
    packageNameAvailable: boolean;
    nameAvailable: boolean;
    downloadLinkAvailable: boolean;
  }
  claimToken: string;
  cancel: Function;
  ok: Function;
  verifyToken: Function;
  verificationFailed: Boolean;
  formatProvider: string;
  error: string;
  hasHomepageUrl: boolean;
  copy: () => void;
  reload: () => void;
  ok_user: () => void;
  ok_author: () => void;
  quote: string;
  folderPattern: RegExp;
  versionPattern: RegExp;
  openTerms: () => void;
  addDependency: (data) => boolean;
  removeDependency: (data) => void;
  getDependencies: (query) => any;
  gameName: string;
  hints: any;
  checkingPackageName: boolean;
  checkingName: boolean;
  inlineHints: any;
  branches: { displayName: string; value: string }[];
  getForumPost: () => any;
  checkingDownloadLink: boolean;
  showExtension: boolean;
  installExtension: () => Promise<void>;
}

export interface IModVersionInfo {
  name: string;
  author: string;
  version: string;
  branch: string;
  url: string;
  downloadUrl: string;
  description: string;
  tags: string[];
}

export class AddModDialogController extends DialogControllerBase {
  static $name = 'AddModDialogController';
  static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game', 'info', 'aur.client', 'dbContext'];
  static $viewBaseFolder = '/src_legacy/app/play/games/stream/dialogs/';
  private $viewBaseFolder = AddModDialogController.$viewBaseFolder;
  private $userViewBaseFolder = this.$viewBaseFolder + 'add-mod-user/';
  private $authorViewBaseFolder = this.$viewBaseFolder + 'add-mod-author/';
  static $view = AddModDialogController.$viewBaseFolder + 'add-mod-dialog.html';
  private $subViewBaseFolder: string;
  private authorSubmission = false;

  constructor(public $scope: IAddModDialogScope, logger, private $routeParams, private $location: ng.ILocationService, $modalInstance, $q, private $timeout: ng.ITimeoutService, private model: IBreezeGame, private info: { type?: string, folder?: string, groupId?: string }, private modInfoService, private dbContext: W6Context) {
    super($scope, logger, $modalInstance, $q);
    this.$subViewBaseFolder = this.$viewBaseFolder;
    $scope.cancel = this.cancel;
    $scope.ok = this.ok;
    $scope.ok_user = this.ok_user;
    $scope.ok_author = this.ok_author;
    $scope.showExtension = $scope.w6.miniClient.clientInfo && !$scope.w6.miniClient.clientInfo.extensionInstalled;
    $scope.installExtension = () => {
      $scope.showExtension = false;
      return this.modInfoService.installExplorerExtension();
    }
    $scope.model = {
      mod: {
        download: null,
        branch: "",
        versionUnknown: false,
        packageName: "",
        groupId: info.groupId,
        gameSlug: this.model.slug
      },
      info: {
        type: info.type || "download",
        folder: info.folder || "",
        userName: Tools.Password.generate(128),
        password: Tools.Password.generate(128)
      },
      acceptToS: false,
      amAuthor: false,
      packageNameAvailable: false,
      nameAvailable: false,
      downloadLinkAvailable: false
    };
    $scope.branches = AddModDialogController.branches;
    $scope.checkingPackageName = false;
    $scope.checkingDownloadLink = false;
    $scope.gameName = this.model.name;
    $scope.page = this.$subViewBaseFolder + 'add-mod-1.html';
    $scope.quote = this.getQuote();
    $scope.folderPattern = AddModDialogController.folderPattern;
    $scope.versionPattern = AddModDialogController.versionPattern;

    this.setupDependencyAutoComplete();
    Tools.Debug.log(model);

    $scope.hints = AddModDialogController.hints;

    $scope.inlineHints = AddModDialogController.inlineHints;

    $scope.$watch("model.mod.packageName", (newValue: string, oldValue: string, scope) => {
      if (newValue != oldValue && newValue != null && newValue != "")
        this.checkPackageName(newValue);
    });

    $scope.$watch("model.mod.name", (newValue: string, oldValue: string, scope) => {
      if (newValue != oldValue && newValue != null && newValue != "")
        this.checkName(newValue);
    });

    $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
      if (newValue != oldValue && newValue != null && newValue != "")
        this.checkDownloadLink(newValue);
    });

    $scope.getForumPost = () => this.requestAndProcessCommand<{ title; author; body }>(GetForumPostQuery, { forumUrl: $scope.model.mod.homepage }, 'fetch first post') // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
      .then(r => 
        this.applyIfNeeded(() => {
          $scope.model.mod.name = r.title;
          $scope.model.mod.author = r.author;
          //$scope.model.mod.description = r.body;
        })
      );

    //if (info.folder) {
    if ($scope.w6.userInfo.isAdmin) this.ok_user();
    else this.ok_author();
    //}
  }
  // todo; make part of commands
  selectFolder() {
    if (!this.$scope.w6.miniClient.isConnected) {
      alert("Please start the Sync client first, and make sure it is uptodate");
      return;
    }
    return this.modInfoService.prepareFolder().then(x => this.applyIfNeeded(() => this.$scope.model.info.folder = x));
  }
  upload(modId) {
    return this.modInfoService.uploadFolder({ folder: this.$scope.model.info.folder, userId: this.getUploadId(), gameId: this.model.id, contentId: modId, userName: this.$scope.model.info.userName, password: this.$scope.model.info.password })
      .then(x => this.dbContext.postCustom("mods/" + modId + "/finished-upload"));
  }

  getUploadId = () => this.$scope.model.mod.groupId || this.$scope.w6.userInfo.id;

  private getQuote = (): string => {
    var arr = [
      "Where all good stories start",
      "No good story survives a few tall tales",
      "The best never comes from one, but many",
      "All great content has humble beginnings"
    ];
    return arr[Math.floor(Math.random() * arr.length)];
  };
  private checkPackageName = (packageName: string) => {
    if (!packageName || (packageName.length < 3 || packageName.length > 150)) return;
    this.$scope.checkingPackageName = true;
    this.$scope.model.packageNameAvailable = false;
    return this.$scope.request<boolean>(ModExistsQuery, { packageName: packageName, groupId: this.$scope.model.mod.groupId, gameId: this.model.id })
      .then((result) =>
        this.applyIfNeeded(() => {
          this.$scope.checkingPackageName = false;
          Tools.Debug.log(result);
          this.$scope.model.packageNameAvailable = !result;
        })
      )
      .catch(this.httpFailed);
  }

  getAuthorId() { return this.authorSubmission ? this.$scope.w6.userInfo.id : this.$scope.w6.w6OBot }

  private checkName = (name: string) => {
    if (!name || (name.length < 3 || name.length > 150)) return;
    this.$scope.checkingName = true;
    this.$scope.model.nameAvailable = false;
    return this.$scope.request<boolean>(ModNameExistsQuery, { name: name, authorId: this.getAuthorId(), gameId: this.model.id })
      .then((result) =>
        this.applyIfNeeded(() => {
          this.$scope.checkingName = false;
          Tools.Debug.log(result);
          this.$scope.model.nameAvailable = !result;
        })
      )
      .catch(this.httpFailed);
  }

  checkDownloadLink(uri: string) {
    this.$scope.checkingDownloadLink = true;
    this.$scope.model.downloadLinkAvailable = false;
    return this.$scope.request<boolean>(GetCheckLinkQuery, { linkToCheck: uri })
      .then((result) =>
        this.applyIfNeeded(() => {
          this.$scope.checkingDownloadLink = false;
          Tools.Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result;
        })
      )
      .catch(this.httpFailed);
  }

  private cancel = () => this.$modalInstance.close();
  private reload = () => this.$scope.w6.reload();

  get type() {
    if (this.$scope.model.info.type == "upload")
      return 1;
    return 0;
  }

  getLatestInfo() {
    let model = this.$scope.model;
    return this.$scope.request<IModVersionInfo>(GetLatestInfo, { data: { downloadUri: model.mod.download } }).then(r =>
      this.applyIfNeeded(() => {
        model.mod.version = r.version;
        model.mod.branch = r.branch;
        if (!model.mod.name) model.mod.name = r.name;
        if (!model.mod.author) model.mod.author = r.author;
        if (!model.mod.homepage) model.mod.homepage = r.url;
        //if (!model.mod.description) model.mod.description = r.description;
        if (!model.mod.homepage) model.mod.download;
        model.mod.tags = r.tags;
      })
    );
  }

  private ok = async () => {
    // TODO: All or almost all should be validators on the form. The rest should be checked on the server so that people manipulating the Post, are still blocked
    if (!this.$scope.model.acceptToS || !this.$scope.model.packageNameAvailable || this.$scope.checkingPackageName)
      return;
    let shouldUpload = this.type == 1;
    if (shouldUpload) {
      this.$scope.model.mod.download = `rsync://${this.$scope.model.info.userName}:${this.$scope.model.info.password}@staging.sixmirror.com`;
    }

    if (!this.checkData(this.$scope.model.mod))
      return;
    if (!this.authorSubmission && !this.$scope.model.mod.groupId && (!this.$scope.model.mod.author || !this.$scope.model.mod.author.trim()))
      return;
    if (this.authorSubmission && !this.$scope.model.amAuthor)
      return;
    var data = JSON.parse(JSON.stringify(this.$scope.model.mod));
    if (this.$scope.model.mod.versionUnknown) {
      data.version = "0";
      data.branch = "unknown";
    }

    if (this.authorSubmission) data.author = "";
    await this.$scope.request<string>(NewModCommand, { data: data })
      .then(modId => {
        let shortId = modId.toShortId();
        let slug = <string>data.name.sluggifyEntityName();
        this.$modalInstance.close();
        let url = joinUri([this.$scope.url.play, this.model.slug, "mods", shortId, slug]);
        // workaround page load issue... weird!
        this.$scope.w6.navigate(url + "?landing=1");
        this.$location.path(url).search('landing', 1);
        return modId;
      })
      .then(async (x) => {
        if (shouldUpload) {
          await this.upload(x);
        }
      })
      .catch(this.httpFailed);
  };

  private checkData = (data: any): boolean => {
    if (!data.packageName.startsWith("@"))
      return false;
    return true;
  };
  private ok_user = () => {
    this.$subViewBaseFolder = this.$userViewBaseFolder;
    this.$scope.page = this.$userViewBaseFolder + 'add-mod-2.html';
    this.$scope.openTerms = () => this.$scope.request(OpenTermsDialogQuery);
    this.authorSubmission = false;
  };

  donePre: boolean = false;

  private ok_author = () => {
    this.$subViewBaseFolder = this.$authorViewBaseFolder;

    this.$scope.openTerms = () => this.$scope.request(OpenTermsDialogQuery);
    this.authorSubmission = true;
    this.$scope.model.mod.author = this.$scope.w6.userInfo.displayName;

    if (this.model.id == "be87e190-6fa4-4c96-b604-0d9b08165cc5" && !this.donePre) {
      this.donePre = true;
      this.$scope.page = this.$authorViewBaseFolder + 'add-mod-2-gta-pre.html';
    } else {
      this.$scope.page = this.$authorViewBaseFolder + 'add-mod-2.html';
    }
  };

  private setupDependencyAutoComplete() {
    return this.$scope.getDependencies = (query) => this.$scope.request(GetModTagsQuery, { gameId: this.model.id, query: query })
      .then((d) => this.processModNames(d))
      .catch(this.breezeQueryFailed);
  }

  private processModNames(names) {
    var obj = [];
    for (var i in names) {
      var mod = <any>names[i];
      obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
    }
    return obj;
  }

  public static versionPattern = /^[0-9]{1,20}([.][0-9]{1,20}){0,3}$/;
  public static folderPattern = /^@[a-zA-Z0-9]([^ *'\- /><?\\\"|:]{1,219})$/;

  public static branches = [
    { displayName: "Stable", value: "stable" },
    { displayName: "RC", value: "rc" },
    { displayName: "Beta", value: "beta" },
    { displayName: "Alpha", value: "alpha" }
  ];

  public static hints = {
    name: "This is the display name for the mod that will show in the Header.<br /><br/><b>Hint:</b> As the Mod name is a static entity, please do not add any version numbers here.",
    author: "The author is the owner of the mod.<br /><br/><b>Hint:</b> The content is connected to the account and will show up on the profile page too.",
    version: "Versioning supports up to four sequences of numbers, depending on the significance of the changes.<br /><br/><b>Hint:</b> For a calendar based versioning please use a Year.Month.day sequence.",
    dependencies: "These are add-ons required to for this mod to be launched on startup in order for it to work properly.<br /><br/><b>Hint:</b> Dependencies will be downloaded and updated automatically upon selection of the main mod.",
    branch: "Branches are streams that allow mods to be split into different revisions, depending on their state of completion.<br /><br/><b>Hint:</b> Users can select if they want to download only stable versions or development branches (alpha, beta).",
    download: "The link should directly start the download.<br /><br/><b>Hint:</b> If possible please add multiple links at once in order to ensure an uninterrupted processing of the mod.",
    homepage: "The homepage is the source of the download and is required to check for authenticity and origin.<br /><br/><b>Hint:</b> If you add a BI Forum thread as Homepage, the first post can be injected as a description automatically.",
    comments: "Please add any special requests or information that would help us to process your mod faster as a comment.<br /><br/><b>Hint:</b> Let us know if your mod requires dependencies that you couldn´t find on our network.",
    packageName: "The Folder is the physical directory for the modification, it has to be unique in order to prevent conflicts with other mods of the ArmA series.<br /><br/><b>Hint:</b> You can use this to check if the mod is already available.",
    packageNameUnavailable: "Unfortunately the folder name you have chosen is already taken.<br/>We recommend you confirm that the mod has not already been uploaded, otherwise choose a different name.",
    nameUnavailable: "Unfortunately the name you have chosen is already taken.<br/>We recommend you confirm that the mod has not already been uploaded, otherwise choose a different name.",
    downloadLinkUnavailable: "We can't seem to determine if the download link you provided is online or a real download, submitting this may increase processing time."
  };

  public static inlineHints = {
    name: "Must have a Name",
    author: "Must have an Author",
    version: "Version incorrect",
    dependencies: "",
    branch: "Must select a branch",
    download: "Must not be empty and must start with 'http://'",
    homepage: "Can be empty but must start with 'http://'",
    comments: "",
    packageName: "Must be at least 3 characters long",
    packageNameUnavailable: "Folder Name already exists",
    nameUnavailable: "Name already exists",
    packageNameMissingPrefix: "Must start with '@'",
    packageNameEmpty: "Must have a Folder Name",
    downloadLinkUnavailable: "Link Availability Unknown.",
    downloadLinkAvailable: "Link Availabile.",
    checkingDownload: "Checking Availability.",
    badVersion: "Version conflict: New version Number must be higher than previous"
  };
}

registerController(AddModDialogController);


export class OpenAddModDialogQuery extends DbQueryBase {
  static $inject = ['dbContext', '$modal', 'logger'];
  static $name = 'OpenAddModDialog';

  constructor(context: W6Context, private $modal, private logger) { super(context); }

  public execute = [
    'gameSlug', 'info',
    (gameSlug, info: { type?: string, folder?: string, groupId?: string }) => {
      let game = this.context.w6.activeGame;
      Tools.Debug.log(this.$modal);
      return DialogQueryBase.openDialog(this.$modal, AddModDialogController, {
        resolve: {
          game: () => Promise.resolve({ id: game.id, slug: game.slug, name: game.slug.replace("-", " ").toUpperCaseFirst() }), // this.findBySlug("Games", gameSlug, "getGame")
          info: () => info
        }
      });
    }
  ];
}

registerCQ(OpenAddModDialogQuery);

export class OpenAddCollectionDialogQuery extends DbQueryBase {
  static $inject = ['dbContext', '$modal', 'logger'];
  static $name = 'OpenAddCollectionDialog';

  constructor(context: W6Context, private $modal, private logger) { super(context); }

  public execute = [
    'gameSlug',
    (gameSlug) => {

      Tools.Debug.log(this.$modal);
      return DialogQueryBase.openDialog(this.$modal, AddCollectionDialogController, {
        resolve: {
          game: () => this.findBySlug("Games", gameSlug, "getGame")
        }
      });
    }
  ];
}

registerCQ(OpenAddCollectionDialogQuery);

export class GetGameQuery extends DbQueryBase {
  static $name = "GetGame";
  static $inject = ['dbContext', 'basketService'];

  constructor(context: W6Context, private basketService) {
    super(context);
  }

  public execute = ['gameSlug', async (gameSlug) => {
    let game = await this.findBySlug<IBreezeGame>("Games", gameSlug, "getGame");

    return { game: game, gameInfo: await this.basketService.getGameInfo(game.id) };
  }
  ];
}

registerCQ(GetGameQuery);

export class NewModCommand extends DbCommandBase {
  static $name = 'NewMod';
  public execute = ['data', data => this.context.postCustom<Result<string>>("mods", data, { requestName: 'postNewMod' }).then(x => x.result)];
}

registerCQ(NewModCommand);
export class NewImportedCollectionCommand extends DbCommandBase {
  static $name = 'NewImportedCollection';
  public execute = ['data', data => this.context.postCustom<Result<string>>("collections/import-repo", data, { requestName: 'postNewCollection' }).then(x => x.result)];
}

registerCQ(NewImportedCollectionCommand);

export class NewMultiImportedCollectionCommand extends DbCommandBase {
  static $name = 'NewMultiImportedCollection';
  public execute = ['data', data => this.context.postCustom<Result<string>>("collections/import-server", data, { requestName: 'postNewCollection' }).then(x => x.result)];
}

registerCQ(NewMultiImportedCollectionCommand);

export class GetCheckLinkQuery extends DbCommandBase {
  static $name = 'GetCheckLink';
  public execute = ['linkToCheck', linkToCheck => this.context.getCustom<BooleanResult>("cool/checkLink", { requestName: 'checkLink', params: { linkToCheck: linkToCheck } }).then(result => result.result)];
}

registerCQ(GetCheckLinkQuery);

interface IGamesScope extends IBaseScopeT<IBreezeGame[]> {

}

class GameController extends BaseQueryController<IBreezeGame> {
  static $name = "GameController";

  static $inject = [
    '$scope', 'logger', '$q', 'dbContext', 'model', 'aur.client',
    '$rootScope', 'basketService', 'aur.eventBus'
  ];

  constructor(public $scope: IGameScope, public logger, $q, dbContext: W6Context, query: { game: IBreezeGame, gameInfo }, private modInfo,
    $rootScope: IRootScope, basketService: BasketService, private eventBus: EventAggregator) {
    super($scope, logger, $q, query.game);

    let model = query.game;
    let clientInfo = query.gameInfo.clientInfo;

    $scope.gameUrl = $scope.url.play + "/" + model.slug;
    $scope.game = model;

    $scope.addToCollections = (mod: IBreezeMod) => { this.eventBus.publish(new OpenAddModsToCollectionsDialog($scope.game.id, [{ id: mod.id, name: mod.name, packageName: mod.packageName, groupId: mod.groupId }])) };

    let getItemProgressClass = (item: IBasketItem): string => {
      let state = $scope.clientInfo.content[item.id];
      if (!state || !(state.state == ItemState.Updating || state.state == ItemState.Installing))
        return null;
      var percent = Math.round(state.progress);
      if (percent < 1)
        return "content-in-progress content-progress-0";
      if (percent > 100)
        return "content-in-progress content-progress-100";
      return "content-in-progress content-progress-" + percent;
    }

    let getItemBusyClass = (item): string => {
      var clientInfo = <IClientInfo>(<any>$scope).clientInfo;
      var ciItem = clientInfo.content[item.id];
      if (ciItem == null) return "";
      var itemState = ciItem.state;

      switch (itemState) {
        case ItemState.Installing:
        case ItemState.Uninstalling:
        case ItemState.Updating:
        case ItemState.Launching:
          return "busy";
        default:
          return "";
      }
    }

    // TODO: Duplicate in basket-service
    let getItemStateClass = (item: IBasketItem): string => {
      var clientInfo = <IClientInfo>(<any>$scope).clientInfo;
      var ciItem = clientInfo.content[item.id];
      var postState = "";

      if (!$rootScope.w6.miniClient.isConnected) {
        if (basketService.hasConnected) {
          if ($scope.showBusyState())
            return "busy";
          return "no-client";
        } else {
          return "install";
        }
      }
      //if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
      //    return "busy";
      //}
      if ($scope.showBusyState())
        postState = "-busy";
      let state = $rootScope.w6.api.getContentStateInitial(ciItem, item.constraint);
      switch (state) {
        case ItemState.NotInstalled:
          return "install" + postState;
        case ItemState.Incomplete:
          return "incomplete" + postState;
        case ItemState.UpdateAvailable:
          return "updateavailable" + postState;
        case ItemState.Uptodate:
          return "uptodate" + postState;

        case ItemState.Installing:
          return "installing" + postState;
        case ItemState.Updating:
          return "updating" + postState;
        case ItemState.Uninstalling:
          return "uninstalling" + postState;
        case ItemState.Launching:
          return "launching" + postState;

        default:
          return "install" + postState;
      }
    }

    $scope.getItemClass = (item: IBasketItem): string => {
      let progress = getItemProgressClass(item);
      return `content-state-${getItemStateClass(item)} ${progress ? progress : ""} ${getItemBusyClass(item)}`
    }

    var items = [];

    if (model.supportsStream)
      items.push({ header: "Stream", segment: "stream", icon: "icon withSIX-icon-Nav-Stream", isDefault: true });

    if (model.supportsMods) {
      items.push({ header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" });
      this.$scope.openAddModDialog = (info = { type: "download", folder: "" }) => this.eventBus.publish(new OpenAddModDialog(model, info));
      this.$scope.openAddCollectionDialog = () => this.eventBus.publish(new OpenCreateCollectionDialog(model));
    }

    if (model.supportsMissions)
      items.push({ header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" });

    if (model.supportsCollections)
      items.push({ header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection" });

    if (model.supportsServers && $scope.environment != Tools.Environment.Production)
      items.push({ header: "Servers", segment: "servers", icon: "icon withSIX-icon-Nav-Server" });

    if ($scope.w6.enableBasket)
      items.push({ header: "My Library", segment: "library", icon: "icon withSIX-icon-Folder", url: "/me/library/" + model.slug, isRight: true });

    // TODO: if owns game (get from client, then hide this)
    items.push({ header: "Buy " + model.name, segment: "order", icon: "icon withSIX-icon-Card-Purchase", isRight: true });

    $scope.menuItems = this.getMenuItems(items, "game");

    $scope.followedMods = {};
    $scope.followedMissions = {};
    $scope.subscribedCollections = {};

    if ($scope.w6.userInfo.id) {
      dbContext.get('FollowedMods', { gameSlug: model.slug })
        .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMods))
        .catch(this.breezeQueryFailed);
      dbContext.get('FollowedMissions', { gameSlug: model.slug })
        .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMissions))
        .catch(this.breezeQueryFailed);
      dbContext.get('SubscribedCollections', { gameSlug: model.slug })
        .then(results => this.subscriptionQuerySucceeded(results, $scope.subscribedCollections))
        .catch(this.breezeQueryFailed);
    }

    $scope.clientInfo = clientInfo;

    $scope.showBusyState = (): boolean => {
      //isInitBusy ||
      return $scope.clientInfo.gameLock || $scope.clientInfo.globalLock;
    };

    $scope.isActive = (mod: IBreezeMod) => $scope.showBusyState() && basketService.lastActiveItem == mod.id;

    $scope.abort = (mod: IBreezeMod) => basketService.abort(mod.gameId)

    $scope.directDownload = async (item: any) => {
      if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
        logger.error("Client is currently busy");
        return;
      }
      basketService.lastActiveItem = item.id;
      await basketService.getGameBaskets($scope.game.id).handleAction(Helper.modToBasket(item, $scope.game.id), $scope.clientInfo, 1);
    };
    $scope.canAddToBasket = (): boolean => true;
    // {
    //   return !basketService.getGameBaskets($scope.game.id).active.model.isTemporary;
    // };

    $scope.directDownloadCollection = async (item: IBreezeCollection) => {
      if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
        logger.error("Client is currently busy");
        return null;
      }
      basketService.lastActiveItem = item.id;
      await basketService.getGameBaskets($scope.game.id).handleAction(Helper.collectionToBasket(item, $scope.game.id), $scope.clientInfo, 2)
    };
    var s = this.eventBus.subscribe("basketChanged", () => this.applyIfNeeded());

    // TODO: Move to Directive..
    $scope.$on('$destroy', () => {
      s.dispose();
      $('#wrapper').removeClass('play-game');
    });
    $('#header-row').attr('style', 'background-image:url("' + $scope.url.getAssetUrl('img/play.withSIX/games/' + model.slug + '/headers/header.png') + '");');
    $('#wrapper').removeClass('play-game');
    $('#wrapper').addClass('play-game');
  }

  subscriptionQuerySucceeded = (result, d) => {
    for (var v in result.data)
      d[result.data[v]] = true;
  };
}

registerController(GameController);

class OrderController extends BaseController {
  static $name = "OrderController";

  constructor(public $scope: IGameScope, public logger, public $q) {
    super($scope, logger, $q);
    // TODO: Move to Directive..
    $('body').removeClass('game-profile');
    $scope.setMicrodata({ title: "Order" + $scope.model.fullName, description: "Order the game " + $scope.model.fullName, keywords: "order, " + $scope.model.name + ", " + $scope.model.fullName });
  }
}

registerController(OrderController);

interface IStreamScope extends IBaseGameScope, IBaseScopeT<any> {
  streamPath: string;
  addToBasket: (mod: any) => void;
  baskets: any; //GameBaskets;
  isInBasket: (mod: IBreezeMod) => boolean;
}

class StreamController extends BaseQueryController<any> {
  static $name = "StreamController";
  static $inject = ['$scope', 'logger', '$q', '$rootScope', 'basketService', 'model'];

  constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: BasketService, model: any) {
    super($scope, logger, $q, model);

    var basket = basketService.getGameBaskets($scope.game.id);

    $scope.addToBasket = mod => basketService.addToBasket($scope.game.id, Helper.streamModToBasket(mod, $scope.game.id));
    $scope.streamPath = 'stream';

    $scope.baskets = basket;
    $scope.isInBasket = (mod: IBreezeMod) => basket.active.content.has(mod.id);

    // TODO: Move to Directive..
    $('body').removeClass('game-profile');
  }
}

registerController(StreamController);

class PersonalStreamController extends StreamController {
  static $name = "PersonalStreamController";

  constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: BasketService, model: any) {
    super($scope, logger, $q, $rootScope, basketService, model);

    $scope.streamPath = 'stream/personal';
  }
}

registerController(PersonalStreamController);
