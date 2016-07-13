import {inject} from 'aurelia-framework';
import {ViewModel, UiContext, ITab, IActionTabStateUpdate, uiCommand2, IActionNotification, ITabNotification, VoidCommand, DbClientQuery, handlerFor,
  GameChanged, BasketService, GameClientInfo, ConnectionState, Client, TypeScope, StateChanged, INextActionInfo, ActionType, IActionTabState, ShowTabNotification} from '../../../framework';

@inject(UiContext, BasketService, Client)
export class DownloaderHeader extends ViewModel {
  game = { id: null, slug: null };
  gameInfo: GameClientInfo = new GameClientInfo(null, null, null);
  tab: ITab;

  constructor(ui, private basketService: BasketService, private client: Client) { super(ui); }

  get clientInfo() { return this.gameInfo.clientInfo };
  get actionInfo() { return this.clientInfo.actionInfo; }
  //get showAbort() { return this.gameInfo.clientInfo.canAbort; }

  async activate(tab: ITab) {
    this.tab = tab;
    this.subscriptions.subd(d => {
      d(this.appEvents.gameChanged.subscribe(this.gameChanged));
      d(this.whenAnyValue(x => x.actionInfo).subscribe(this.handleActionInfo));
      //d(this.clientWrapper.actionNotification.subscribe(this.handleActionNotification));
      d(this.clientWrapper.actionUpdateNotification.subscribe(this.handleActionUpdate));
    });

    if (this.w6.activeGame.id) await this.gameChanged(this.w6.activeGame);
  }

  replaceNotification = (note: ITabNotification) => this.eventBus.publish(new ShowTabNotification('downloads', note))

  handleActionInfo = (actionInfo: IActionTabState) => {
    this.tools.Debug.log("$$$ received actionTabState", actionInfo);
    if (actionInfo == null) {
      this.tab.progressInfo = null;
      this.replaceNotification(null);
      return;
    }
    this.tab.progressInfo = {
      text: actionInfo.text,
      progress: actionInfo.progress
    }
    this.replaceNotification({
      title: actionInfo.childAction.title,
      text: actionInfo.childAction.text,
      href: (<any>actionInfo.childAction).href,
      progress: actionInfo.childAction.progress,
      speed: actionInfo.childAction.speed,
      details: actionInfo.childAction.details,
      icon: 'withSIX-icon-Nav-Mod',
      cls: this.getNotificationCls(actionInfo.type),
      command: actionInfo.nextActionInfo == null ? null : this.buildCommandFromNextActionInfo(actionInfo.nextActionInfo),
      isPersistent: actionInfo.type == ActionType.Start
    })
  }

  // handleActionNotification = (evt: IActionNotification) => {
  //   this.tools.Debug.log("$$$ received actionNote", evt);
  //   this.tab.progressInfo = {
  //     text: evt.title + ' ' + evt.text,
  //     progress: evt.type == ActionType.Start ? 0 : null
  //   }
  //   this.replaceNotification({
  //     text: evt.text,
  //     cls: this.getNotificationCls(evt.type),
  //     command: evt.nextActionInfo ? this.buildCommandFromNextActionInfo(evt.nextActionInfo) : null
  //   })
  // }

  handleActionUpdate = (x: IActionTabStateUpdate) => {
    this.tools.Debug.log("$$$ received updated actionTabState", x);
    let pInfo = this.tab.progressInfo;
    if (pInfo == null) return;
    pInfo.progress = x.progress;
    let note = this.tab.notification;
    if (note == null) return;
    note.title = x.childAction.title;
    note.href = (<any>x.childAction).href;
    note.progress = x.childAction.progress;
    note.speed = x.childAction.speed;
    note.details = x.childAction.details;
  }

  getNotificationCls(type: ActionType) {
    switch (type) {
      case 3: // ActionType.Cancel
        return 'cancel-state';
      case ActionType.Fail:
        return 'error-state';
      // case ActionType.Start:
      //   return 'start';
      case ActionType.End:
        return 'end-state';
    }
    return 'start-state';
  }

  getClassFromNextActionInfo = (na: INextActionInfo) => {
    switch (na.title.toLowerCase()) {
      case 'launch':
        return 'end';
      case 'retry':
        return 'error';
    }
    return 'start';
  }

  buildCommandFromNextActionInfo = (na: INextActionInfo) => {
    let title = na.title;
    let tooltip = na.title.toUpperCase();
    let cls = na.title.toLowerCase();
    let icon = null
    let lTitle = na.title.toLowerCase();
    if (lTitle == "cancel") {
      title = "";
      icon = 'withSIX-icon-Hexagon-X';
    } else if (lTitle == "pause") {
      title = "";
      icon = 'withSIX-icon-Hexagon-Pause';
    } else if (lTitle == "continue") {
      title = "";
      icon = 'withSIX-icon-Hexagon-Continue';
    } else if (lTitle == "retry") {
      title = "";
      icon = 'withSIX-icon-Hexagon-Reload';
    } else if (lTitle == "launch") {
      title = "";
      icon = 'withSIX-icon-Hexagon-Play';
    }
    return uiCommand2(title, () => new NextAction(na.requestId).handle(this.mediator), {
      icon: icon,
      tooltip: tooltip,
      cls: cls
    });
  }

  gameChanged = async (info: GameChanged) => {
    this.tools.Debug.log("$$$ DownloadHeader Game Changed: ", info);
    if (this.game.id == info.id) return;
    // TODO: All this data should actually change at once!
    this.game.id = info.id;
    this.game.slug = info.slug;
    //this.gameInfo = null;
    if (this.game.id) {
      this.gameInfo = await this.basketService.getGameInfo(this.game.id);
    }
    this.tools.Debug.log("$$$ Download header Game Info", this.gameInfo);
  }
}



export class NextAction extends VoidCommand {
  constructor(public requestId) { super(); }
}

@handlerFor(NextAction)
export class NextActionHandler extends DbClientQuery<NextAction, void> {
  handle(request: NextAction) {
    return this.client.next(request.requestId);
  }
}
