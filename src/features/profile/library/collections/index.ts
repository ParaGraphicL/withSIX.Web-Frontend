import {BaseGame} from '../../lib';
import {ContentDeleted, CollectionHelper, IUserInfo, IBreezeCollection, W6Context, Client, CollectionDataService, UiContext, uiCommandWithLogin, IFilter, ISort, SortDirection, Query, DbClientQuery, handlerFor, IRequireUser, requireUser, IContent, TypeScope, ICollection, BasketService} from '../../../../framework';
import {Router} from 'aurelia-router';
import {inject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {CreateCollectionDialog} from '../../../games/collections/create-collection-dialog';

@inject(UiContext)
export class Index extends BaseGame {
  heading = "Collections"
  gameName: string;
  itemType = "collection";

  filters: IFilter<ICollection>[] = [
    //{name: "Local", isEnabled: true, filter: item => item.typeScope == TypeScope.Local},
    { name: "Private", isEnabled: true, filter: item => item.authorSlug == this.w6.userInfo.slug }, // TODO
    { name: "Subscribed", isEnabled: true, filter: item => item.typeScope == TypeScope.Subscribed },
    { name: "Published", isEnabled: true, filter: item => item.typeScope == TypeScope.Published }]

  constructor(ui: UiContext) { super(ui); }

  async activate(params, routeConfig) {
    super.activate(params, routeConfig);
    var r = await new GetCollections(this.game.id).handle(this.mediator)
    this.subscriptions.subd(d => {
      d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
    })
    this.items = r.items;
  }

  createNew = uiCommandWithLogin(async () => {
    return this.dialog.open({ viewModel: CreateCollectionDialog, model: { game: this.game } }); ////return this.legacyMediator.openAddCollectionDialog(this.game.slug);
  })

  contentDeleted = (evt: ContentDeleted) => {
    let deleteIfHas = (list: any[], id: string) => {
      var item = list.asEnumerable().firstOrDefault(x => x.id == id);
      if (item) this.tools.removeEl(list, item);
    }
    deleteIfHas(this.items, evt.id);
  }
}

interface ICollectionsData {
  items: ICollection[];
}

@requireUser()
class GetCollections extends Query<ICollectionsData> implements IRequireUser {
  constructor(public id: string) { super() }
  user: IUserInfo;
}

@handlerFor(GetCollections)
@inject(W6Context, Client, BasketService, CollectionDataService)
class GetCollectionsHandler extends DbClientQuery<GetCollections, ICollectionsData> {
		constructor(dbContext, modInfoService, bs: BasketService, private collectionDataService: CollectionDataService) {
    super(dbContext, modInfoService, bs);
		}
		// TODO: Merge all data from client, and web queries etc... :S
  public async handle(request: GetCollections): Promise<ICollectionsData> {
    var optionsTodo = {
      /*                    filter: {},
                          sort: {
                              fields: [],
                              directions: []
                          },
                          pagination: {}*/
    };
    // TODO: only if client connected get client info.. w6.miniClient.isConnected // but we dont wait for it so bad idea for now..
    // we also need to refresh then when the client is connected later?
    var p: Promise<ICollection[]>[] = [
      //this.getClientCollections(request)
    ];

    if (request.user.id) p.push(this.getSubscribedCollections(request, optionsTodo), this.getMyCollections(request, optionsTodo));
		  var results = await Promise.all(p)
		  return { items: results.flatten<ICollection>() };
    // return GetCollectionsHandler.designTimeData(request);
  }

		async getClientCollections(request: GetCollections): Promise<ICollection[]> {
    try {
      var r = await this.client.getGameCollections(request);
      r.items.forEach(x => x.typeScope = TypeScope.Local);
      return r.items;
    } catch (err) {
      this.tools.Debug.warn("Error while trying to get collections from client", err);
      return [];
    }
		}

		async getMyCollections(request: GetCollections, options) {
    var r = await this.collectionDataService.getCollectionsByMeByGame(request.id, options)
    return r.map(x => CollectionHelper.convertOnlineCollection(x, TypeScope.Published, this.w6));
		}

		async getSubscribedCollections(request: GetCollections, options) {
    var r = await this.collectionDataService.getMySubscribedCollections(request.id, options);
			 return r.map(x => CollectionHelper.convertOnlineCollection(x, TypeScope.Subscribed, this.w6));
		}

		static async designTimeData(request: GetCollections) {
    var testData = <any>[{
      id: "x",
      name: "Test collection",
      slug: "test-collection",
      type: "collection",
      isFavorite: false,
      gameId: request.id,
      gameSlug: "arma-3",
      author: "Some author",
      image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
      typeScope: TypeScope.Local
    }, {
        id: "x",
        name: "Test collection 2",
        slug: "test-collection-2",
        type: "collection",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
        typeScope: TypeScope.Local
      }, {
        id: "x",
        name: "Test collection 3",
        slug: "test-collection-3",
        type: "collection",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
        typeScope: TypeScope.Published
      }, {
        id: "x",
        name: "Test collection 4",
        slug: "test-collection-4",
        type: "collection",
        isFavorite: false,
        gameId: request.id,
        gameSlug: "arma-3",
        author: "Some author",
        image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
        typeScope: TypeScope.Subscribed
      }];
    return {
      collections: testData.concat(testData, testData)
    };
		}
}
