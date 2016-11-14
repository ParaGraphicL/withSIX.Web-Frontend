// TODO: Both GameBaskets and Basket are implemented as ViewModels,
// however they do not conform to the usual Aurelia ViewModel lifecycle,
// instead they are manually managed. We should standardize this asap.
// However there is some complication because of legacy (Angular) code/references.

import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, Container } from 'aurelia-framework';
import {
  Base, LS, Notifier, Toastr, uiCommand2, ViewModel, ViewModelWithModel, SelectTab,
  BasketType, IBasketModel, IBasketItem, BasketState, IBasketCollection, W6Context, LaunchAction,
  SubscribeCollection, InstallContent, InstallContents, LaunchContents, LaunchContent, ContentHelper, Action,
  BasketItemType, DependencyType, StateChanged
} from '../framework';

import { Client, ConnectionState, IContentState, ItemState, IContentStateChange, IContentStatusChange, IClientInfo, IContentGuidSpec, IContentsBase, IContentBase } from 'withsix-sync-api';

import { CreateCollectionDialog } from './games/collections/create-collection-dialog';
import { LoadCollectionIntoBasket } from './profile/content/collection';

export class GameBaskets extends ViewModel {
  baskets: Basket[] = [];
  active: Basket = null;
  gameId: string;
  model: IBasketModel;

  constructor(ui) { super(ui); }

  activate(gameId: string, model: IBasketModel) {
    this.model = model;
    this.gameId = gameId;

    this.setDefaults();
    var failed: number[] = [];
    for (var i = 0; i < model.collections.length; i++) {
      try {
        var m = model.collections[i];
        if (m.name == 'Unsaved playlist') m.name = 'Playlist';
        var basket = this.createBasket(m);
        this.baskets.push(basket);
      } catch (e) {
        this.toastr.error("A Basket was damaged and had to be removed", "Error Loading Basket");
        failed.push(i);
      }
    }

    for (var j = 0; j < failed.length; j++) {
      model.collections.splice(failed.pop(), 1);
    }

    this.prepareActive();
  }

  createBasket(m: IBasketCollection) {
    var b = Container.instance.get(Basket);
    b.activate(m);
    return b;
  }

  private setDefaults() { }

  private getBasketFromModel(model: IBasketCollection): Basket {
    var basket = this.getBasketFromId(model.id);
    if (basket != null)
      return basket;
    var nBasket = this.createBasket(model);
    this.baskets.push(nBasket);
    return nBasket;
  }

  private getBasketFromId(id: string): Basket {
    for (var i = 0; i < this.baskets.length; i++) {
      var basket = this.baskets[i];
      if (basket.model.id === id)
        return basket;
    }
    return null;
  }

  private prepareActive() {
    if (this.model.collections.length === 0) {
      this.replaceBasket();
      return;
    }
    if (this.model.activeId == null) {
      this.setActiveBasket(this.getBasketFromModel(this.model.collections[0]));
      return;
    }
    if (this.model.activeId != null && this.active == null) {
      var basket = this.getBasketFromId(this.model.activeId);

      if (basket == null) {
        this.model.activeId = null;
        this.prepareActive();
      } else {
        this.setActiveBasket(basket);
      }
      return;
    }
  }

  private getNewBasketModel(): IBasketCollection {
    return {
      id: this.tools.generateGuid(),
      gameId: this.gameId,
      name: "Playlist",
      items: [], // this.getDtData();
      isPersistent: false,
      isTemporary: false,
      state: BasketState.Unknown,
      basketType: BasketType.Default
    };
  }

  replaceBasket = () => this.setActiveBasket(this.createNewBasket());
  cloneBasket(basket: Basket) { this.setActiveBasket(basket.clone()); }
  private createNewBasket(): Basket { return this.createNewBasketInner(this.getNewBasketModel()); }

  private createNewBasketInner(model: IBasketCollection): Basket {
    this.model.collections.push(model);
    var basket = this.createBasket(model);
    //this.baskets.push(basket);
    return basket;
  }

  deleteBasket(basket: Basket) {
    this.deleteBasketInternal(basket);
    this.prepareActive();
  }

  private deleteBasketInternal(basket: Basket) {
    this.baskets.splice(this.baskets.indexOf(basket), 1);
    this.model.collections.splice(this.model.collections.indexOf(basket.model), 1);
    this.model.activeId = null;
  }

  private setActiveBasket(basket: Basket) {
    if (this.active != null && this.active.model.isTemporary && this.active != basket) {
      this.deleteBasketInternal(this.active);
    }
    if (basket != null) {
      this.active = basket;
      this.model.activeId = basket.model.id;
    }
  }

  isBusy(clientInfo: IClientInfo) { return clientInfo.gameLock; }


