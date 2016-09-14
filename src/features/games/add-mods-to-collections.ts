import {inject} from 'aurelia-framework';
import {W6Context, CollectionDataService, Dialog, DbQuery, Query, VoidCommand, handlerFor, uiCommand2} from '../../framework';

export interface IAddModsToCollections {
  gameId: string;
  mods: { id: string, name: string, groupId: string }[]
  //collections: {id: string, name: string}[];
}

interface ICollection {
  id?: string; name: string;
}

interface ICollectionsData {
  collections: ICollection[];
}

export class AddModsToCollections extends Dialog<IAddModsToCollections> {
  collections: ICollection[];
  selectedCollections: ICollection[] = [];
  model: IAddModsToCollections;
  async activate(model: IAddModsToCollections) {
    super.activate(model);
    let result = await new GetCollections(model.gameId, model.mods[0].groupId).handle(this.mediator);
    this.collections = result.collections;
  }

  ok = uiCommand2("Ok", async () => {
    await new AddModsToCollectionsCommand(this.model.mods.map(x => x.id), this.selectedCollections.map(x => x.id)).handle(this.mediator);
    this.controller.ok(null);
  }, { cls: "ok" })

  cancel = uiCommand2("Cancel", () => this.controller.cancel(null), { cls: "cancel" });
}

export class GetCollections extends Query<ICollectionsData> {
  constructor(public gameId: string, public groupId: string) { super() }
}

@handlerFor(GetCollections)
@inject(W6Context, CollectionDataService)
export class GetCollectionsHandler extends DbQuery<GetCollections, ICollectionsData> {
  constructor(dbContext, private collectionDataService: CollectionDataService) { super(dbContext); }

  async handle(request: GetCollections) {
    let r = await this.collectionDataService.getCollectionsByMeByGame(request.gameId, {});
    if (request.groupId != null) r = r.filter(x => x.groupId == request.groupId)
    return { collections: r };
  }
}

export class AddModsToCollectionsCommand extends VoidCommand {
  constructor(public modIds: string[], public collectionIds: string[]) { super() }
}

@handlerFor(AddModsToCollectionsCommand)
export class AddModsToCollectionsHandler extends DbQuery<AddModsToCollectionsCommand, void> {
  async handle(request: AddModsToCollectionsCommand) {
    await this.context.postCustom("collections/add-mods-to-collections", request);
  }
}
