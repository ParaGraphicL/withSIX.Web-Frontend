import { ViewModel, InterestingLink, HtmlParser, UiContext } from '../../../../framework';
import { UpdateInterestingLinks } from '../mod-gallery';

import { inject } from 'aurelia-framework';

@inject(HtmlParser, UiContext)
export class Index extends ViewModel {
  constructor(private parser: HtmlParser, ui) { super(ui) }

  interestingLinks: InterestingLink[] = [];
  model;
  activate(model) {
    this.model = model;

    if (model.description) {
      let jq = this.parser.toJquery(`<div>${model.description}</div>`);
      let d = jq.find(x => x);
      let il = jq.extractInterestingLinks(d);
      this.addInterestingLinks(il);
    }

    this.subscriptions.subd(d => {
      d(this.observableFromEvent<UpdateInterestingLinks>(UpdateInterestingLinks)
        .subscribe(x => this.addInterestingLinks(x.items)))
    })
  }

  addInterestingLinks = async (il: InterestingLink[]) => {
    let todo = il.filter(x => !this.interestingLinks.some(i => i.url === x.url));
    if (todo.length > 0) this.interestingLinks.push(...todo);
  }
}
