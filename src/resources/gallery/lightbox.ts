const blueimpGallery = <any>require('blueimp-gallery');
import { bindable } from 'aurelia-framework';
import { ViewModel, UiContext } from '../../services/lib';
import { GalleryItem, defaultOptions } from '../gallery';
import { inject } from 'aurelia-framework';

@inject(Element, UiContext)
export class Lightbox extends ViewModel {
  constructor(private el: Element, ui) { super(ui); }

  bind() {
    (<any>$(this.el)).mousewheel(function(e, delta) {
      this.scrollLeft -= (delta * 40);
      e.preventDefault();
    });
  }

  @bindable items: GalleryItem[];
  clicked = (image: GalleryItem, $event) => {
    var options = { index: image, event: $event };
    new blueimpGallery(Array.from(this.items), Object.assign({}, defaultOptions, options));
  }

  isVideo(image: GalleryItem) {
    return image.type && (image.type === 'text/html' || image.type.startsWith('video/'));
  }
}
