import {ViewModelWithModel, IContentState, UiContext, BasketService, GameClientInfo, FindModel} from '../../../framework';
import {ICollection} from '../playlist/playlist';
import {inject} from 'aurelia-framework';

export interface IResultModel<T> {
  model: T;
  findModel: FindModel<T>;
}

@inject(UiContext, BasketService)
export class CollectionFinderResult extends ViewModelWithModel<ICollection> {
  scopeIcon: string;
  state: IContentState;
  gameInfo: GameClientInfo;
  findModel: FindModel<ICollection>;

  constructor(ui, private basketService: BasketService) { super(ui) }

  async activate(model) {
    super.activate(model.model);
    this.findModel = model.findModel;
    this.scopeIcon = this.getItemClass();
    this.gameInfo = await this.basketService.getGameInfo(this.model.gameId)

    this.subscriptions.subd(d => {
      this.updateState();
      d(this.eventBus.subscribe('refreshContentInfo-' + this.model.gameId, x => this.updateState()));
      d(this.eventBus.subscribe('contentInfoStateChange-' + this.model.id, x => this.updateState()));
    });
  }

  getItemClass() {
    switch (this.model.scope) {
      case 0: return 'withSIX-icon-Nav-Server';
      case 1: return 'withSIX-icon-Hidden';
      case 2: return 'withSIX-icon-Lock';
    }
  }

  updateState() { this.state = this.gameInfo.clientInfo.content[this.model.id]; }
  get itemStateClass() { return this.basketService.getItemStateClassInternal(this.state ? this.state.state : null); }
}
