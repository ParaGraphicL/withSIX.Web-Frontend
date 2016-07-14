export var createError = (name: string, proto = Error.prototype): ErrorConstructor => {
  var f = function(message: string) {
    Object.defineProperty(this, 'name', {
      enumerable: false,
      writable: false,
      value: name
    });
    Object.defineProperty(this, 'message', {
      enumerable: false,
      writable: true,
      value: message
    });

    if (Error.hasOwnProperty('captureStackTrace')) { // V8
      (<any>Error).captureStackTrace(this, this.constructor);
    } else {
      Object.defineProperty(this, 'stack', {
        enumerable: false,
        writable: false,
        value: (<any>(new Error(message))).stack
      });
    }
  }
  if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(f.prototype, proto);
  } else {
    f.prototype = Object.create(proto);
  }
  return <any>f;
}
