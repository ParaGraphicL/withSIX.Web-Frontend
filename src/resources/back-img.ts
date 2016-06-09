import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {UiContext} from '../services/uicontext';

@inject(Element, UiContext)
export class BackImgCustomAttribute {
  constructor(private element, private ui: UiContext) { }

  valueChanged(newValue) {
    this.element.style.backgroundImage = newValue ? 'url(' + newValue + ')' : null;
  }

  getImage = (img: string, updatedAt?): string => {
    if (!img || img == "")
      return this.ui.w6.url.cdn + "/img/noimage.png";
    return img.startsWith("http") || img.startsWith("//") ? img : this.ui.w6.url.getUsercontentUrl(img, updatedAt);
  };
}
