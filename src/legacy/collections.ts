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

import { ForwardService } from './components';
import {IBasketItem, BasketItemType} from '../services/legacy/baskets';
import {BasketService} from '../services/basket-service';
import {ModsHelper, Helper} from '../services/legacy/misc';
import {ToastLogger} from '../services/legacy/logger';

import {registerCommands, getFactory, skyscraperSlotSizes, rectangleSlotSizes, leaderboardSlotSizes} from './app-base';
import {joinUri} from '../helpers/utils/url'

import { registerCQ, registerService, registerController, IContentScopeT, ContentModelController, IContentHeader, ContentDownloads, HelpItem, ContentController, IContentIndexScope, IEditConfiguration } from './play'
import { GetModTagsQuery } from './mods';

export interface ICollectionScope extends IContentScopeT<IBreezeCollection>, IHandleCommentsScope<IBreezeCollectionComment> {
  baskets: any;//GameBaskets;
  isInBasket: (mod: IBreezeMod) => boolean;
  addToBasket: (mod: IBreezeMod) => void;
  toggleSubscribe: () => void;
  versionConstraints: {};
  addTag: (data: any) => boolean;
  getCurrentTags: () => any[];
  removeTag: (data: any) => void;
  scopes: any[];
  uploadingCollectionImage: boolean;
  onFileSelectLogo: (files: any, $event: any) => void;
  onFileSelectGallery: (files: any, $event: any) => void;
  showHelp: () => void;
  fileDropped: ($files: any, $event: any, $rejectedFiles: any) => void;
  accept: any;
  showUploadBanner: () => void;
  newRemoteLogoUploadRequest: (file: string) => void;
  clients: { name: string; number: string }[];
  tryDirectDownloadCollection: any;
  getDependencies: (query: any) => any;
  addModDependency: (data: any, hide: any) => boolean;
}

export class CollectionController extends ContentModelController<IBreezeCollection> {
  static $name = 'CollectionController';
  static menuItems = [
    { header: "Info", segment: "info", isDefault: true },
    { header: "Content", segment: "content" }
    //{ header: "Comments", segment: "comments" }
  ];
  static $inject = ['$scope', 'logger', '$routeParams', '$q', '$sce', 'localStorageService', 'w6', 'ForwardService', '$timeout', 'dbContext', '$popover', '$rootScope', 'basketService', 'aur.eventBus', 'aur.mediator', 'model'];

  constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q, $sce: ng.ISCEService, private localStorageService, private w6: W6, private forwardService: ForwardService, private $timeout: ng.ITimeoutService, private dbContext: W6Context, private $popover, $rootScope: IRootScope, basketService: BasketService, eventBus: EventAggregator, private mediator, model: IBreezeCollection) {
    super($scope, logger, $routeParams, $q, $sce, model);

    if (model.groupId != null) this.$scope.features.groups = true;

    w6.collection = this;

    $scope.tryDirectDownloadCollection = async () => {
      if (model.latestVersion.repositories != null) {
        await this.$scope.request(OpenRepoCollectionDialogQuery, { model: this.$scope.model });
      }
      return await $scope.directDownloadCollection(this.$scope.model);
    }

    var basket = $scope.game && basketService.getGameBaskets($scope.game.id);
    $scope.addToBasket = (mod: IBreezeMod) => basketService.addToBasket($scope.game.id, Helper.modToBasket(mod));
    $scope.baskets = basket;
    $scope.isInBasket = (mod: IBreezeMod) => {
      return basket && basket.active.content.has(mod.id);
    };

    $scope.versionConstraints = {};
    if (model.latestVersion != null)
      angular.forEach(model.latestVersion.dependencies, d => {
        if (d.constraint)
          $scope.versionConstraints[d.modDependencyId] = d.constraint;
      })

    $scope.toggleSubscribe = () => {
      if (this.$scope.subscribedCollections[model.id])
        this.unsubscribe();
      else
        this.subscribe();
    };

    $scope.clients = [
      { name: "Default", number: "Default" },
      { name: "Sync", number: "Sync" },
      { name: "Play withSIX", number: "PlayWithSix" }
    ];

    $scope.onFileSelectGallery = (files, $event) => $scope.onFileSelectLogo(files, $event);
    $scope.onFileSelectLogo = (files, $event) => {
      this.newLogoUploadRequest(files[0], $event);
    };
    $scope.fileDropped = ($files, $event, $rejectedFiles) => {
      if (typeof $files[0] === "string") {
        this.newRemoteLogoUploadRequest($files[0], $event);
      } else {
        this.newLogoUploadRequest($files[0], $event);
      }
    };
    $scope.newRemoteLogoUploadRequest = (url) => this.newRemoteLogoUploadRequest(url, null);
    $scope.accept = ($files, $event) => {
      return true;
    };
    this.showUploadBanner();
    //$scope.accept = "image/*,audio/*,video/*,text/html";

    this.setupCategoriesAutoComplete();

    this.setupTitle("model.name", "{0} - " + model.game.name);

    this.setupEditing();
    this.setupHelp();

    var handleClient = newValue => {
      let routeParam = $routeParams["preferred_client"];
      if (routeParam) newValue = routeParam;
      if (newValue) newValue = newValue.toLowerCase();

      Tools.Debug.log("handlepreferredclient: ", newValue);
      if (newValue == "playwithsix" || this.w6.isClient) this.w6.enableBasket = false;
      else if (newValue == "sync") this.w6.enableBasket = true;
      else eventBus.publish(new RestoreBasket());
    }

    handleClient(model.preferredClient);

    $scope.$watch('model.preferredClient', (newValue: string, oldValue: string, scope) => {
      if (newValue === oldValue)
        return;
      // todo; restore existing etc when navigating away?
      handleClient(newValue);
    });


    if (window.location.pathname.endsWith("/content/edit"))
      this.$scope.editConfig.enableEditing();

    var handleEditMode = (newV) => {
      var menuEntry = $scope.header.menuItems.asEnumerable().first(x => x.header == "Content");
      menuEntry.url = newV ? $scope.gameUrl + "/collections/" + model.id.toShortId() + "/" + model.name.sluggifyEntityName() + "/content/edit" : null;
      if (newV) {
        if (window.location.pathname.endsWith("/content"))
          w6.navigate(window.location.pathname + "/edit");
      } else {
        if (window.location.pathname.endsWith("/edit"))
          w6.navigate(window.location.pathname.replace("/edit", ""));
      }
    }

    var w = $scope.$watch('editConfig.editMode', (newV: boolean, oldV: boolean, scope) => {
      if (newV === oldV) return;
      setTimeout(() => handleEditMode(newV));
    });

    handleEditMode($scope.editConfig.editMode);

    $scope.$on('$destroy', () => {
      w6.collection = null;
      eventBus.publish(new RestoreBasket());
      w();
    });
    var hasLanding = $routeParams.hasOwnProperty("landing");
    var hasRepoLanding = $routeParams.hasOwnProperty("landingrepo");
    if ((hasLanding || hasRepoLanding) && (this.$scope.editConfig.canEdit() || this.$scope.editConfig.canManage()))
      this.$scope.request(OpenNewCollectionWelcomeDialogQuery, { model: { model: this.$scope.model, repoLanding: hasRepoLanding }, editConfig: this.$scope.editConfig });
  }

  forking = false;

  fork = async () => {
    this.forking = true;
    try {
      let model = this.$scope.model;
      let id = await new ForkCollection(model.id).handle(this.mediator);
      this.w6.navigate("/p/" + model.game.slug + "/collections/" + id.toShortId() + "/" + (model.name + ' [Forked]').sluggifyEntityName());
    } finally {
      this.forking = false;
    }
  }

  protected updateAuModel() {
    // todo; call when going out of edit mode etc ?
    this.$scope.auModel = CollectionHelper.convertOnlineCollection(this.$scope.model, 1, this.$scope.w6);
  }


  // workaround for angular vs aurelia

  public enableEditModeFromAurelia = () => this.applyIfNeeded(() => this.$scope.editConfig.enableEditing())

  public disableEditModeFromAurelia = () => this.applyIfNeeded(() => this.$scope.editConfig.closeEditing())

  public saveFromAurelia() { return this.$scope.editConfig.hasChanges() ? this.$scope.editConfig.saveChanges() : null; }

  public cancelFromAurelia() {
    if (this.$scope.editConfig.hasChanges())
      this.$scope.editConfig.discardChanges();
  }

  get hasChangesFromAurelia() { return CollectionController.hasChanges(this.$scope.editConfig); }

  static hasChanges(editConfig) { return editConfig.hasChanges() }

  private setupCategoriesAutoComplete() {
    var $scope = this.$scope;

    var saveOriginalTags = () => {
      if (!$scope.model.entityAspect.originalValues.hasOwnProperty("tags")) {
        (<any>$scope.model.entityAspect.originalValues).tags = $scope.model.tags.slice(0);
        $scope.model.entityAspect.setModified();
      }
    };

    $scope.addTag = (data) => {
      var index = $scope.model.tags.indexOf(data.key);
      if (index == -1) {
        saveOriginalTags();
        $scope.model.tags.push(data.key);
      }
      $scope.header.tags = $scope.model.tags;
      return true;
    };
    $scope.getCurrentTags = () => {
      var list = [];
      for (var tag in $scope.model.tags) {
        list.push({ key: $scope.model.tags[tag], text: $scope.model.tags[tag] });
      }
      return list;
    };
    $scope.removeTag = (data) => {
      var index = $scope.model.tags.indexOf(data);
      if (index > -1) {
        saveOriginalTags();
        $scope.model.tags.splice(index, 1);
      }
      $scope.header.tags = $scope.model.tags;
    };
  }

  unsubscribe() {
    return this.requestAndProcessResponse(UnsubscribeCollectionCommand, { model: this.$scope.model })
      .then(r => this.applyIfNeeded(() => {
          delete this.$scope.subscribedCollections[this.$scope.model.id];
          this.$scope.model.subscribersCount -= 1;
          if (window.six_client.unsubscribedFromCollection)
            window.six_client.unsubscribedFromCollection(this.$scope.model.id);
        }));
  }

  subscribe() {
    return this.requestAndProcessResponse(SubscribeCollectionCommand, { model: this.$scope.model })
      .then(r => this.applyIfNeeded(() => {
          this.$scope.subscribedCollections[this.$scope.model.id] = true;
          this.$scope.model.subscribersCount += 1;
          if (window.six_client.subscribedToCollection)
            window.six_client.subscribedToCollection(this.$scope.model.id)

          if (this.w6.client && this.w6.client.clientFound) {
            this.w6.client.openPwsUri("pws://?c=" + this.$scope.toShortId(this.$scope.model.id));
            return;
          }
          if (this.localStorageService.get('clientInstalled') == null
            && !this.$scope.w6.isClient
            && confirm("Before downloading this content, make sure you have \"Play\" our withSIX client installed. To download the client software now, click ok. To proceed with the download, click cancel.")) {
            this.forwardService.forward(this.w6.url.main + "/download" + this.w6.enableBasket ? '' : '?basket=0');
            //localStorageService.set('clientInstalled', true);
          } else {
            this.localStorageService.set('clientInstalled', true);
            //Downloads.startDownload(url);
          }
        })
      );
  }

  setupContentHeader(content: IBreezeCollection): IContentHeader {
    var contentPath = content.game.slug + "/collections";
    var shortPath = contentPath + "/" + this.$scope.toShortId(content.id);
    var fullPath = shortPath + "/" + content.slug;
    var menuItems = CollectionController.menuItems;
    if (this.$scope.model.forkedCollectionId != null
      || this.$scope.model.forkedCollectionsCount > 0)
      menuItems = menuItems.concat([{ header: "Related", segment: "related" }]);

    var header = <IContentHeader>{
      title: content.name,
      menuItems: this.getMenuItems(menuItems, "game.collectionsShow"),
      contentType: "collection",
      getAvatar: (width, height) => {
        if (this.tempCollectionImagePath != null)
          return this.tempCollectionImagePath;

        if (this.$scope.model.fileTransferPolicies.length > 0) {
          var policy = this.$scope.model.fileTransferPolicies[0];
          if (policy.uploaded)
            return this.$scope.url.getUsercontentUrl2(policy.path);
        }

        return this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar, content.avatarUpdatedAt), width, height);
      },
      getBanner: (width, height) => this.getImageOrPlaceholder(this.getContentAvatarUrl(content.avatar), width, height),
      avatar: content.avatar,
      gameSlug: content.game.slug,
      contentPath: fullPath,
      contentRootUrl: this.$scope.url.play + "/" + contentPath,
      contentUrl: this.$scope.url.play + "/" + fullPath,
      shortContentUrl: this.$scope.url.play + "/" + shortPath,
      tags: content.tags || []
    };

    this.$scope.scopes = [
      { text: "Public" },
      { text: "Unlisted" },
      { text: "Private" }
    ];

    return header;
  }
  private setupDependencyAutoComplete() {
    this.$scope.getDependencies = (query) => this.$scope.request(GetModTagsQuery, { gameId: this.$scope.game.id, query: query })
      .then((d) => this.processModNames(d))
      .catch(this.breezeQueryFailed);
    this.$scope.addModDependency = (data, hide) => {
      var found = false;

      angular.forEach(this.$scope.model.latestVersion.dependencies, item => {
        if (data.id == item.id) {
          found = true;
        }
      });

      // ReSharper disable once ExpressionIsAlwaysConst, ConditionIsAlwaysConst
      if (!found) {
        //ADD ITEM
        //BreezeEntityGraph.ModDependency.createEntity({ id: data.id, modId: this.$scope.model.id, name: data.name, });
      }
      hide();
      return false;
    };
  }
  private processModNames(names) {
    var obj = [];
    for (var i in names) {
      var mod = <any>names[i];
      obj.push({ text: (mod.name && mod.name != mod.packageName ? mod.name + " (" + mod.packageName + ")" : mod.packageName), key: mod.packageName, id: mod.id, name: mod.name || mod.packageName });
    }
    return obj;
  }
  private setupEditing = () => {

    this.setupEditConfig({
      canEdit: () => this.$scope.model.author.id == this.$scope.w6.userInfo.id,
      discardChanges: () => {
        this.entityManager.getChanges().filter((x, i, arr) => {
          return (x.entityType.shortName == "Collection") ? ((<IBreezeCollection>x).id == this.$scope.model.id) : ((<any>x).collectionId && (<any>x).collectionId == this.$scope.model.id);
        }).forEach(x => x.entityAspect.rejectChanges());
        this.$scope.header.tags = this.$scope.model.tags || [];
      }
    }, null,
      [
        BreezeEntityGraph.Collection.forkedCollection().$name,
        BreezeEntityGraph.Collection.forkedCollections().$name, BreezeEntityGraph.Collection.latestVersion().$name,
        BreezeEntityGraph.Collection.mediaItems().$name, BreezeEntityGraph.Collection.fileTransferPolicies().$name,
        BreezeEntityGraph.Collection.latestVersion().dependencies().$name,
        BreezeEntityGraph.Collection.latestVersion().dependencies().modDependency().$name
      ]); // TODO: Throws errors , BreezeEntityGraph.Collection.versions().$name, BreezeEntityGraph.Collection.dependencies().$name
    this.$scope.$watch("uploadingModImage", (newValue, oldValue, scope) => {
      if (newValue == oldValue) return;

      if (!newValue) {
        this.tempCollectionImagePath = null;
      }
    });
    this.setupDependencyAutoComplete();
  };

  private async cancelImageUpload() {
    this.tempCollectionImagePath = null;
    if (this.$scope.model.fileTransferPolicies.length > 0) {
      var transferPolicy = this.$scope.model.fileTransferPolicies[0];
      var isAdded = transferPolicy.entityAspect.entityState.isAdded();
      transferPolicy.entityAspect.setDeleted();
      if (!isAdded) await this.$scope.editConfig.saveChanges(transferPolicy);
    }
  }

  private async newLogoUploadRequest(file: File, $event: any) {
    var $scope = this.$scope;
    //if ($scope.model.imageFileTransferPolicy) {
    //    throw Error("An Upload Request already exists.");
    //}
    if (file == null)
      return;

    if ($scope.uploadingCollectionImage) {
      this.logger.error("You are already uploading an image! Please wait!");
      return;
    }

    if (file.name.endsWithIgnoreCase(".gif")) {
      this.logger.error("You are unable to upload gifs for your mod logo.");
      return;
    }

    $scope.uploadingCollectionImage = true;

    var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
      path: file.name,
      collectionId: $scope.model.id
    });

    var fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = e => {
      this.$timeout(() => {
        if ($scope.uploadingCollectionImage)
          this.tempCollectionImagePath = (<any>e.target).result;
      });
    };

    try {
      let result = await this.saveChanges([uploadRequest]);
      Tools.Debug.log(result, uploadRequest, $scope.model.fileTransferPolicies);
      await this.uploadLogo(file, uploadRequest);
    } catch (reason) {
      Tools.Debug.log("Failure", reason);
      this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
      this.cancelImageUpload();
    } finally {
      await this.applyIfNeeded(() => $scope.uploadingCollectionImage = false);
    }
  }

  private async newRemoteLogoUploadRequest(file: string, $event: any) {
    //if ($scope.model.imageFileTransferPolicy) {
    //    throw Error("An Upload Request already exists.");
    //}
    if (file == null)
      return;

    if (this.$scope.uploadingCollectionImage) {
      this.logger.error("You are already uploading an image! Please wait!");
      return;
    }

    if (file.endsWithIgnoreCase(".gif")) {
      this.logger.error("You are unable to upload gifs for your mod logo.");
      return;
    }

    this.$scope.uploadingCollectionImage = true;

    var uploadRequest = BreezeEntityGraph.CollectionImageFileTransferPolicy.createEntity({
      path: file,
      collectionId: this.$scope.model.id
    });

    this.tempCollectionImagePath = file;
    try {
      let result = await this.saveChanges([uploadRequest]);
      Tools.Debug.log(result, uploadRequest, this.$scope.model.fileTransferPolicies);
      this.uploadRemoteLogo(file, uploadRequest);
    } catch (reason) {
      Tools.Debug.log("Failure", reason);
      this.logger.error("We were unable to retrieve an upload policy for your image. Please try again later", "Failed to upload image.");
      this.cancelImageUpload();
    } finally {
      await this.applyIfNeeded(() => this.$scope.uploadingCollectionImage = false);
    }
  }

  async saveChanges(changedEntities?) {
    try {
      return await this.entityManager.saveChanges(changedEntities);
    } finally {
      await this.applyIfNeeded();
    }
  }

  private async uploadLogo(file: File, policy: IBreezeCollectionImageFileTransferPolicy) {
    try {
      let r = await this.dbContext.uploadToAmazonWithPolicy(file, policy.uploadPolicy);
      Tools.Debug.log(r);
      this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
      policy.uploaded = true;
    } catch (r) {
      Tools.Debug.log(r);
      this.cancelImageUpload();
      let data = await r.text();
      if (data.includes("EntityTooLarge")) this.logger.error("Your image can not be larger than 5MB", "Image too large");
      if (data.includes("EntityTooSmall")) this.logger.error("Your image must be at least 10KB", "Image too small");
      throw r;
    } finally {
      await this.applyIfNeeded(() => this.$scope.uploadingCollectionImage = false);
    }
  }

  private uploadRemoteLogo(file: string, policy: IBreezeCollectionImageFileTransferPolicy) {
    this.logger.info("When you're happy click Save Changes to use the uploaded image.", "Image Uploaded");
    policy.uploaded = true;
    this.$scope.uploadingCollectionImage = false;
  }

  showUploadBanner() {
    var $scope = this.$scope;
    var helpItem = {
      element: "#uploadBanner",
      data: {
        title: 'Upload Banner',
        content: '',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: "/src_legacy/app/play/collections/popovers/banner-upload-popover.html",
        placement: "auto left"
      },
      conditional: () => true,
      popover: null
    };
    this.$scope.showUploadBanner = () => {
      helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

      this.$timeout(() => {
        var helpPopover = helpItem.popover;
        helpPopover.$scope = $scope;
        helpPopover.show();
      });
    };
  }

  tempCollectionImagePath: any;

  setupHelp() {
    var $scope = this.$scope;
    var helpItem = {
      element: "#helpButton",
      data: {
        title: 'Help Section',
        content: 'Click the next button to get started!',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: "/src_legacy/app/play/mods/popovers/help-popover.html"
      },
      conditional: () => true,
      popover: null
    };

    var showSection = (item: HelpItem<ICollectionScope>) => {
      item.popover = this.$popover($(item.element), item.data);
      this.$timeout(() => {
        item.popover.show();
        helpItem.popover.hide();
      });
    };

    var displayCondition = (item: HelpItem<ICollectionScope>, scope: ICollectionScope): boolean => {
      if ($(item.element).length == 0)
        return false;

      return item.conditional(scope);
    };

    this.$scope.showHelp = () => {
      helpItem.popover = this.$popover($(helpItem.element), helpItem.data);

      this.$timeout(() => {
        var helpPopover = helpItem.popover;
        helpPopover.$scope.helpItems = CollectionController.helpItems;
        helpPopover.$scope.showSection = showSection;
        helpPopover.$scope.contentScope = $scope;
        helpPopover.$scope.displayCondition = displayCondition;
        helpPopover.show();
      });
    };
  }

  private static helpItemTemplate: string = "/src_legacy/app/play/mods/popovers/help-item-popover.html";
  private static helpItems: HelpItem<ICollectionScope>[] = [
    {
      element: "#openEditorButton",
      data: {
        title: 'How to get started',
        content: 'Click here to “open editor”. This will allow you to interact with several items directly inside the Page. ',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: CollectionController.helpItemTemplate
      },
      conditional: ($scope) => !$scope.editConfig.editMode,
      popover: null
    },
    {
      element: ".pagetitle",
      data: {
        title: 'Edit your Title',
        content: 'Simply Click on the Title text in order to change it.<br/><br/><b>Hint:</b> Choose your Mod title carefully as it will show up in the filter and search. ',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: CollectionController.helpItemTemplate
      },
      conditional: ($scope) => $scope.editConfig.editMode,
      popover: null
    },
    {
      element: "#addCollectionTag",
      data: {
        title: 'Add/Edit Tags',
        content: 'Click on + you can add the Tag(s) that best fit the type of your.<br/><br/><b>Hint:</b> Don´t use more than four tags if possible, as too many tags will confuse players. ',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: CollectionController.helpItemTemplate
      },
      conditional: ($scope) => $scope.editConfig.editMode,
      popover: null
    },
    {
      element: "#collectionDescription",
      data: {
        title: 'Edit your Description',
        content: 'Keybord Shortcuts : <a target="_blank" href="http://imperavi.com/redactor/docs/shortcuts/">http://imperavi.com/redactor/docs/shortcuts/</a><br/><br/><b>Hint:</b> you can also import your BI Forum description. All you need is to set your BI forum thread as homepage and click on “Import Forum post”.',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: CollectionController.helpItemTemplate
      },
      conditional: ($scope) => $scope.editConfig.editMode,
      popover: null
    },
    {
      element: "#addModDependency",
      data: {
        title: 'How to use dependencies',
        content: 'Click on “+ Add Dependency” to search and select the appropriate depended mod, or click on “x” to remove a dependency. Dependencies are not version specific.<br/><br/><b>Warning:</b> Make sure to select the correct dependencies as your mod will be launched along with the depended content. Selecting wrong or incompatible dependencies can cause crashes and errors!',
        trigger: 'manual',
        container: 'body',
        autoClose: true,
        template: CollectionController.helpItemTemplate,
        placement: "auto left"
      },
      conditional: ($scope) => $scope.editConfig.editMode,
      popover: null
    } /*,
            {
                element: "",
                data: {
                    title: '', content: '',
                    trigger: 'manual', container: 'body', autoClose: true,
                    template: CollectionController.helpItemTemplate
                },
                conditional: ($scope) => $scope.editConfig.editMode,
                popover: null
            }*/
  ];
}

