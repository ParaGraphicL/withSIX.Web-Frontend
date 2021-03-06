import { W6Context, IQueryResult } from '../w6context';
import breeze from 'breeze-client';
import { Tools } from '../tools'
import { ModHelper } from '../helpers';
import { IBreezeCollection, IBreezeMod, IBreezeMission } from '../dtos';
import { inject } from 'aurelia-framework';

import { Toastr } from '../toastr';

@inject(Toastr, W6Context)
abstract class W6ContextWrapper {
  constructor(public logger: Toastr, public context: W6Context) { }

  public filterPrefixes = this.context.filterPrefixes;

  public queryText(query, filterText, inclAuthor) {
    throw new Error("NotImplemented: queryText");
  }

  private queryTimespan(query, filterTimespan) {
    var m = <any>moment().subtract(filterTimespan, 'hours');
    return query.where("updatedAt", breeze.FilterQueryOp.GreaterThanOrEqual, new Date(m));
  }

  private querySize(query, filterSize) {
    return query.where("size",
      breeze.FilterQueryOp.LessThanOrEqual,
      filterSize);
  }

  public applyFiltering(query, filterOptions, inclAuthor) {
    if (filterOptions.timespan != null)
      query = this.queryTimespan(query, filterOptions.timespan);

    if (filterOptions.text != undefined && filterOptions.text != '') {
      query = this.queryText(query, filterOptions.text, inclAuthor);
      if (query == null)
        return null;
    }

    if (filterOptions.size != null)
      query = this.querySize(query, filterOptions.size);

    return query;
  }

  protected applyExpandOptionally(q: breeze.EntityQuery, options) {
    if (options.expand) return q.expand(options.expand)
    return q;
  }
}

// DEPRECATED: Convert to Queries/Commands
export class CollectionDataService extends W6ContextWrapper {
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
    var query = new breeze.EntityQuery(jsonQuery);
    return this.query(query, options);
  }

  public getCollectionsByMe(options): Promise<IQueryResult<IBreezeCollection>> {
    const userId = this.context.w6.userInfo.id;
    Tools.Debug.log("getting collections by me: " + userId + ", " + options);
    const query = breeze.EntityQuery.from("Collections")
      .where("author.id", breeze.FilterQueryOp.Equals, userId)
      .withParameters({ myPage: true });
    return this.query(query, options);
  }

  public async getCollectionsByMeByGame(gameId, options): Promise<IBreezeCollection[]> {
    const userId = this.context.w6.userInfo.id;
    Tools.Debug.log("getting collections by me: " + userId + ", " + options);
    const query = breeze.EntityQuery.from("Collections")
      .where("author.id", breeze.FilterQueryOp.Equals, userId)
      .where("gameId", breeze.FilterQueryOp.Equals, gameId)
      .withParameters({ myPage: true });
    const r = await this.query(query, options);
    return r.results;
  }

  public async getMySubscribedCollections(gameId, options?) {
    let r = await this.getSubscribedCollectionIdsByGameId(gameId);
    if (r.length == 0) return [];
    let r2 = await this.getCollectionsByIds(r, options);
    return r2.results;
  }

  // can't be used due to virtual properties
  private getDesiredFields = (query) => query.select(["id", "name", "gameId", "game", "groupId", "group", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "size", "sizePacked", "subscribersCount", "modsCount", "latestVersionId"]);

  query(query, options): Promise<IQueryResult<IBreezeCollection>> {
    if (options.filter) {
      var requiresDependencies = options.filter.text && options.filter.text != '' && options.filter.text.containsIgnoreCase('mod:');
      if (requiresDependencies) {
        if (options.sort && options.sort.fields && options.sort.fields.indexOf("author") > -1) {
          // This is currently unsupported either by Breeze, EF, OData, or AutoMapper
          throw new Error("Cannot search for mods while sorted by author, please choose a different sorting option, or don't search for a mod");
        }
        query = query.expand(["dependencies"].concat(options.expand || []));
      } else {
        query = this.applyExpandOptionally(query, options);
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
    var pred2 = this.context.getAuthorQuery(info.user);
    var pred3 = this.getDependenciesQuery(info.mod);

    return this.context.buildPreds(query, [pred, pred2, pred3]);
  }
}

// DEPRECATED: Convert to Queries/Commands
export class MissionDataService extends W6ContextWrapper {
  public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

    var pred = this.context.getNameQuery(info.name);
    var pred2 = this.context.getAuthorQuery(info.user);

    return this.context.buildPreds(query, [pred, pred2]);
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
      throw new Error("invalid query");

    query = query.orderBy(this.context.generateOrderable(options.sort));

    query = this.context.applyPaging(query, options.pagination);

    //query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMission>(query);
  }

  // can't be used due to virtual properties
  private getDesiredFields(query) {
    return query.select(["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "authorId", "author", "gameId", "game", "size", "sizePacked", "followersCount", "modsCount", "latestVersionId"]);
  }

  public getFollowedMissionIds(gameSlug: string) {
    Tools.Debug.log("getting followed mission ids");
    return this.context.get('FollowedMissions', { gameSlug: gameSlug });
  }
}

// DEPRECATED: Convert to Queries/Commands
export class ModDataService extends W6ContextWrapper {
  public getModsInCollection(collectionId, options): Promise<IQueryResult<IBreezeMod>> {
    Tools.Debug.log("getting mods in collection: " + collectionId);
    var query = breeze.EntityQuery.from("ModsInCollection")
      .withParameters({ collectionId: collectionId });

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      throw new Error("invalid query");

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
    var query = new breeze.EntityQuery(jsonQuery);

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      throw new Error("invalid query");

    if (options.sort && options.sort.fields.length > 0)
      query = query.orderBy(this.context.generateOrderable(options.sort));

    if (options.pagination)
      query = this.context.applyPaging(query, options.pagination);
    query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMod>(query);
  }

  private getDesiredFields = query => query.select(ModHelper.interestingFields);

  public getAllModsByAuthorAndGame(authorId: string, gameId: string, options): Promise<IQueryResult<IBreezeMod>> {
    Tools.Debug.log("getting mods by author: " + authorId);
    var query = breeze.EntityQuery.from("Mods")
      .where("author.id", breeze.FilterQueryOp.Equals, authorId)
      .where("gameId", breeze.FilterQueryOp.Equals, gameId);

    if (options.filter)
      query = this.applyFiltering(query, options.filter, true);

    if (query == null)
      throw new Error("invalid query");

    if (options.sort && options.sort.fields.length > 0)
      query = query.orderBy(this.context.generateOrderable(options.sort));

    if (options.pagination)
      query = this.context.applyPaging(query, options.pagination);
    query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeMod>(query);
  }

  public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.context.filterPrefixes);
    var pred = this.getNameQuery(info.name);
    var pred2 = this.getAuthorQuery(info.user);

    return this.context.buildPreds(query, [pred, pred2]);
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

  // TODO: EMTags
  private searchTags(breeze, lc): breeze.Predicate {
    return breeze.Predicate.create("eMTags", "any", "tagStr", breeze.FilterQueryOp.Contains, lc);
  }
}
