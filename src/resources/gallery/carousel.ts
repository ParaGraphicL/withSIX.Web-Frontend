// We scan the HTML retrieved from APIS
// we search for images. If the images are wrapped inside an Anchor, and the Anchor looks imagy, then we assume that the Anchor is the bigger version of the image
// We display it into this gallery.

const blueimpGallery = <any>require('blueimp-gallery');
import { bindable, inject } from 'aurelia-framework';
import { Rx, Base, ViewModel, UiContext } from '../../services/lib';
import { GalleryItem, defaultOptions } from '../gallery';

@inject(Element, UiContext)
export class Carousel extends ViewModel {
  obs: Rx.Subscription;
  @bindable items: GalleryItem[];
  hasAttached = false;
  carousel: Element;
  gallery: { close: () => void; add: (items: GalleryItem[]) => void }

  constructor(private el: Element, ui) {
    super(ui);
  }

  attached() {
    this.carousel = $(this.el).find('.carousel')[0];
    this.hasAttached = true;
    if (this.items) this.handleGallery(this.items);
    this.subscriptions.subd(d => {
      d(this.cleanup);
    })
  }

  itemsChanged(newValue, oldValue) {
    if (!this.hasAttached) return;
    this.cleanup();
    if (newValue) this.handleGallery(newValue);
  }

  cleanup = () => {
    if (this.gallery) this.close();
    if (this.obs) { this.obs.unsubscribe(); this.obs = null }
  }

  close = () => { this.gallery.close(); this.gallery = null }

  handleGallery(items: GalleryItem[]) {
    this.setupGallery(items);
    this.obs = Base.observeCollection(items)
      .subscribe(x => {
        const { added, removed } = Base.getChanges(x, items);
        if (removed.length > 0) this.setupGallery(items);
        else this.gallery.add(added);
      });
  }

  setupGallery(items: GalleryItem[]) {
    if (this.gallery) this.close();
    this.gallery = new blueimpGallery(Array.from(items), Object.assign({}, defaultOptions, {
      container: this.carousel,
      carousel: true
    }));
  }
}
