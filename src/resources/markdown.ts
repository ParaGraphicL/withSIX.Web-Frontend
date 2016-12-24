import { bindable, noView, customElement, inject, processContent, Container } from 'aurelia-framework';
import { W6 } from "../services/withSIX";
//import showdown from 'showdown';
//import prism from 'prism';

const getConverter = (htmlSafe) => htmlSafe ? new Markdown.Converter() : Markdown.getSanitizingConverter();


@processContent(false)
@customElement("markdown")
@noView
@inject(Element, W6)
export class MarkdownCustomElement {
  root; converter;
  @bindable htmlSafe = true;
  @bindable model = null;

  constructor(private element: Element, private w6: W6) { }

  attached() {
    this.converter = getConverter(this.htmlSafe);
    this.root = this.element.shadowRoot || this.element;
    if (!this.model) {
      const el = this.element;
      this.valueChanged(el.innerHTML);
    } else {
      this.valueChanged(this.model);
    }
  }

  modelChanged() {
    this.valueChanged(this.model);
  }

  valueChanged(newValue) {
    if (!this.root) return;
    this.root.innerHTML = this.converter.makeHtml(dedent(newValue.replace("${userInfo.email}", this.w6.userInfo.email)));
    /*
    var codes = this.root.querySelectorAll('pre code');
    for(var node of codes) {
      var c = node.className;
      //node.classList.remove(c);
      node.className = "language-"+c;

      var pre = node.parentNode;
      //pre.classList.remove(c);
      pre.className = "language-"+c;

      prism.highlightElement(node);
    }
    */
  }
}

function dedent(str) {
  var match = str.match(/^[ \t]*(?=\S)/gm);
  if (!match) return str;

  var indent = Math.min.apply(Math, match.map(function (el) {
    return el.length;
  }));

  var re = new RegExp('^[ \\t]{' + indent + '}', 'gm');
  return indent > 0 ? str.replace(re, '') : str;
}

declare var Markdown;
export class PagedownValueConverter {
  toView(markdown: string, htmlSafe?: boolean) {
    return getConverter(htmlSafe).makeHtml(markdown)
  }
}
