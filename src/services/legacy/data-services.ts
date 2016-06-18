import {W6Context, W6ContextWrapper, IQueryResult} from '../w6context';
import breeze from 'breeze-client';
import {Tools} from '../tools'
import {IBreezeCollection, IBreezeMod, IBreezeMission} from '../dtos';

// DEPRECATED: Convert to Queries/Commands
export class CollectionDataService extends W6ContextWrapper {
  static $name = 'collectionDataService';
  public filterPrefixes = ["mod:", "user:", "tag:"];

  public getCollectionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeCollection>> {
    Tools.Debug.log("getting collections by game: " + gameSlug + ", " + options);
    var query = breeze.EntityQuery.from("Collections")
      .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

    return this.query(query, options);
  }

  public getCollectionsByIds(ids: string[], options): Promise<IQueryResult<IBreezeCollection>> {
    Tools.Debug.log("getting collections by ids: " + ids + ", " + options);
    var jsonQuery = {
      from: 'Collections',
      where: {
        'id': { in: ids }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["latestVersion"].concat(options.expand || []));
    return this.query(query, options);
  }

  public getCollectionsByAuthor(userSlug, options): Promise<IQueryResult<IBreezeCollection>> {
    Tools.Debug.log("getting collections by author: " + userSlug + ", " + options);
    var query = breeze.EntityQuery.from("Collections")
      .where("author.slug", breeze.FilterQueryOp.Equals, userSlug);
    return this.query(query, options);
  }

  public getCollectionsByMe(options): Promise<IQueryResult<IBreezeCollection>> {
    var userSlug = this.userInfo.slug;
    Tools.Debug.log("getting collections by me: " + userSlug + ", " + options);
    var query = breeze.EntityQuery.from("Collections").expand(["latestVersion"].concat(options.expand || []))
      .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
      .withParameters({ myPage: true });
    return this.query(query, options);
  }

  public async getCollectionsByMeByGame(gameId, options): Promise<IBreezeCollection[]> {
    var userSlug = this.userInfo.slug;
    Tools.Debug.log("getting collections by me: " + userSlug + ", " + options);
    var query = breeze.EntityQuery.from("Collections").expand(["latestVersion"].concat(options.expand || []))
      .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
      .where("gameId", breeze.FilterQueryOp.Equals, gameId)
      .withParameters({ myPage: true });
    var r = await this.query(query, options);
    return r.results;
  }

  public async getMySubscribedCollections(gameId, options?) {
    let r = await this.getSubscribedCollectionIdsByGameId(gameId);
    if (r.data.length == 0) return [];
    let r2 = await this.getCollectionsByIds(r.data, options);
    return r2.results;
  }

  // can't be used due to virtual properties
  private getDesiredFields = (query) => query.select(["id", "name", "gameId", "game", "groupId", "group", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "size", "sizePacked", "subscribersCount", "modsCount"]);

  private query(query, options): Promise<IQueryResult<IBreezeCollection>> {
    if (options.filter) {
      var requiresDependencies = options.filter.text && options.filter.text != '' && options.filter.text.containsIgnoreCase('mod:');
      if (requiresDependencies) {
        if (options.sort && options.sort.fields && options.sort.fields.indexOf("author") > -1) {
          // This is currently unsupported either by Breeze, EF, OData, or AutoMapper
          var defer = this.$q.defer();
          defer.reject(new Error("Cannot search for mods while sorted by author, please choose a different sorting option, or don't search for a mod"));
          return <any>defer.promise;
        }
        query = query.expand(["dependencies"]);
      }

      query = this.applyFiltering(query, options.filter, true)
        .orderBy(this.context.generateOrderable(options.sort));
    }

    if (options.pagination)
      query = this.context.applyPaging(query, options.pagination);

    //query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeCollection>(query);
  }

  public getCollectionTagsByGame(gameSlug, name) {
    Tools.Debug.log("getting collection names: " + gameSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("Collections")
      .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug)
      .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

  public getSubscribedCollectionIdsByGameId(gameId: string) {
    Tools.Debug.log("getting subscribed collection ids");
    return this.context.get<string[]>('SubscribedCollections', { gameId: gameId });
  }

  public getSubscribedCollectionIds(gameSlug: string) {
    Tools.Debug.log("getting subscribed collection ids");
    return this.context.get<string[]>('SubscribedCollections', { gameSlug: gameSlug });
  }

  private getDependenciesQuery(split): breeze.Predicate {
    var pred: breeze.Predicate;
    for (var v in split) {
      var p = this.searchDependencies(breeze, split[v]);
      pred = pred == null ? p : pred.and(p);
    }

    return pred;
  }

  private searchDependencies(breeze, lc): breeze.Predicate {
    return breeze.Predicate.create("dependencies", "any", "dependency", breeze.FilterQueryOp.Contains, lc);
  }

  public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

    var pred = this.context.getNameQuery(info.name);
    var pred2 = this.context.getTagsQuery(info.tag);
    var pred3 = this.context.getAuthorQuery(info.user);
    var pred4 = this.getDependenciesQuery(info.mod);

    return this.context.buildPreds(query, [pred, pred2, pred3, pred4]);
  }

  getCollectionTagsByAuthor(userSlug, name: string) {
    Tools.Debug.log("getting collection names: " + userSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("Collections")
      .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }
}

// DEPRECATED: Convert to Queries/Commands
export class MissionDataService extends W6ContextWrapper {
  static $name = 'missionDataService';

  public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

    var pred = this.context.getNameQuery(info.name);
    var pred2 = this.context.getTagsQuery(info.tag);
    var pred3 = this.context.getAuthorQuery(info.user);

    return this.context.buildPreds(query, [pred, pred2, pred3]);
  }

  public getMissionsByGame(gameSlug, name) {
    Tools.Debug.log("getting missions by game: " + gameSlug + ", " + name);
    var query = breeze.EntityQuery.from("Missions")
      .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", breeze.FilterQueryOp.Contains, name.toLowerCase())))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

  public getMissionTagsByGame(gameSlug, name) {
    Tools.Debug.log("getting mission names: " + gameSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("Missions")
      .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

  public getMissionTagsByAuthor(authorSlug, name) {
    Tools.Debug.log("getting mission names: " + authorSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("MissionsByAuthor")
      .withParameters({ authorSlug: authorSlug })
      .where(new breeze.Predicate("toLower(name)", op, key))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

  public getAllMissionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeMission>> {
    Tools.Debug.log("getting missions by game: " + gameSlug, options);
    var query = breeze.EntityQuery.from("Missions")
      .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

    query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      return <any>this.$q.reject("invalid query");

    query = query.orderBy(this.context.generateOrderable(options.sort));

    query = this.context.applyPaging(query, options.pagination);

    //query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMission>(query);
  }

  public getAllMissionsByAuthor(authorSlug, options): Promise<IQueryResult<IBreezeMission>> {
    Tools.Debug.log("getting missions by author: " + authorSlug);
    var query = breeze.EntityQuery.from("Missions")
      .where("author.slug", breeze.FilterQueryOp.Equals, authorSlug);

    query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      return <any>this.$q.reject("invalid query");

    query = query.orderBy(this.context.generateOrderable(options.sort));

    query = this.context.applyPaging(query, options.pagination);
    //query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMission>(query);
  }

  // can't be used due to virtual properties
  private getDesiredFields(query) {
    return query.select(["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "authorId", "author", "gameId", "game", "size", "sizePacked", "followersCount", "modsCount"]);
  }

  public getFollowedMissionIds(gameSlug: string) {
    Tools.Debug.log("getting followed mission ids");
    return this.context.get('FollowedMissions', { gameSlug: gameSlug });
  }
}

// DEPRECATED: Convert to Queries/Commands
export class ModDataService extends W6ContextWrapper {
  static $name = 'modDataService';

  public getModsInCollection(collectionId, options): Promise<IQueryResult<IBreezeMod>> {
    Tools.Debug.log("getting mods in collection: " + collectionId);
    var query = breeze.EntityQuery.from("ModsInCollection")
      .withParameters({ collectionId: collectionId })
      .expand(["categories"]);

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      return <any>this.$q.reject("invalid query");

    query = query.orderBy(this.context.generateOrderable(options.sort));

    query = this.context.applyPaging(query, options.pagination);
    query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMod>(query);
  }

  public getModsInCollectionByName(collectionId, name) {
    Tools.Debug.log("getting mods in collection: " + collectionId);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("ModsInCollection")
      .withParameters({ collectionId: collectionId })
      .expand(["categories"])
      .where(new breeze.Predicate("toLower(packageName)", op, key)
        .or(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("packageName")
      .select(["packageName", "name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

  public getAllModsByGame(gameIds: string[], options) {
    Tools.Debug.log("getting mods by game: " + gameIds.join(", "), options);
    var jsonQuery = {
      from: 'Mods',
      where: {
        'gameId': { in: gameIds }
      }
    }
    var query = new breeze.EntityQuery(jsonQuery).expand(["categories"]);

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      return <any>this.$q.reject("invalid query");

    if (options.sort && options.sort.fields.length > 0)
      query = query.orderBy(this.context.generateOrderable(options.sort));

    if (options.pagination)
      query = this.context.applyPaging(query, options.pagination);
    query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMod>(query);
  }

  private getDesiredFields = query => query.select(["id", "name", "packageName", "group", "groupId", "gameId", "game", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "authorText", "size", "sizePacked", "followersCount", "modVersion", "stat", "latestStableVersion"]);

  public getAllModsByAuthor(authorSlug: string, options): Promise<IQueryResult<IBreezeMod>> {
    Tools.Debug.log("getting mods by author: " + authorSlug);
    var query = breeze.EntityQuery.from("Mods")
      .where("author.slug", breeze.FilterQueryOp.Equals, authorSlug);

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      return <any>this.$q.reject("invalid query");

    if (options.sort && options.sort.fields.length > 0)
      query = query.orderBy(this.context.generateOrderable(options.sort));

    if (options.pagination)
      query = this.context.applyPaging(query, options.pagination);
    query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMod>(query);
  }

  public getTagsQuery(split): breeze.Predicate {
    var pred: breeze.Predicate;
    for (var v in split) {
      var p = this.searchTags(breeze, split[v]);
      pred = pred == null ? p : pred.and(p);
    }

    return pred;
  }

  public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.context.filterPrefixes);
    var pred = this.getNameQuery(info.name);
    var pred2 = this.getTagsQuery(info.tag);
    var pred3 = this.getAuthorQuery(info.user);

    return this.context.buildPreds(query, [pred, pred2, pred3]);
  }

  public getNameQuery(split: string[]): breeze.Predicate {
    return this.context.findInField(split, ["packageName", "name"], undefined);
  }

  public getAuthorQuery(split): breeze.Predicate {
    var pred: breeze.Predicate;
    for (var v in split) {
      var p = new breeze.Predicate("toLower(author.userName)", breeze.FilterQueryOp.Contains, split[v])
        .or(new breeze.Predicate("toLower(author.displayName)", breeze.FilterQueryOp.Contains, split[v]))
        .or(new breeze.Predicate("toLower(authorText)", breeze.FilterQueryOp.Contains, split[v]));
      pred = pred == null ? p : pred.and(p);
    }
    return pred;
  }

  public getFollowedModIds(gameSlug: string) {
    Tools.Debug.log("getting followed mod ids");
    return this.context.get('FollowedMods', { gameSlug: gameSlug });
  }

  private searchTags(breeze, lc): breeze.Predicate {
    return breeze.Predicate.create("categories", "any", "name", breeze.FilterQueryOp.Contains, lc);
  }
}
