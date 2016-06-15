module MyApp.Play.ContentIndexes.Mods {
  export class ModsHelper {
    static arma2Id = "1947DE55-44ED-4D92-A62F-26CFBE48258B";
    static arma3Id = "9DE199E3-7342-4495-AD18-195CF264BA5B";
    static a3MpCategories = ["Island", "Objects (Buildings, Foliage, Trees etc)"];
    static objectCategories = ["Objects (Buildings, Foliage, Trees etc)"];
    static getGameIds(id: string) {
      if (id.toUpperCase() == this.arma3Id)
        return [id, this.arma2Id];
      return [id];
    }

    static getCompatibilityModsFor(id: string, otherId: string, tags: string[] = []) {
      if (id.toUpperCase() == this.arma3Id) {
        if (tags.asEnumerable().any(x => this.objectCategories.asEnumerable().contains(x))) return [];
        if (tags.asEnumerable().any(x => this.a3MpCategories.asEnumerable().contains(x))) return ["@cup_terrains_core"];
        return ["@AllInArmaStandaloneLite"];
      }
      return [];
    }
    static getFullVersion = (x: IBreezeModUpdate, cutStable = true) => x.version + (cutStable && x.branch == 'stable' ? '' : ('-' + x.branch));
    static versionCompare = (x: IBreezeModUpdate, y: IBreezeModUpdate) => Tools.versionCompare(ModsHelper.getFullVersion(x, false), ModsHelper.getFullVersion(y, false))
  }

  // DEPRECATED: Convert to Queries/Commands
  export class ModDataService extends W6ContextWrapper {
    static $name = 'modDataService';

    public getModsInCollection(collectionId, options): Promise<IQueryResult<IBreezeMod>> {
      Debug.log("getting mods in collection: " + collectionId);
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
      Debug.log("getting mods in collection: " + collectionId);
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
      Debug.log("getting mods by game: " + gameIds.join(", "), options);
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
      Debug.log("getting mods by author: " + authorSlug);
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
      Debug.log("getting followed mod ids");
      return this.context.get('FollowedMods', { gameSlug: gameSlug });
    }

    private searchTags(breeze, lc): breeze.Predicate {
      return breeze.Predicate.create("categories", "any", "name", breeze.FilterQueryOp.Contains, lc);
    }
  }

  registerService(ModDataService);
}