  // Legacy for Angular
  handleAction(item: IBasketItem, clientInfo: IClientInfo, type: BasketType) {
    this.tools.Debug.log("$$$ handle action!!");
    if (this.isBusy(clientInfo)) throw new Error("Currently busy");
    // TODO: What about local collections?
    let isCollection = type == BasketType.SingleCollection;

    // executes in bg
    if (isCollection) this.subscribeCollection(item.id);
    return this.handleDirectAction(clientInfo, item, isCollection);
  }

  async subscribeCollection(id: string) { if (this.isLoggedIn) await new SubscribeCollection(id).handle(this.mediator); }

  private handleDirectAction(clientInfo: IClientInfo, item: IBasketItem, isCollection: boolean) {
    switch (ContentHelper.itemStateToAction(ContentHelper.getConstentStateInitial(clientInfo.content[item.id], item.constraint))) {
      case Action.Install:
        return new InstallContent(item.gameId, { id: item.id, constraint: item.constraint, isOnlineCollection: isCollection }, { text: item.name }).handle(this.mediator);
      case Action.Launch:
        return new LaunchContent(item.gameId, item.id, { text: item.name }).handle(this.mediator);
      default:
        throw new Error("Unsupported state");
    }
  }
}

// TODO: Convert to an automatically wrapped ViewModel, like all the rest!
export class Basket extends ViewModelWithModel<IBasketCollection> {
  public content = new Map<string, IBasketItem>();
  public chain = new Map<string, IBasketItem>();
  public stat = { sizePacked: 0 };

  constructor(ui) { super(ui); }

  activate(model: IBasketCollection) {
    this.model = model;
    this.setDefaults();
    for (var i = 0; i < model.items.length; i++) {
      let item = model.items[i];
      this.content.set(item.id, item);
    }
  }

  clone() {
    var b = Container.instance.get(Basket);
    b.activate(this.model);
    return b;
  }

  private setDefaults() {
    if (this.model.state == null) {
      this.model.state = BasketState.Unknown;
    }
    if (this.model.basketType == null) {
      this.model.basketType = BasketType.Default;
    }
  }

  getState(clientInfo: IClientInfo): BasketState {
    if (this.model.items.length == 0) return BasketState.Launch;
    // Process separately because Install vs Update
    for (var i = 0; i < this.model.items.length; i++) {
      var item = this.model.items[i];
      var rItem = clientInfo.content[item.id];
      if (rItem == null
        || rItem.state == ItemState.NotInstalled
        || rItem.state == ItemState.Incomplete)
        return BasketState.Install;
    }

    for (var i = 0; i < this.model.items.length; i++) {
      var item = this.model.items[i];
      var rItem = clientInfo.content[item.id];

      var state = ContentHelper.getConstentStateInitial(rItem, item.constraint);
      if (state === ItemState.UpdateAvailable) return BasketState.Update;
    }

    return BasketState.Launch;
  }

  getItem(id: string): IBasketItem {
    for (var i = 0; i < this.model.items.length; i++) {
      var item = this.model.items[i];
      if (item.id === id)
        return item;
    }
    return null;
  }

  removeFromBasket(item: IBasketItem) {
    if (this.model.isTemporary)
      return;
    this.tools.removeEl(this.model.items, this.getItem(item.id));
    this.model.changed = true;
    this.content.delete(item.id);
    this.publishPlaylistRefresh();
    this.notifier.raiseTabNotification("playlist", {
      title: 'removed from playlist', text: item.name, icon: 'withSIX-icon-Nav-Mod',
      href: this.getItemHref(item),
      cls: 'start',
      command: uiCommand2("", () => this.toggleInBasket(item), { tooltip: "Add to playlist", icon: 'withSIX-icon-Add' })
    });
    this.appEvents.emitBasketChanged();
  }

  publishPlaylistRefresh() { this.api.refreshPlaylist(); };

  replaceItems(items: IBasketItem[]) {
    items.forEach(x => {
      this.model.items.push(x);
      this.content.set(x.id, x);
    })
    this.publishPlaylistRefresh();
  }

  addToBasket(item: IBasketItem) {
    if (this.getItem(item.id) != null)
      return;
    if (this.model.basketType == BasketType.SingleItem && this.model.items.length !== 0)
      throw new Error("The basket is of SingleItem type, but more than one item was tried to be added!");

    if (item.itemType === BasketItemType.Collection && this.model.collectionId === item.id)
      throw new Error("Trying to add a collection to itself...");
    this.model.items.push(item);
    this.model.changed = true;
    this.content.set(item.id, item);
    this.publishPlaylistRefresh();
    // TODO: Better would be "ItemAddedToPlaylist" event...
    this.notifier.raiseTabNotification("playlist", {
      title: 'added to playlist', text: item.name, icon: 'withSIX-icon-Nav-Mod',
      href: this.getItemHref(item),
      cls: 'end',
      command: uiCommand2("", () => this.toggleInBasket(item), { tooltip: "Remove from playlist", icon: 'withSIX-icon-Checkmark' })
    });
    this.appEvents.emitBasketChanged();
  }

