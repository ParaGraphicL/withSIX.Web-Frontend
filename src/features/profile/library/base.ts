import {UiContext, ViewModel, LegacyMediator, Mediator, DbQuery, Query, handlerFor, IMenuItem, Filters, IFilter, ISort, SortDirection, ViewType, ITypeahead, IContent} from "../../../framework";
import {inject, BindingEngine} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Show} from "./show";

@inject(UiContext)
export class BaseGame extends ViewModel {
  items: IContent[] = [];
  selectedGame: { id: string; slug: string };
  game;
  itemType: string;
  libraryParent: Show;
  sort: ISort<IContent>[] = [{ name: "name" }];
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
    if (this.features.listAvailable) { this.availableViewTypes.push(ViewType.List); }
  }

  activate(params, routeConfig) {
    // NASTY, but bind bindingContext returns self so :S
    this.libraryParent = this.w6.libraryParent;
    this.game = this.libraryParent.model.game;
    if (!this.game) {
      throw new this.tools.NotFoundException("The specified game could not be found!", { body: null, status: 404, statusText: "NotFound" });
    }
    this.selectedGame = this.libraryParent.getGame(this.game.id);
    let itemSlug = this.itemType ? "/" + this.itemType + "s" : "";
    this.subscriptions.subd(d => {
      d(this.whenAnyValue(x => x.selectedGame)
        .skip(1)
        .subscribe(x => this.navigateInternal("/me/library/" + this.selectedGame.slug + itemSlug)));
    });
  }

  deactivate() { this.subscriptions.dispose(); }
}
