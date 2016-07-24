const blueimpGallery = <any>require('blueimp-gallery');
import { bindable } from 'aurelia-framework';
import { ViewModel } from '../../services/lib';
import { GalleryItem } from '../gallery';

export class Lightbox extends ViewModel {
  @bindable items: GalleryItem[];
  clicked = (image: GalleryItem, $event) => {
    var options = { index: image, event: $event };
    blueimpGallery(this.items, options);
  }
}
