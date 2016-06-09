import {ViewModel, uiCommand2, Query, DbClientQuery, handlerFor, IQueueInfo, IQueueItem, CompletionState} from '../../../../framework';

export class Queue extends ViewModel {
  items: IQueueItem[];
  isExpanded = false;
  hovered = false;

  timeout: number;

  async activate() {
    this.subscriptions.subd(d => {
      this.eventBus.subscribe("queue.added", evt => {
        this.items.push(evt);
        this.isExpanded = true;
        if (this.timeout) clearTimeout(this.timeout);
        setTimeout(() => {
          if (!this.hovered) this.isExpanded = false;
        }, 5 * 1000);
      });
      this.eventBus.subscribe("queue.removed", id => Tools.removeEl(this.items, this.findById(id)));
      this.eventBus.subscribe("queue.updated", (evt: { id: string, item }) => Object.assign(this.findById(evt.id), evt.item));
    })
    // TODO: on client reconnect, get the queue again etc.
    let data = await new GetQueue().handle(this.mediator);
    this.items = data.items;
  }
  findById(id: string) { return this.items.asEnumerable().first(x => x.id == id); }

  get active() { return this.items.asEnumerable().where(x => !x.state).toArray().length; }  // todo; asEnumerable count! and reactive? // Array.from(this.items.values())
}

//interface IItemData extends Map<string, IQueueItem> {}
interface QueueData extends IQueueInfo { }

export class GetQueue extends Query<QueueData> { }
@handlerFor(GetQueue)
export class GetQueueHandler extends DbClientQuery<GetQueue, QueueData> {
  async handle(request: GetQueue): Promise<QueueData> {
    return await this.client.getQueueInfo();
    //return GetQueueHandler.dtd();
    //return Tools.aryToMap(items, x => x.id);
  }

  static dtd() {
    let items: IQueueItem[] = [
      { id: "x", title: "Upload X", created: new Date(), progressState: { progress: 25, speed: 500 * 1024, action: "Uploading" }, state: CompletionState.NotComplete },
      { id: "y", title: "Upload Y", created: new Date(), progressState: { progress: 66, speed: 43 * 1024, action: "Uploading" }, state: CompletionState.NotComplete },
      { id: "z", title: "Download 6 mods", created: new Date(), progressState: { progress: 50, speed: 666 * 1024, action: "Downloading" }, state: CompletionState.NotComplete },
      { id: "z", title: "Download 6 mods", created: new Date(), progressState: { progress: 100, action: "Downloading" }, state: CompletionState.Success },
      { id: "z", title: "Download 3 mods", created: new Date(), progressState: { progress: 55, action: "Downloading" }, state: CompletionState.Failure },
      { id: "z", title: "Download 2 mods", created: new Date(), progressState: { progress: 55, action: "Downloading" }, state: CompletionState.Canceled },
    ];
    return { items: items }
  }
}
