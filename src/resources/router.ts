import {inject, autoinject, customAttribute} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';

@inject(Router)
export class RouteSegmentActiveValueConverter {
  constructor(private router: Router) { }

  toView(fullSegment) { return this.router.currentInstruction.fragment.startsWith('/' + fullSegment) ? 'active' : ''; }
}

@inject(Router)
export class RouteSegmentUrlValueConverter {
  constructor(private router: Router) {
  }
  toView(fullSegment) {
    return "/" + fullSegment;
  }
}
