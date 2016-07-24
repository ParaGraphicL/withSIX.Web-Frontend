import { ViewModel, InterestingLink } from '../../../../framework';
import { UpdateInterestingLinks } from '../mod-gallery';

export class Index extends ViewModel {
  interestingLinks: InterestingLink[] = [];
  model;
  activate(model) {
    this.model = model;

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
