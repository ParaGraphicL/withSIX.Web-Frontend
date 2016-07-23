import { GalleryItem, ViewModel, HtmlParser, UiContext, Imgur } from '../../../framework';
import { inject, Container } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(HtmlParser, UiContext, Imgur)
export class ModGallery extends ViewModel {
  constructor(private parser: HtmlParser, ui, private imgur: Imgur) { super(ui) }

  galleryItems: GalleryItem[];

  static handleImgurGalleries = (il) => {
    if (il && il.imgurGalleries) {
      setTimeout(async () => {
        let images = [];
        for (var x of il.imgurGalleries)
          images.push(...(await Container.instance.get(Imgur).getImages(x)));
        if (images.length > 0)
          Container.instance.get(EventAggregator).publish(new UpdateGallery(images));
      })
    }
  }

  async activate(model: { description?: string, avatar?: string }) {
    this.galleryItems = [];
    if (model.avatar) this.galleryItems.push({ href: model.avatar, thumbnail: model.avatar, title: 'Logo' });
    if (model.description) {
      let jq = this.parser.toJquery(`<div>${model.description}</div>`);
      let d = jq.find(x => x);
      this.galleryItems.push(...jq.extractImages(d));
      let il = jq.extractInterestingLinks(d);
      ModGallery.handleImgurGalleries(il);
    }

    this.subscriptions.subd(d => {
      d(this.observableFromEvent<UpdateGallery>(UpdateGallery)
        .subscribe(this.addGalleryItems))
    })
  }

  addGalleryItems = (x: UpdateGallery) => {
    let newItems = x.items.filter(x => !this.galleryItems.some(i => HtmlParser.compareImage(x, i)));
    if (newItems.length > 0) this.galleryItems.push(...newItems);
  }
}

export class UpdateGallery {
  constructor(public items: GalleryItem[]) {
    if (!items || items.length === 0) throw new Error("items are invalid")
  }
}
