import {ViewModel, Query, DbQuery, handlerFor} from '../../framework';

export class Stream extends ViewModel {
  model;
  async activate() {
    this.model = await new GetStream(this.w6.activeGame.slug).handle(this.mediator);
  }
}

export class GetStream extends Query<{}> {
  constructor(public gameSlug: string, public streamType = 0) { super() }
}

export class GetStreamHandler extends DbQuery<GetStream, {}> {
  handle(request: GetStream) {
    return this.context.getCustom("games/" + request.gameSlug + "/stream?streamType=" + request.streamType)
      .then(result => result.data)
  }
}
