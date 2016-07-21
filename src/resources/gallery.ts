// We scan the HTML retrieved from APIS
// we search for images. If the images are wrapped inside an Anchor, and the Anchor looks imagy, then we assume that the Anchor is the bigger version of the image
// We display it into this gallery.

const blueimpGallery = <any>require('blueimp-gallery');
import 'blueimp-gallery/js/blueimp-gallery-fullscreen';
import 'blueimp-gallery/js/blueimp-gallery-indicator';
import 'blueimp-gallery/js/blueimp-gallery-video';
import 'blueimp-gallery/js/blueimp-gallery-vimeo';
import 'blueimp-gallery/js/blueimp-gallery-youtube';
import 'blueimp-gallery/css/blueimp-gallery.css'
import 'blueimp-gallery/css/blueimp-gallery-indicator.css'
import 'blueimp-gallery/css/blueimp-gallery-video.css'

import { bindable, inject } from 'aurelia-framework';
import { Rx, Base, ViewModel, UiContext } from '../services/lib';

export interface GalleryItem {
  title?: string;
  href: string;
  thumbnail?: string;
}

@inject(Element, UiContext)
export class Gallery extends ViewModel {
  obs: Rx.Subscription;
  @bindable items: GalleryItem[];
  hasAttached = false;
  carousel: Element;
  gallery: { close: () => void; add: (items: GalleryItem[]) => void }

  constructor(private el: Element, ui) {
    super(ui);
  }

  clicked = $event => {
    var target = event.target || event.srcElement,
      link = (<any>target).src || $(target).hasClass('imageholder') ? (<any>target).parentNode : target,
      options = { index: link, event: $event };
    blueimpGallery(this.items, options);
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
    if (this.gallery) { this.gallery.close(); this.gallery = null }
    if (this.obs) { this.obs.unsubscribe(); this.obs = null }
  }

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
    if (this.gallery) { this.gallery.close(); this.gallery = null }
    this.gallery = blueimpGallery(items, {
      container: this.carousel,
      carousel: true
    });
  }
}
