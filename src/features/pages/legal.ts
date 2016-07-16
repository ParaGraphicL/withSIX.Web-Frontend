import {inject} from 'aurelia-framework';
import {Mediator,Query,IRequest,DbQuery,handlerFor} from '../../framework';
import {MainBase} from './index';

export class Legal extends MainBase {

  legalText: string;
  activate(params, routeConfig) {
    return new GetLegal().handle(this.mediator)
            .then(x => this.legalText = x);
  }
}

class GetLegal extends Query<string> {}

const terms = <string><any>require("raw!../../../docs/global/TermsOfService.md");
@handlerFor(GetLegal)
class GetLegalHandler extends DbQuery<GetLegal, string> {
    public handle(request: GetLegal): Promise<string> {
      return Promise.resolve(terms);
    }
}