registerController(CollectionController);

export class RepoCollectionDialogController extends ModelDialogControllerBase<ICollectionScope> {
  static $name = 'RepoCollectionDialogController';
  static $view = '/src_legacy/app/play/collections/dialogs/repo-collection-warning.html';

  constructor(public $scope, public logger, $modalInstance, $q, model: ICollectionScope) {
    super($scope, logger, $modalInstance, $q, model);

    $scope.model = model.model;
  }
}

registerController(RepoCollectionDialogController);

export class CollectionInfoController extends ContentController {
  static $name = 'CollectionInfoController';

  static $inject = ['$scope', 'logger', '$routeParams', '$q', '$timeout', '$popover'];

  constructor(public $scope: ICollectionScope, logger, $routeParams, $q, public $timeout, public $popover) {
    super($scope, logger, $routeParams, $q);


    this.setupComments($scope.model);
    this.setupTitle("model.name", "Info - {0} - " + $scope.model.game.name);
  }

  private setupComments(collection: IBreezeCollection) {
    this.$scope.addComment = newComment => {
      Tools.Debug.log('Add new comment', newComment);

      var r = this.$scope.request<ICreateComment<IBreezeCollectionComment>>(CreateCollectionCommentCommand, { model: { replyTo: newComment.replyTo, contentId: this.$scope.model.id, message: newComment.message, replyToId: newComment.replyTo ? newComment.replyTo.id : undefined } }).catch(x => this.breezeQueryFailed(x));
      newComment.message = "";
      newComment.valueOf = false;

      return r;
    };
    this.$scope.deleteComment = comment => this.$scope.request(DeleteCollectionCommentCommand, { model: comment }).catch(x => this.breezeQueryFailed(x)),
      this.$scope.saveComment = comment => {
        Tools.Debug.log("Saving comment", comment);
        return this.$scope.request(SaveCollectionCommentCommand, { model: comment }).catch(x => this.breezeQueryFailed(x));
      };
    this.$scope.reportComment = (comment) => { throw "NotImplemented"; };
    if (this.$scope.environment != Tools.Environment.Production) {
      this.$scope.commentLikeStates = {};
      if (this.$scope.w6.userInfo.id) {
        this.$timeout(() => this.$scope.request(GetCollectionCommentLikeStateQuery, { collectionId: this.$scope.model.id })
          .then(results => this.subscriptionQuerySucceeded(results, this.$scope.commentLikeStates))
          .catch(this.breezeQueryFailed));
      }

      this.$scope.likeComment = comment => {
        return this.$scope.request(LikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() =>
          this.applyIfNeeded(() => {
            comment.likesCount += 1;
            this.$scope.commentLikeStates[comment.id] = true;
          })
        );
      };
      this.$scope.unlikeComment = comment => {
        return this.$scope.request(UnlikeCollectionCommentCommand, { collectionId: this.$scope.model.id, id: comment.id }).then(() => 
          this.applyIfNeeded(() => {
            comment.likesCount -= 1;
            this.$scope.commentLikeStates[comment.id] = false;
          })
        );
      };
    }

    this.$timeout(() => this.$scope.request(GetCollectionCommentsQuery, { collectionId: this.$scope.model.id }));
  }

}

