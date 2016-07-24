import { GalleryItem, ViewModel, HtmlParser, UiContext, Imgur, InterestingLink, ImgurGallery } from '../../../framework';
import { inject, Container } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(HtmlParser, UiContext, Imgur)
export class ModGallery extends ViewModel {
  constructor(private parser: HtmlParser, ui, private imgur: Imgur) { super(ui) }

  galleryItems: GalleryItem[] = [];
  interestingLinks: InterestingLink[] = [];

  async activate(model: { description?: string, avatar?: string }) {
    if (model.avatar) this.galleryItems.push({ href: model.avatar, thumbnail: model.avatar, title: 'Logo' });
    if (model.description) {
      let jq = this.parser.toJquery(`<div>${model.description}</div>`);
      let d = jq.find(x => x);
      this.galleryItems.push(...jq.extractImages(d));
      let il = jq.extractInterestingLinks(d);
      this.addInterestingLinks(il);
    }

    this.subscriptions.subd(d => {
      d(this.observableFromEvent<UpdateGallery>(UpdateGallery)
        .subscribe(x => this.addGalleryItems(x.items)))
      d(this.observableFromEvent<UpdateInterestingLinks>(UpdateInterestingLinks)
        .subscribe(x => this.addInterestingLinks(x.items)))
    })
  }

  addGalleryItems = (x: GalleryItem[]) => {
    let newItems = x.filter(x => !this.galleryItems.some(i => HtmlParser.compareImage(x, i)));
    if (newItems.length > 0) this.galleryItems.push(...newItems);
  }

  addInterestingLinks = async (il: InterestingLink[]) => {
    let imgurGalleries = il.filter(x => (x instanceof ImgurGallery))
    let todo = imgurGalleries.filter(x => !this.interestingLinks.some(i => i.url === x.url))
    if (todo.length > 0) {
      this.interestingLinks.push(...todo);
      let ebus: EventAggregator = Container.instance.get(EventAggregator);
      await Promise.all(imgurGalleries.map(async (x) => this.addGalleryItems(await this.imgur.getImages(x.url))));
    }
  }
}

export class UpdateGallery {
  constructor(public items: GalleryItem[]) {
    if (!items || items.length === 0) throw new Error("items are invalid")
  }
}

export class UpdateInterestingLinks {
  constructor(public items: InterestingLink[]) {
    if (!items || items.length === 0) throw new Error("items are invalid")
  }
}
