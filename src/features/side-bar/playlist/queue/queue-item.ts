import {ViewModel, uiCommand2, VoidCommand, DbClientQuery, handlerFor, IQueueItem, CompletionState} from '../../../../framework';

export class QueueItem extends ViewModel {
  model: IQueueItem;
  CompletionState = CompletionState;

  activate(model: IQueueItem) {
    this.model = model;
  }

  get progressClass() { return this.model.progressState && `item-progress-${this.model.progressState.progress}` }

  cancel = uiCommand2("Cancel", async (x) => {
    await new CancelQueueItem(this.model.id).handle(this.mediator);
  })

  remove = uiCommand2("Remove", async (x) => {
    await new RemoveQueueItem(this.model.id).handle(this.mediator);
  })

  pause = uiCommand2("Pause", async (x) => {
    alert("TODO");
    await new PauseQueueItem(this.model.id).handle(this.mediator);
  })

  retry = uiCommand2("Retry", async (x) => {
    alert("TODO");
    await new RetryQueueItem(this.model.id).handle(this.mediator);
  })
}

export class PauseQueueItem extends VoidCommand {
  constructor(public id: string) { super() }
}

@handlerFor(PauseQueueItem)
export class PauseQueueItemHandler extends DbClientQuery<PauseQueueItem, void> {
  handle(request: PauseQueueItem) { return this.client.pauseQueueItem(request.id) }
}

export class RetryQueueItem extends VoidCommand {
  constructor(public id: string) { super() }
}

@handlerFor(RetryQueueItem)
export class RetryQueueItemHandler extends DbClientQuery<RetryQueueItem, void> {
  handle(request: RetryQueueItem) { return this.client.retryQueueItem(request.id) }
}

export class CancelQueueItem extends VoidCommand {
  constructor(public id: string) { super() }
}

@handlerFor(CancelQueueItem)
export class CancelQueueItemHandler extends DbClientQuery<CancelQueueItem, void> {
  handle(request: CancelQueueItem) { return this.client.cancelQueueItem(request.id) }
}

export class RemoveQueueItem extends VoidCommand {
  constructor(public id: string) { super() }
}

@handlerFor(RemoveQueueItem)
export class RemoveQueueItemHandler extends DbClientQuery<RemoveQueueItem, void> {
  handle(request: RemoveQueueItem) { return this.client.removeQueueItem(request.id) }
}