registerController(CollectionInfoController);

export interface ICollectionContentScope extends ICollectionScope, IContentIndexScope {
  items: breeze.Entity[];
  totalServerItems;
  pagingOptions: { currentPage: number };
  totalPages;
  otherOptions: { view: string };
  contentTags;
  addTag(tag);
}

export class CollectionRelatedController extends ContentController {
  static $name = 'CollectionRelatedController';

  constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
    super($scope, logger, $routeParams, $q);

    if ($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
    //$scope.model.entityAspect.loadNavigationProperty("forkedCollections");

    this.setupTitle("model.name", "Related - {0} - " + $scope.model.game.name);
  }
}

registerController(CollectionRelatedController);

// Not used right now..
export class CollectionCommentsController extends ContentController {
  static $name = 'CollectionCommentsController';

  constructor(public $scope: ICollectionScope, public logger, public $routeParams, $q) {
    super($scope, logger, $routeParams, $q);
    this.setupTitle("model.name", "Content - {0} - " + $scope.model.game.name);
  }
}

registerController(CollectionCommentsController);

export class GetCollectionQuery extends DbQueryBase {
  static $name = "GetCollection";

  public execute = [
    'gameSlug', 'collectionId', (gameSlug, collectionId) => this.executeKeyQuery<IBreezeCollection>(
      () => this.getEntityQueryFromShortId("Collection", collectionId)
        .withParameters({ id: Tools.fromShortId(collectionId) })).then(x => {
          if (x.latestVersionId) {
            var query = breeze.EntityQuery.from("CollectionVersions").expand(["dependencies"])
              .where("id", breeze.FilterQueryOp.Equals, x.latestVersionId)
              .withParameters({ myPage: true });
            return this.context.executeQuery<IBreezeCollectionVersion>(query).then(_ => x);
          }
          return x;
        })
  ];
}

