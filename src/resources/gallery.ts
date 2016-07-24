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

export interface GalleryItem {
  title?: string;
  href: string;
  thumbnail?: string;
  type?: string;
}

export class Gallery {
  @bindable items: GalleryItem[];
}
