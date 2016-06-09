import {BaseError} from './base';

export class Error404 extends BaseError {
  constructor() { super("404") }
}