export class GetCollectionCommentsQuery extends DbQueryBase {
  static $name = 'GetCollectionComments';

  public execute = [
    'collectionId',
    (collectionId) => {
      Tools.Debug.log("getting collectioncomments by id: " + collectionId.toString());
      var query = breeze.EntityQuery.from("CollectionComments")
        // TODO: Allow loading 'leafs' on the fly? Or another form of pagination?
        // S.O or endless query?
        //.where("replyToId", breeze.FilterQueryOp.Equals, null)
        //.expand("replies")
        .where("collectionId", breeze.FilterQueryOp.Equals, collectionId)
        .orderByDesc("created");
      return this.context.executeQuery(query)
        .then((result) => result.results);
    }
  ];
}
export class OpenRepoCollectionDialogQuery extends DialogQueryBase {
  static $name = 'OpenRepoCollectionDialog';

  public execute = ['model', (model) => this.openDialog(RepoCollectionDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model } })]; //public execute = ['model', (model) => this.openDialog(ArchiveModDialogController, { size: 'sm|lg', resolve: { model: () => model } })]
  //public execute = ['model', (model) => this.createDialog(ArchiveModDialogController, model, {size: 'sm|lg'})]
  //public execute = (model) => this.createDialog(ArchiveModDialogController, {size: 'sm|lg'})
}

