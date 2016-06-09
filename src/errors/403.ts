import {BaseError} from './base';

export class Error403 extends BaseError {
  constructor() { super("403") }
}
