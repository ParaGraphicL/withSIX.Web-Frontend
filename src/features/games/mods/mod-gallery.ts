import { GalleryItem, ViewModel, HtmlParser, UiContext } from '../../../framework';
import { inject } from 'aurelia-framework';

@inject(HtmlParser, UiContext)
export class ModGallery extends ViewModel {
  constructor(private parser: HtmlParser, ui) { super(ui) }

  galleryItems: GalleryItem[];

  activate(model: string) {
    if (model) {
      let jq = this.parser.toJquery(`<div>${model}</div>`);
      this.galleryItems = jq.extractImages(jq.find(x => x));
    } else
      this.galleryItems = [];
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