registerCQ(OpenRepoCollectionDialogQuery);

export class CreateCollectionCommentCommand extends DbCommandBase implements ICQWM<ICreateComment<IBreezeCollectionComment>> {
  static $name = 'CreateCollectionComment';

  static $ModelType: ICreateComment<IBreezeCollectionComment> = null;
  public $ModelType = null;

  public execute = [
    'model', (model: ICreateComment<IBreezeCollectionComment>) => {
      var entity = <IBreezeCollectionComment>this.context.createEntity("CollectionComment", { collectionId: model.contentId, authorId: this.context.w6.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
      if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
      return this.context.saveChanges(undefined, [entity]);
    }
  ];
}

export class OpenNewCollectionWelcomeDialogQuery extends DialogQueryBase {
  static $name = 'OpenNewCollectionWelcomeDialog';

  public execute = ['model', 'editConfig', (model, editConfig) => this.openDialog(CollectionNewCollectionWelcomeDialogController, { /*windowTemplateUrl: "/src_legacy/app/components/dialogs/window-center-template.html",*/ resolve: { model: () => model, editConfig: () => editConfig } })];
}

registerCQ(OpenNewCollectionWelcomeDialogQuery);

export class CollectionNewCollectionWelcomeDialogController extends ModelDialogControllerBase<{ model: IBreezeCollection, repoLanding: boolean }> {
  static $name = 'CollectionNewCollectionWelcomeDialogController';
  static $view = '/src_legacy/app/play/collections/dialogs/new-collection-welcome.html';

  static $inject = ['$scope', 'logger', '$modalInstance', '$q', 'model', 'editConfig'];

  constructor(public $scope, public logger, $modalInstance, $q, model: { model: IBreezeCollection, repoLanding: boolean }, editConfig: IEditConfiguration<IBreezeMod>) {
    super($scope, logger, $modalInstance, $q, model);

    //$scope.editconfig = editConfig;

    $scope.edit = () => {
      editConfig.enableEditing();
      $scope.$close();
    };
  }
}

registerController(CollectionNewCollectionWelcomeDialogController);

export class DeleteCollectionCommentCommand extends DbCommandBase {
  static $name = 'DeleteCollectionComment';

  public execute = [
    'model', (model: IBreezeCollectionComment) => {
      Tools.Debug.log('Delete comment', model);
      model.archivedAt = new Date(Date.now());
      return this.context.saveChanges(undefined, [model]);
    }
  ];
}

export class GetForkedCollectionsQuery extends DbQueryBase {
  static $name = 'GetForkedCollections';

  // TOdo: mISSING IS:             if($scope.model.forkedCollectionId) $scope.model.entityAspect.loadNavigationProperty("forkedCollection");
  public execute = [
    'collectionId', 'gameSlug',
    (collectionId, gameSlug) => this.context.executeQuery(breeze.EntityQuery.from("Collections")
      .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("forkedCollectionId", breeze.FilterQueryOp.Equals, Tools.fromShortId(collectionId)))))
      .then(result => result.results)
  ];
}


