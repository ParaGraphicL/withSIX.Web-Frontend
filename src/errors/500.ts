import {BaseError} from './base';

export class Error500 extends BaseError {
  constructor() { super("500") }
}
