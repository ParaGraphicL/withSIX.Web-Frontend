declare var URL;

// TODO https://github.com/github/url-polyfill
export const createUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (err) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
  }
}

export const buildUrl = (url: string) => {
  if (url.startsWith("//")) return createUrl(window.location.protocol + url);
  return createUrl(url);
}

var cleanup = (str: string, sign: string) => {
  if (str.endsWith("&")) str.substring(0, str.length - 1);
  if (str == sign) str = "";
  return str;
}

export var cleanupHash = (hash: string) => cleanup(hash, '#');
export var cleanupSearch = (search: string) => cleanup(search, '?');

export function uriHasProtocol(uri: string) {
  return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("//") || uri.startsWith("blob:");
}

export function encodeQueryData(data) {
  var ret = [];
  for (var d in data)
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  return ret.join("&");
}

export function joinUri(parts: string[]): string { return parts.join("/"); }
