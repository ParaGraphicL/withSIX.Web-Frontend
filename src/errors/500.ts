import {BaseError} from './base';
import {UiContext} from '../framework';
import {inject} from 'aurelia-framework';

@inject(UiContext)
export class Error403 extends BaseError {
  constructor(ui) { super("500", ui) }
}
