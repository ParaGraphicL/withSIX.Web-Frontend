import {inject} from 'aurelia-framework';

@inject(Element)
export class InfiniteScrollCustomAttribute {
  useDocumentBottom = false;
  scrollDistance = 1;
  container: JQuery;
  elem: JQuery;
  value: { canExecute: boolean, isExecuting: boolean, (): void }
  constructor(private element: Element) { }

  attached() {
    this.elem = $(this.element);
    this.container = $('#content-view');
    this.container.on('scroll', this.handler);
  }

  handler = () => { if (this.do() && this.value.canExecute) this.value(); }

  detached() { this.container.off('scroll', this.handler); }

  valueChanged(value: { canExecute: boolean, isExecuting: boolean, (): void }) {
    this.value = value;
  }

  do() {
    var windowElement = <HTMLElement><any>window;
    var containerBottom, containerTopOffset, elementBottom, remaining, shouldScroll;

    var height = function(elem) {
      elem = elem[0] || elem;
      if (isNaN(elem.offsetHeight)) {
        return elem.document.documentElement.clientHeight;
      } else {
        return elem.offsetHeight;
      }
    },
      offsetTop = function(elem) {
        if (!elem[0].getBoundingClientRect || elem.css('none')) {
          return;
        }
        return elem[0].getBoundingClientRect().top + pageYOffset(elem);
      },
      pageYOffset = function(elem) {
        elem = elem[0] || elem;
        if (isNaN(window.pageYOffset)) {
          return elem.document.documentElement.scrollTop;
        } else {
          return elem.ownerDocument.defaultView.pageYOffset;
        }
      };
    if (this.container[0] === windowElement) {
      containerBottom = height(this.container) + pageYOffset((<any>this.container[0]).document.documentElement);
      elementBottom = offsetTop(this.elem) + height(this.elem);
    } else {
      containerBottom = height(this.container);
      containerTopOffset = 0;
      if (offsetTop(this.container) !== void 0) {
        containerTopOffset = offsetTop(this.container);
      }
      elementBottom = offsetTop(this.elem) - containerTopOffset + height(this.elem);
    }
    if (this.useDocumentBottom) {
      elementBottom = height((this.elem[0].ownerDocument || (<any>this.elem[0]).document).documentElement);
    }
    remaining = elementBottom - containerBottom;
    shouldScroll = remaining <= height(this.container) * this.scrollDistance + 1;
    return shouldScroll;
  }
}