export class SaveCollectionCommentCommand extends DbCommandBase implements ICQWM<IBreezeCollectionComment> {
  static $name = 'SaveCollectionComment';
  public $ModelType = null;

  public execute = [
    'model', (model: IBreezeCollectionComment) => {
      //model.entityAspect.setDeleted();
      return this.context.saveChanges(undefined, [model]);
    }
  ];
}

export class GetCollectionCommentLikeStateQuery extends DbQueryBase {
  static $name = 'GetCollectionCommentLikeState';
  public execute = ['collectionId', collectionId => this.context.getCustom('comments/collections/' + collectionId + "/states")];
}

registerCQ(GetCollectionCommentLikeStateQuery);

export class LikeCollectionCommentCommand extends DbCommandBase {
  static $name = 'LikeCollectionCommentCommand';
  public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "like")];
}

registerCQ(LikeCollectionCommentCommand);

export class UnlikeCollectionCommentCommand extends DbCommandBase {
  static $name = 'UnlikeCollectionCommentCommand';
  public execute = ['id', id => this.context.postCustom("comments/collection/" + id + "/" + "unlike")];
}

registerCQ(UnlikeCollectionCommentCommand);

export class SubscribeCollectionCommand extends DbCommandBase {
  static $name = 'SubscribeCollectionCommand';
  public execute = [
    'model', (model: IBreezeCollection) =>
      this.context.postCustom("collections/" + model.id + "/subscribe")
  ];
}

registerCQ(SubscribeCollectionCommand);

export class UnsubscribeCollectionCommand extends DbCommandBase {
  static $name = 'UnsubscribeCollectionCommand';
  public execute = [
    'model', (model: IBreezeCollection) =>
      this.context.postCustom("collections/" + model.id + "/unsubscribe")
  ];
}

registerCQ(UnsubscribeCollectionCommand);

export class GetCollectionContentTagsQuery extends DbQueryBase {
  static $name = 'GetCollectionContentTags';
  public execute = [
    'id', id => this.context.getCustom('collectionversions/' + id + '/contenttags')
  ];
}

registerCQ(GetCollectionContentTagsQuery);

registerCQ(GetForkedCollectionsQuery);
registerCQ(GetCollectionQuery);
registerCQ(GetCollectionCommentsQuery);
registerCQ(CreateCollectionCommentCommand);
registerCQ(DeleteCollectionCommentCommand);
registerCQ(SaveCollectionCommentCommand);
