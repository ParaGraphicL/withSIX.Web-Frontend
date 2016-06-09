import {bindable} from 'aurelia-framework';

// TODO: Fix for relative paths..
export class LoadingComposer {
  @bindable viewModel;
  @bindable model;
  @bindable view;
  @bindable shown = true; // https://jonsuh.com/blog/detect-the-end-of-css-animations-and-transitions-with-javascript/

  get currentView() { return this.shown ? this.view : './dummy.html' }
}
