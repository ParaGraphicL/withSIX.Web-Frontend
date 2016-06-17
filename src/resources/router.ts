import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';

@inject(Router)
export class RouteSegmentActiveValueConverter {
  constructor(private router: Router) { }

  toView(fullSegment, isDefault?) {
    let fullPath = '/' + fullSegment.replace(/\./g, "/");
    let fragment = this.router.currentInstruction.fragment;
    return fragment.startsWith(fullPath) || (isDefault && this.getDefault(fullPath, fragment)) ? 'active' : '';
  }
  getDefault(fullPath: string, fragment: string) {
    var split;
    while (split = fullPath.split("/")) {
      if (split.length == 1) return fragment == split[0];
      fullPath = split.slice(0, split.length - 1).join("/");
      if (fragment == fullPath) return true;
    }
    return false;
  }
}

@inject(Router)
export class RouteSegmentUrlValueConverter {
  constructor(private router: Router) {
  }
  toView(fullSegment) {
    return "/" + fullSegment.replace(/\./g, "/");
  }
}
