import {inject, autoinject, customAttribute, valueConverter, Container} from 'aurelia-framework';
import numeral from 'numbro';

import {FileSize} from '../services/lib';

@valueConverter('active')
export class ActiveValueConverter {
  toView(active, total) {
    if (active == 0 && active == total) return `${total}`;
    return `${active} / ${total}`;
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
  toView = text => text ? this.parseText(text) : text;
  parseText = text => this.replaceBreaks(this.replaceLinks(text))
  replaceBreaks = text => text.replace(/(\r\n)|\n/g, "<br />")
  replaceLinks = text => text.replace(/(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/gi, (whole, m1, m2, m3) => `<a target="_blank" href="${whole}">${m3}</a>`);
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

@valueConverter('size')
export class SizeValueConverter extends NumeralValueConverter {
  static sizeFormat = NumeralValueConverter.defaultFormat + ' b';
  handleNegative = (n: number) => n < 0 ? '-' : '';
  sizeConvert = (n: number) => this.handleNegative(n) + this.convert(Math.abs(n), SizeValueConverter.sizeFormat);
  includeMarkup = (r: string) => (r == '0' ? `0 b` : r).replace(/(.*) (.*)/, (full, count, unit) => `<span class="count">${count}</span> <span class="unit">${unit}</span>`);
  toView = (size: number, format = 'B', includeMarkup = true) => {
    size = this.upsize(FileSize[format], size);
    let r = this.sizeConvert(size);
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
      default: return size;
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
      word = word.replace(/y$/, "ies");
    }
    return count + ' ' + word;
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
  toView = (items, key, haystack) => items.asEnumerable().where(x => !haystack.asEnumearble().contains(x[key]))
}

@valueConverter('fileListToArray')
export class FileListToArrayValueConverter {
  toView(fileList) {
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

window.w6Cheat.converters.amount = Container.instance.get(AmountValueConverter);
window.w6Cheat.converters.speed = Container.instance.get(SpeedValueConverter);
window.w6Cheat.converters.size = Container.instance.get(SizeValueConverter);
window.w6Cheat.converters.text = Container.instance.get(TextValueConverter);

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
