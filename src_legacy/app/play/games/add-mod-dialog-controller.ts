module MyApp.Play.Games {
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
    static $inject = ['$scope', 'logger', '$routeParams', '$location', '$modalInstance', '$q', '$timeout', 'game', 'info', 'modInfoService', 'dbContext'];
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
      $scope.showExtension = window.w6Cheat.w6.miniClient.clientInfo && !window.w6Cheat.w6.miniClient.clientInfo.extensionInstalled;
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
      Debug.log(model);

      $scope.hints = AddModDialogController.hints;

      $scope.inlineHints = AddModDialogController.inlineHints;

      $scope.$watch("model.mod.packageName", (newValue: string, oldValue: string, scope) => {
        if (newValue != oldValue && newValue != null && newValue != "")
          this.checkPackageName(newValue);
      });

      $scope.$watch("model.mod.download", (newValue: string, oldValue: string, scope) => {
        if (newValue != oldValue && newValue != null && newValue != "")
          this.checkDownloadLink(newValue);
      });

      $scope.getForumPost = () => this.requestAndProcessCommand(Play.Mods.GetForumPostQuery, { forumUrl: $scope.model.mod.homepage }, 'fetch first post') // "http://forums.bistudio.com/showthread.php?171722-Discover-Play-Promote-missions-and-mods-withSIX"
        .then(r => {
          $timeout(() => {
            $scope.model.mod.name = r.lastResult.title;
            $scope.model.mod.author = r.lastResult.author;
            $scope.model.mod.description = r.lastResult.body;
          }, 1000);
        });

      //if (info.folder) {
      if ($scope.w6.userInfo.isAdmin) {
        this.ok_user();
      } else {
        this.ok_author();
      }
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
      this.$scope.checkingPackageName = true;
      this.$scope.model.packageNameAvailable = false;
      this.$scope.request(Mods.ModExistsQuery, { packageName: packageName })
        .then((result) => {
          this.$scope.checkingPackageName = false;
          Debug.log(result);
          this.$scope.model.packageNameAvailable = !result.lastResult;
        })
        .catch(this.httpFailed);
    };

    checkDownloadLink(uri: string) {
      this.$scope.checkingDownloadLink = true;
      this.$scope.model.downloadLinkAvailable = false;
      this.$scope.request(GetCheckLinkQuery, { linkToCheck: uri })
        .then((result) => {
          this.$scope.checkingDownloadLink = false;
          Debug.log(result);
          this.$scope.model.downloadLinkAvailable = result.lastResult;
        })
        .catch(this.httpFailed);
    }

    private cancel = () => this.$modalInstance.close();
    private reload = () => window.location.reload();

    get type() {
      if (this.$scope.model.info.type == "upload")
        return 1;
      return 0;
    }

    getLatestInfo() {
      let model = this.$scope.model;
      this.$scope.request(Mods.GetLatestInfo, { data: { downloadUri: model.mod.download } }).then(x => {
        let r = <IModVersionInfo>x.lastResult;
        model.mod.version = r.version;
        model.mod.branch = r.branch;
        if (!model.mod.name) model.mod.name = r.name;
        if (!model.mod.author) model.mod.author = r.author;
        if (!model.mod.homepage) model.mod.homepage = r.url;
        if (!model.mod.description) model.mod.description = r.description;
        if (!model.mod.homepage) model.mod.download;
        model.mod.tags = r.tags;
      });
    }

    private ok = () => {
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
      this.$scope.request(NewModCommand, { data: data })
        .then(result => {
          let modId = result.lastResult;
          let shortId = Tools.toShortId(modId);
          let slug = <string>data.name.sluggifyEntityName();
          this.$modalInstance.close();
          let url = Tools.joinUri([this.$scope.url.play, this.model.slug, "mods", shortId, slug]);
          // workaround page load issue... weird!
          window.w6Cheat.navigate(url + "?landing=1");
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
      this.$scope.openTerms = () => this.$scope.request(Components.Dialogs.OpenTermsDialogQuery);
      this.authorSubmission = false;
    };

    donePre: boolean = false;

    private ok_author = () => {
      this.$subViewBaseFolder = this.$authorViewBaseFolder;

      this.$scope.openTerms = () => this.$scope.request(Components.Dialogs.OpenTermsDialogQuery);
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
      this.$scope.getDependencies = (query) => this.$scope.request(ContentIndexes.Mods.GetModTagsQuery, { gameId: this.model.id, query: query })
        .then((d) => this.processModNames(d.lastResult))
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
      packageNameUnavailable: "Unfortunately the name you have chosen is already taken.<br/>We recommend you confirm that the mod has not already been uploaded, otherwise choose a different name.",
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
      packageNameMissingPrefix: "Must start with '@'",
      packageNameEmpty: "Must have a Folder Name",
      downloadLinkUnavailable: "Link Availability Unknown.",
      downloadLinkAvailable: "Link Availabile.",
      checkingDownload: "Checking Availability.",
      badVersion: "Version conflict: New version Number must be higher than previous"
    };
  }

  registerController(AddModDialogController);
}