  getItemHref = (item: IBasketItem) => item.id ? `/p/${this.w6.activeGame.slug}/mods/${item.id.toShortId()}/${item.name.sluggify()}` : null;

  async toggleInBasket(item: IBasketItem) {
    if (this.model.isTemporary) {
      await this.toastr.warning(`If you want to edit a collection that is not yours, click on "save as copy" first, or click here`, 'Need to make a copy first')
        .then(x => {
          if (x) this.saveAsNewCollection();
        })
      return;
    }
    if (this.getItem(item.id) != null) this.removeFromBasket(item);
    else this.addToBasket(item);
  }

  async saveAsNewCollection() {
    var model = {
      name: this.model.name + ' (COPY)',
      gameId: this.model.gameId,
      version: "0.0.1",
      forkedCollectionId: this.model.collectionId,
      dependencies: this.model.items.map(this.basketItemToDependency)
    };
    var result = await this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: { id: this.model.gameId }, model: model } });
    if (result.wasCancelled) return;
    var id = result.output;
    await new LoadCollectionIntoBasket(id).handle(this.mediator);
    this.eventBus.publish(new SelectTab('playlist'));
  }

  basketItemToDependency = (x: IBasketItem) => {
    let dep: { dependency: string; dependencyType?: DependencyType; constraint?: string; collectionDependencyId?: string; modDependencyId?: string } = { dependency: x.packageName || x.id, constraint: x.constraint };
    if (x.itemType === BasketItemType.Collection) {
      if (x.id === null) throw new Error("Collection id cannot be null");
      dep.collectionDependencyId = x.id;
      dep.dependencyType = DependencyType.Collection;
      dep.dependency = x.id;
    }
    if (x.itemType === BasketItemType.Mod && x.id) dep.modDependencyId = x.id;
    return dep;
  }

  // deprecated
  clearBasket() {
    this.model.items.length = 0;
    this.model.changed = true;
    this.content = new Map<string, IBasketItem>();
    this.chain = new Map<string, any>();
    this.stat = { sizePacked: 0 };
  }

  getMainItem() {
    if (this.model.items.length == 0 || this.model.items.length > 1) return null;
    return this.model.items[0];
  }

  // getMainItemUrl() {
  //   let mainItem = this.getMainItem();
  //   return mainItem == null ? null : this.getItemHref(mainItem);
  // }
  // getMainItemName() {
  //   let mainItem = this.getMainItem();
  //   return mainItem == null ? null : (mainItem.name || mainItem.packageName);
  // }

  install = (hide = false) =>
    this.model.basketType === BasketType.SingleCollection
      || this.model.basketType === BasketType.SingleItem // TODO: Use polymorphism instead?
      ? this.installAsSingle(hide)
      : this.installAsMulti(hide)
  installAsMulti = (hide = false) => {
    this.tools.Debug.log("$$$ install as multi!!");
    var cmdData = this.basketToCommandData(hide);
    return new InstallContents(cmdData.gameId, cmdData.contents, { text: cmdData.name }).handle(this.mediator);
  }
  installAsSingle = (hide = false) => {
    this.tools.Debug.log("$$$ install as single!!");
    var cmdData2 = this.basketToCommandDataForSingleItem(hide);
    return new InstallContent(cmdData2.gameId, cmdData2.content, { text: cmdData2.name }).handle(this.mediator)
  }
  launch = (action?: LaunchAction) => {
    var cmd = this.basketToCommandData();
    return new LaunchContents(cmd.gameId, cmd.contents, { text: cmd.name }, action).handle(this.mediator);
  }
  update = () => this.install();
  play = this.launch;

  basketToCommandData(hideLaunchAction = false) {
    const content: IContentGuidSpec[] = [];
    for (let i = 0; i < this.model.items.length; i++) {
      const item = this.model.items[i];
      content.push({ id: item.id, isOnlineCollection: item.isOnlineCollection, constraint: item.constraint });
    }
    return {
      gameId: this.model.gameId,
      name: this.model.name,
      contents: content,
      hideLaunchAction: hideLaunchAction
    };
  }

  private basketToCommandDataForSingleItem(hideLaunchAction = false) {
    var item = this.model.items[0];
    return {
      gameId: this.model.gameId,
      name: item.name,
      content: { id: item.id, isOnlineCollection: item.isOnlineCollection, constraint: item.constraint },
      hideLaunchAction: hideLaunchAction
    };
  }
}

// PFF
Container.instance.registerTransient(Basket);
Container.instance.registerTransient(GameBaskets);
