import {ContentViewModel} from './base';
import {ContentDeleted, Command, BasketItemType, IBasketItem, Base, IPromiseFunction, uiCommand2, MenuItem, VoidCommand, DbQuery, DbClientQuery, handlerFor, IContent, TypeScope, ICollection} from '../../../framework';
import {ViewModel, Query, IGame, ITab, IMenuItem,
  CollectionScope, IBreezeCollectionVersion, IBreezeCollectionVersionDependency, UiContext, CollectionHelper, UninstallContent,
  ReactiveList, FindModel, ActionType, BasketState, BasketType, ConnectionState, Debouncer, GameChanged, uiCommandWithLogin2, GameClientInfo, MessageDialog, Confirmation,
  IBreezeCollection, IRequireUser, IUserInfo, W6Context, Client, UploadService, BasketService, CollectionDataService, Utils, requireUser, SelectTab} from '../../../framework';
import {Basket, GameBaskets} from '../../game-baskets';
import {inject} from 'aurelia-framework';

export class Collection extends ContentViewModel<ICollection> {
  fork: () => Promise<any>;
  icon = "withSIX-icon-Nav-Collection";
  scopeIcon: string;
  delete: ICommand<void>;
  edit: ICommand<boolean>;
  loadIntoPlaylist: ICommand<void>
  topMenuActions = []

  async activate(model: ICollection) {
    await super.activate(model);
    this.scopeIcon = this.getScopeIcon();
  }

  setupMenuItems() {
    let published = this.model.typeScope == TypeScope.Published;

    this.subscriptions.subd(d => {
      d(Base.observeEx(this.model, x => x.hasServers)
        .subscribe(x => x ? this.launch.name = 'Join' : 'Launch'));
      if (published) {
        d(this.edit = uiCommand2("Edit", async () => this.navigateInternal("/p/" + this.model.gameSlug + "/collections/" + this.model.id.toShortId() + "/" + this.model.name.sluggify() + "/content/edit"), { icon: "icon withSIX-icon-Edit-Pencil" }))
        this.topMenuActions.push(new MenuItem(this.edit))
      }

      if ((published || this.model.typeScope == TypeScope.Subscribed)) {
        d(this.loadIntoPlaylist = uiCommand2("Load into playlist", this.loadIntoPlaylistInternal, { icon: "icon withSIX-icon-Edit-Pencil" }))
        this.topMenuActions.push(new MenuItem(this.loadIntoPlaylist))
      }

      d(this.fork = uiCommand2("Save as copy", async () => {
        let id = await new ForkCollection(this.model.id).handle(this.mediator);
        this.navigateInternal("/p/" + this.model.gameSlug + "/collections/" + id.toShortId() + "/" + (this.model.name + " [Forked]").sluggify());
      }, { icon: "fa fa-code-fork" }));
      this.topMenuActions.push(new MenuItem(this.fork));

      if (this.model.typeScope != null) {
        d(this.delete = this.createDeleteCommand());
        this.topMenuActions.push(new MenuItem(this.delete));
      }
    })

    super.setupMenuItems();
  }

  loadIntoPlaylistInternal = async () => {
    await new LoadCollectionIntoBasket(this.model.id).handle(this.mediator);
    this.eventBus.publish(new SelectTab('playlist'));
  }

  getInstallSpec() { return { id: this.model.id, isOnlineCollection: this.model.typeScope != TypeScope.Local }; }

  toBasketInfo(): IBasketItem {
    return {
      id: this.model.id, packageName: this.model.packageName,
      gameId: this.model.gameId,
      itemType: BasketItemType.Collection,
      author: this.model.author,
      image: this.model.image,
      name: this.model.name,
      sizePacked: this.model.sizePacked,
      isOnlineCollection: this.model.typeScope != TypeScope.Local
    };
  }

  createDeleteCommand = () => this.model.typeScope == TypeScope.Subscribed
    ? uiCommand2("Unsubscribe", () => this.deleteInternal("This will unsubscribe from the collection, do you want to continue?", "Unsubscribe collection?"),
      { icon: "icon withSIX-icon-Square-X" })
    : uiCommand2("Delete", () => this.deleteInternal("This will delete your collection, do you want to continue?", "Delete collection?"), { icon: "icon withSIX-icon-Square-X" })

