import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';

@inject(Router)
export class RouteSegmentActiveValueConverter {
  constructor(private router: Router) { }

  toView(fullSegment, isDefault?) {
    let fullPath = '/' + fullSegment.replace(/\./g, "/");
    let fragment = this.router.currentInstruction.fragment;
    return fragment.startsWith(fullPath) || (isDefault && fragment == this.getDefault(fullPath)) ? 'active' : '';
  }
  getDefault(fullPath: string) {
    let split = fullPath.split("/");
    return split.slice(0, split.length - 1).join("/");
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
