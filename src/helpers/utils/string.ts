import {base64ToShort, base64ToGuid, shortToBase64, guidToBase64} from './base64';
import {createError} from './errors';

export const endsWithIgnoreCase = (str: string, suffix: string) => str.toLowerCase().endsWith(suffix.toLowerCase())
export const startsWithIgnoreCase = (str: string, prefix) => str.toLowerCase().startsWith(prefix.toLowerCase())
export const indexOfIgnoreCase = (str: string, prefix: string) => str.toLowerCase().indexOf(prefix.toLowerCase())
export const toUpperCaseFirst = (str: string) => str.split(" ").map(i => i ? i[0].toUpperCase() + i.substring(1) : i).join(" ")
export const toLowerCaseFirst = (str: string) => str.split(" ").map(i => i ? i[0].toLowerCase() + i.substring(1): i).join(" ")
export const containsIgnoreCase = (str: string, prefix: string) => str.toLowerCase().includes(prefix)
export const equalsIgnoreCase = (str: string, other: string) => str.toLowerCase() === other.toLowerCase()
export const truncate = (str: string, count: number) => { if (str.length <= count) return str; return str.substring(0, count) + '..' }

interface Sanitizer {
  (html: string, overrides?): string;
  defaults: {allowedTags: string[]}
}
const sanitizeHtmlLib: Sanitizer = <any>require('sanitize-html');

export const sanitizeHtml = (html: string, overrides?) => sanitizeHtmlLib(html, Object.assign({}, {
  allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([ 'img' ])
}, overrides))

import {BBTag} from './bbcode/bbTag';
import {BBCodeParser} from './bbcode/bbCodeParser';

var li = new BBTag("*", true, false, false, (tag, content, attr) => {
  return `<li>${content}</li>`;
}); li.noEndTag = true;
var bbTags = [BBTag.createSimpleTag("h1"), BBTag.createSimpleTag("h2"), BBTag.createSimpleTag("h3"),
  new BBTag("list", true, false, false, (tag, content, attr) => {
    return `<ul>${content}</ul>`;
}), li];
var parser =  new BBCodeParser(bbTags.concat(BBCodeParser.defaultTags()));
export const parseBBCode = (bbCode: string) => sanitizeHtml(parser.parseString(bbCode));

// TODO: This is not as good as the C# version we use!
export const sluggify = (str: string) => sluggifyEntityName(str.toLowerCase());
export const sluggifyEntityName = (str: string) => {
  str = str.replace(r, match => {
    switch (match) {
      case "'":
          return "";
      case "+":
          return "plus";
      default:
          return "-";
    }
  }).trim();
  str = str.replace(r2, "");
  str = str.replace(r3, "");
  return str;
}

const r = new RegExp("[^A-Za-z0-9-]+", "g");
const r2 = new RegExp("^[-]+");
const r3 = new RegExp("[-]+$");

export const toShortId = (id: string): string => base64ToShort(guidToBase64(id, true));

export const fromShortId = (shortId: string): string => {
  try {
    return base64ToGuid(shortToBase64(shortId), true);
  } catch (err) {
    throw new InvalidShortIdException(shortId + " is not a valid ShortID");
  }
}

export const InvalidShortIdException = createError('InvalidShortIdException');