  deleteInternal = async (title: string, message: string) => {
    let confirmations: Confirmation[] = [{ text: 'Uninstall all mods from this collection', icon: 'withSIX-icon-Alert', hint: "This will physically delete all the content of this collection, even if its being used elsewhere" }]; // todo; have the checked ones come back over the result instead?
    let r = await this.showMessageDialog(title, message, MessageDialog.YesNo, confirmations);
    if (r.output != "yes") return;
    await new DeleteCollection(this.model.id, this.model.gameId, this.model.typeScope).handle(this.mediator);
    // TODO: Extend delete?
    if (confirmations[0].isChecked)
      await new UninstallContent(this.model.gameId, this.model.id, { text: this.model.name }).handle(this.mediator);
  }

  getScopeIcon() {
    switch (this.model.typeScope) {
      case TypeScope.Subscribed: return "withSIX-icon-System-Remote";
      case TypeScope.Published: return "withSIX-icon-Cloud";
    }
    return "";
  }
}

export class DeleteCollection extends VoidCommand {
  constructor(public id: string, public gameId: string, public typeScope: TypeScope) { super() }
}

@handlerFor(DeleteCollection)
class DeleteCollectionHandler extends DbClientQuery<DeleteCollection, void> {
  async handle(request: DeleteCollection) {
    if (request.typeScope == TypeScope.Subscribed) await this.context.postCustom("collections/" + request.id + "/unsubscribe");
    if (request.typeScope == TypeScope.Published) await this.context.deleteCustom("collections/" + request.id);
    await this.client.deleteCollection({ gameId: request.gameId, id: request.id });
    this.publishCrossEvent('content-deleted', new ContentDeleted(request.gameId, request.id));
  }
}


export class ForkCollection extends Command<string> {
  constructor(public id: string) { super() }
}

@handlerFor(ForkCollection)
export class ForkCollectionHandler extends DbQuery<ForkCollection, string> {
  async handle(request: ForkCollection) {
    let r = await this.context.postCustom<string>("collections/" + request.id + "/fork");
    return r.data;
  }
}

export class GetDependencies extends Query<IBreezeCollectionVersionDependency[]> {
  constructor(public id: string) { super() }
}

@handlerFor(GetDependencies)
class GetDependenciesHandler extends DbQuery<GetDependencies, IBreezeCollectionVersionDependency[]> {
  async handle(request: GetDependencies) {
    var query = breeze.EntityQuery.from("CollectionVersions").expand(["dependencies"])
      .where("id", breeze.FilterQueryOp.Equals, request.id)
      .select(["dependencies"])
      .withParameters({ myPage: true });
    let r = await this.context.executeQuery<IBreezeCollectionVersion>(query);
    return r.results[0].dependencies;
  }
}

export class LoadCollectionIntoBasket extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(LoadCollectionIntoBasket)
@inject(W6Context, Client, UploadService, BasketService, CollectionDataService)
class LoadCollectionIntoBasketHandler extends DbClientQuery<LoadCollectionIntoBasket, void> {
  constructor(dbContext, client, uploadService, bs: BasketService, private collectionDataService: CollectionDataService) {
    super(dbContext, client, uploadService, bs);
  }
  async getDependencies(request: GetDependencies) {
    var query = breeze.EntityQuery.from("CollectionVersions").expand(["dependencies"])
      .where("id", breeze.FilterQueryOp.Equals, request.id)
      .select(["dependencies"])
      .withParameters({ myPage: true });
    let r = await this.context.executeQuery<IBreezeCollectionVersion>(query);
    return r.results[0].dependencies;
  }

  async handle(request: LoadCollectionIntoBasket) {
    let r = await this.collectionDataService.getCollectionsByIds([request.id], {});
    let col = r.results[0];
    let dependencies = await this.getDependencies(new GetDependencies(col.latestVersionId));
    let baskets: GameBaskets = this.basketService.basketService.getGameBaskets(col.gameId);
    baskets.replaceBasket();
    let basket = baskets.active;
    basket.model.isTemporary = ((col.author && col.author.id) || col.authorId) != this.w6.userInfo.id;
    basket.replaceItems(dependencies.map(x => {
      return {
        name: x.dependency,
        packageName: x.dependency,
        constraint: x.constraint,
        id: x.modDependencyId,
        itemType: BasketItemType.Mod,
        gameId: col.gameId,
        image: null,
        author: null,
        sizePacked: null
      }
    }));
    basket.model.collectionId = col.id;
    basket.model.name = col.name;
  }
}
