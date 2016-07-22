import { GalleryItem, ViewModel, HtmlParser, UiContext } from '../../../framework';
import { inject } from 'aurelia-framework';

@inject(HtmlParser, UiContext)
export class ModGallery extends ViewModel {
  constructor(private parser: HtmlParser, ui) { super(ui) }

  galleryItems: GalleryItem[];

  activate(model: { description?: string, avatar?: string }) {
    this.galleryItems = [];
    if (model.avatar) this.galleryItems.push({ href: model.avatar, thumbnail: model.avatar, title: 'Logo' });
    if (model.description) {
      let jq = this.parser.toJquery(`<div>${model.description}</div>`);
      this.galleryItems.push(...jq.extractImages(jq.find(x => x)));
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
