import {UiContext, ViewModel, LegacyMediator, Mediator, DbQuery, Query, handlerFor, IMenuItem, Filters, IFilter, ISort, SortDirection, ViewType, ITypeahead, IContent} from '../../../framework';
import {inject, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Show} from './show';

@inject(UiContext)
export class BaseGame extends ViewModel {
  items: IContent[] = [];
  selectedGame: { id: string; slug: string };
  game;
  itemType: string;
  libraryParent: Show;
  sort: ISort<IContent>[] = [{ name: "name" }]
  searchFields = ["name"];
  viewType = ViewType.Card;
  filters: IFilter<IContent>[] = [];
  typeahead: ITypeahead<IContent>;
  filteredComponent: Filters<IContent>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[] = [];

  constructor(ui: UiContext) {
    super(ui);
    this.availableViewTypes = [ViewType.Card];
    if (this.w6.url.environment != this.tools.Environment.Production) this.availableViewTypes.push(ViewType.List);
    // this.typeahead = {
    //   display: x => x.packageName ? x.name + ' (' + x.packageName + ')' : x.name,
    //   substringMatcher: async (q) => this.items.asEnumerable()
    //     .filter(x => this.searchFields.some(f => x[f] && x[f].containsIgnoreCase(q))).toArray(),
    //   selector: x => x.name // uses display by default
    // }
  }

  activate(params, routeConfig) {
    // NASTY, but bind bindingContext returns self so :S
    this.libraryParent = this.w6.libraryParent;
    //Tools.Debug.log("$$$ parent", this.$parent, params, routeConfig, routeConfig.navModel.router.parent);
    this.game = this.libraryParent.model.game;
    if (!this.game) throw new this.tools.NotFoundException("The specified game could not be found!", {status: 404, statusText: "NotFound", body: null});
    this.selectedGame = this.libraryParent.model.games.get(this.game.id);
    var itemSlug = this.itemType ? "/" + this.itemType + "s" : '';
    this.subscriptions.subd(d =>
      d(this.whenAnyValue(x => x.selectedGame)
        .skip(1)
        .subscribe(x => this.navigateInternal("/me/library/" + this.selectedGame.slug + itemSlug))));
    //this.$parent = routeConfig.navModel.router.parent.viewPorts.default.view.executionContext
  }

  deactivate() { this.subscriptions.dispose(); }
}
