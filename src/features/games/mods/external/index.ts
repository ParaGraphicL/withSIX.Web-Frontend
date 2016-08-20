import { ViewModel, InterestingLink, HomepageUrl, HtmlParser, UiContext, Publisher } from '../../../../framework';
import { UpdateInterestingLinks } from '../mod-gallery';

import { inject } from 'aurelia-framework';

@inject(HtmlParser, UiContext)
export class Index extends ViewModel {
  constructor(private parser: HtmlParser, ui) { super(ui) }

  Publisher = Publisher;

  active: Publisher = -1;

  interestingLinks: InterestingLink[] = [];
  model;
  activate(model) {
    this.model = model;
    // TODO: Improve filtering duplicate steam urls, /{id} vs /?id={id}
    if (model.homepageUrl
      && (!model.steamInfo || !model.homepageUrl.includes("steamcommunity"))
      && (!model.forumUrl || !model.homepageUrl.includes("forums.bistudio.com"))
    ) this.addInterestingLinks([new HomepageUrl(model.homepageUrl)])

    if (model.description) {
      let jq = this.parser.toJquery(`<div>${model.description}</div>`);
      let d = jq.find(x => x);
      let il = jq.extractInterestingLinks(d);
      this.addInterestingLinks(il);
    } else this.active = this.getActive();

    this.subscriptions.subd(d => {
      d(this.observableFromEvent<UpdateInterestingLinks>(UpdateInterestingLinks)
        .subscribe(x => this.addInterestingLinks(x.items)))
    })
  }

  getActive() {
    if (this.model.forumUrl) return Publisher.BiForums;
    if (this.model.chucklefishUrl) return Publisher.Chucklefish;
    if (this.model.steamInfo) return Publisher.Steam;
    if (this.model.armaholicUrl) return Publisher.Armaholic;
    if (this.model.gitHubRepo) return Publisher.GitHub;
    return -1;
  }

  addInterestingLinks = async (il: InterestingLink[]) => {
    let todo = il.filter(x => !this.interestingLinks.some(i => i.url === x.url));
    if (todo.length > 0) this.interestingLinks.push(...todo);
  }
}
