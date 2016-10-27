import {
  customAttribute,
  valueConverter
} from 'aurelia-framework';
import numeral from 'numbro';
import {
  sanitizeHtml, camelCase
} from '../helpers/utils/string';

enum FileSize {
  B,
  KB,
  MB,
  GB,
  TB,
  PB,
  EB,
  ZB,
  YB
}

@valueConverter('active')
export class ActiveValueConverter {
  toView(active, total) {
    if (active == 0 && active == total) return `${total}`;
    return `${active} / ${total}`;
  }
}

@valueConverter('dateInput')
export class DateInputValueConverter {
  toView(d) {
    return d ? moment(d).format("YYYY-MM-DD") : d
  }
  fromView(d) {
    return d ? new Date(d + ' 00:00:00') : d;
  }
}

@valueConverter('monthName')
export class MonthNameValueConverter {
  toView = monthNumber => { //1 = January
    var monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1];
  }
}

@valueConverter('highlight')
export class HighlightValueConverter {
  toView(text: string, searchString: string) {
    if (!searchString) return text;
    let rx = new RegExp(searchString, "ig");
    return text.replace(rx, v => {
      return `<b>${v}</b>`;
    })
  }
}

@valueConverter('text')
export class TextValueConverter {
  toView = text => text ? this.parseText(sanitizeHtml(text)) : text;
  parseText = text => this.replaceBreaks(this.replaceSpecial(this.replaceLinks(text)))
  replaceBreaks = text => text.replace(/(\r\n)|\n/g, "<br />")
  replaceSpecial = text => text.replace(/configure the game first in the Settings/, (whole) =>
    `<a href="#" onclick="w6Cheat.api.openSettings({module: 'games'})">${whole}</a>`)
  replaceLinks = text => text.replace(
    /(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/gi, (whole, m1,
      m2, m3) => `<a target="_blank" href="${whole}">${m3}</a>`);
}

@valueConverter('camelCase')
export class CamelCaseConverter {
  toView = camelCase;
}

@valueConverter('take')
export class TakeValueConverter {
  toView(array, count) {
    return array ? array.slice(0, count) : array;
  }
}

@valueConverter('skip')
export class SkipValueConverter {
  toView(array, start) {
    return array ? array.slice(start) : array;
  }
}


@valueConverter('links')
export class LinkValueConverter {
  toView = text => text ? this.parseText(sanitizeHtml(text)) : text;
  parseText = text => this.replaceLinks(text);
  // removed (:[0-9]{1,6})? as web urls generally have no ports!
  replaceLinks = text => text.replace(
    /(https?:\/\/)?((www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/ig,
    (whole, m1, m2, m3) => {
      return `<a target="_blank" href="${whole.startsWith('http') ? whole : `http://${whole}`}">${m2}</a>`;
    });
}

// This only converts the ary on first use, and then becomes static.
// better is to bind to arrays directly..
@valueConverter('mapToAry')
export class MapToAryValueConverter {
  toView = map => map == null ? null : Array.from(map, (x, i) => x[1]);
}

@valueConverter('ipEndpoint')
export class IpEndpointValueConverter {
  toView = addr => addr ? `${addr.address}:${addr.port}` : '';
}

@valueConverter('numeral')
export class NumeralValueConverter {
  static defaultFormat = '0[.][0]';
  defaultToView = (n: number, format: string) => this.convert(n, format)
  convert = (n: number, format: string) => numeral(n || 0).format(format);
}

@valueConverter('progress')
export class ProgressValueConverter extends NumeralValueConverter {
  static procentFormat = NumeralValueConverter.defaultFormat + '%';
  toView = (n: number) => this.convert(n / 100, ProgressValueConverter.procentFormat);
}

@valueConverter('sort')
export class SortValueConverter {
  toView(array, propertyName, direction = 'ascending') {
    var factor = direction === 'ascending' ? 1 : -1;
    return array
      .slice(0)
      .sort((a, b) => {
        return (a[propertyName] - b[propertyName]) * factor
      });
  }
}

@valueConverter('size')
export class SizeValueConverter extends NumeralValueConverter {
  static sizeFormat = NumeralValueConverter.defaultFormat + ' b';
  handleNegative = (n: number) => n < 0 ? '-' : '';
  sizeConvert = (n: number) => this.handleNegative(n) + this.convert(Math.abs(n),
    SizeValueConverter.sizeFormat);
  includeMarkup = (r: string) => r.replace(/(.*) (.*)/, (full, count, unit) =>
    `<span class="count">${count}</span> <span class="unit">${unit}</span>`);
  toView = (size: number, format = 'B', includeMarkup = true) => {
    size = this.upsize(FileSize[format], size);
    let r = this.sizeConvert(size);
    if (r == '0 ') r = '0 B';
    return includeMarkup ? this.includeMarkup(r) : r;
  };

  upsize = (curFormat: number, size) => {
    switch (curFormat) {
      case FileSize.B:
        return size;
      case FileSize.KB:
        curFormat = FileSize.B;
        break;
      case FileSize.MB:
        curFormat = FileSize.KB;
        break;
      case FileSize.GB:
        curFormat = FileSize.MB;
        break;
      case FileSize.TB:
        curFormat = FileSize.GB;
        break;
      case FileSize.PB:
        curFormat = FileSize.TB;
        break;
      case FileSize.EB:
        curFormat = FileSize.PB;
        break;
      case FileSize.ZB:
        curFormat = FileSize.EB;
        break;
      case FileSize.YB:
        curFormat = FileSize.ZB;
      default:
        return size;
    }
    size = size * 1024;
    return this.upsize(curFormat, size);
  };
}

@valueConverter('speed')
export class SpeedValueConverter extends SizeValueConverter {
  toView = (size: number, format = 'B', includeMarkup = true) => {
    size = this.upsize(FileSize[format], size);
    let r = this.sizeConvert(size) + '/s';
    return includeMarkup ? this.includeMarkup(r) : r;
  }
}

@valueConverter('amount')
export class AmountValueConverter extends NumeralValueConverter {
  static amountFormat = NumeralValueConverter.defaultFormat + 'a';
  toView = (n: number) => this.convert(n, AmountValueConverter.amountFormat);
}

@valueConverter('date')
export class DateValueConverter {
  toView = (date, format) => moment(date).format(format);
}

@valueConverter('timeAgo')
export class TimeAgoValueConverter {
  toView = (date) => moment(date).fromNow();
}

@valueConverter('pluralize')
export class PluralizeValueConverter {
  toView(count: number, word: string) {
    if (count !== 1) {
      // TODO: more cases
      word = word.replace(/y$/, "ie");
      word = word + 's';
    }
    return count + ' ' + word;
  }
}

@valueConverter('pluralizeWord')
export class PluralizeWordValueConverter {
  toView(count: number, word: string) {
    if (count !== 1) {
      // TODO: more cases
      word = word.replace(/y$/, "ie");
      word = word + 's';
    }
    return word;
  }
}

@valueConverter('hideShowText')
export class HideShowTextValueConverter {
  toView = (show: boolean) => show ? 'hide' : 'show';
}

@valueConverter('hideShowIcon')
export class HideShowIconValueConverter {
  toView = (show) => show ? 'withSIX-icon-Arrow-Down-Dir' : 'withSIX-icon-Arrow-Left-Dir';
}

@valueConverter('filterOnExisting')
export class FilterOnExistingValueConverter {
  toView = (items, key, haystack) => items.filter(x => !haystack.asEnumearble().contains(x[key]))
}

@valueConverter('fileListToArray')
export class FileListToArrayValueConverter {
  toView(fileList: FileList) {
    let files = [];
    if (!fileList) {
      return files;
    }
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList.item(i));
    }
    return files;
  }
}

@valueConverter('blobToUrl')
export class BlobToUrlValueConverter {
  toView(blob) {
    return URL.createObjectURL(blob);
  }
}

// TODO
/*
() => (nmb, currencyCode) => {
    var currency = {
            USD: "$",
            GBP: "£",
            AUD: "$",
            EUR: "€",
            CAD: "$",
            MIXED: "~"
        },
        thousand,
        decimal,
        format;
    if ($.inArray(currencyCode, ["USD", "AUD", "CAD", "MIXED"]) >= 0) {
        thousand = ",";
        decimal = ".";
        format = "%s %v";
    } else {
        thousand = ".";
        decimal = ",";
        format = "%s %v";
    };
    return accounting.formatMoney(nmb, currency[currencyCode], 2, thousand, decimal, format);
})*/
