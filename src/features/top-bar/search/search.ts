import {
  ViewModel, MenuItem, uiCommand2, Debouncer, IMenuItem, UiContext,
  ModsHelper, DbQuery, Query, VoidCommand, handlerFor, CloseTabs
} from '../../../framework';
import { inject } from 'aurelia-framework';
import { ValidationGroup } from 'aurelia-validation';

enum SearchContentType {
  User,
  Author,

  Mod = 1001,
  Mission,
  Collection,
  Group,

  ModAuthor = 2001,
  MissionAuthor,
  CollectionAuthor,
  GroupAuthor
}

@inject(Element, UiContext)
export class Search extends ViewModel {
  debouncer: (...args: any[]) => Promise<void>;
  types: string[];
  searchInput: string;
  validation: ValidationGroup;
  contentType;
  contentTypes: string[];
  results = [];
  resultQ;
  open: boolean;
  gameSlug: string;
  fullView: boolean;

  constructor(private el: Element, ui: UiContext) { super(ui); }

  attached() {
    $(this.el).bind('click mouseenter', e => e.stopPropagation());
    this.validation = this.validator.on(this, null)
      .ensure('searchInput')
      .isNotEmpty()
      .hasMinLength(3);
    this.validation.validate();

    this.contentType = SearchContentType;
    this.contentTypes = ['Mod', 'Mission', 'Collection'];
    if (this.w6.userInfo.isManager) this.contentTypes.push('Group');
    if (this.w6.userInfo.isAdmin) this.contentTypes.push('Author');
    this.reset();
    // if (model) {
    //   if (model.q) this.model.q = model.q;
    //   if (model.gameIDs) this.model.gameIDs = model.gameIDs;
    // }
    this.results = [];

    this.debouncer = Debouncer.debouncePromise(async (q) => {
      //await this.validation.validate();
      this.reset();
      if (q && q.length > 2) await this.search();
      else this.closeNow();
    }, 400);

    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.searchInput).skip(1).subscribe(x => this.debouncer(x)));
      d(this.observableFromEvent<CloseTabs>(CloseTabs).filter(x => x.exclude != this).subscribe(x => this.closeNow()));
    });
  }

  get activeGameImage() {
    let base = 'img/play.withSIX/games/' + this.w6.activeGame.slug;
    return this.w6.url.getAssetUrl(`${base}/logo-white.png`);
  }

  goBackToOverview = () => {
    this.reset();
    return this.search();
  }

  reset() {
    this.types = Array.from(this.contentTypes);
    this.fullView = false;
  }

  get showResults() { return this.open } // && this.results.length > 0

  closeNow = () => this.open = false;
  openNow = () => this.open = true;

  openIfValid = async () => { this.closeTabs(); if (this.searchInput && this.searchInput.length > 2) this.openNow() }

  onChange = ($event) => this.debouncer(this.searchInput);

  closeTabs() { this.eventBus.publish(new CloseTabs(this)) }

  search = uiCommand2("Search", async (fullView?: boolean) => {
    this.closeTabs();
    const game = this.w6.activeGame;
    const gameIds = game.id ? ModsHelper.getGameIds(game.id) : [];
    this.gameSlug = game.id ? game.slug : null;
    this.resultQ = this.searchInput;
    const types = this.types;
    fullView = this.fullView;
    this.openNow();
    const results = this.results = types.map(t => ({ key: { loading: true, type: t.toUpperCaseFirst() + 's', totalCount: 0, processing: false }, value: [] }));

    for (const i in types) {
      const type = types[i];
      const tr = results[i];
      tr.key.processing = true;
      const result = await new SearchQuery(this.searchInput, gameIds, [type], fullView).handle(this.mediator);
      const r = result.contentResults[0];
      if (!r) continue;
      tr.key = r.key;
      tr.key.processing = false;
      tr.value = r.value;
    };
  });

  searchOneType = (type: number) => {
    const t = SearchContentType[type];
    if (t == null) throw new Error(`Unknown search content type: ${type}`)
    this.types = [t];
    this.fullView = true;
    return this.search();
  };
}

class SearchQuery extends Query<any> {
  constructor(public q: string, public gameIDs: string[], public types: string[], public fullView?: boolean) { super() }
}

@handlerFor(SearchQuery)
class SearchQueryHandler extends DbQuery<SearchQuery, any> {
  async handle(request: SearchQuery) {
    let r = await this.context.getCustom<{ contentResults: any[] }>("search", { params: request, requestName: 'search' })
    r.contentResults.forEach(x => x.key.type = SearchContentType[x.key.itemType] + 's')
    return r;
  }
}
