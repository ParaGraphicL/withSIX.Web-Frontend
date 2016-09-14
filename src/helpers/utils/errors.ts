export interface ErrorWithOptionalInner extends Error {
  inner?: ErrorWithOptionalInner;
}

export interface ErrorWithInnerConstructor extends ErrorConstructor {
  new (message?: string, inner?: Error): ErrorWithOptionalInner;
}

export var createError = (name: string, proto = Error.prototype): ErrorWithInnerConstructor => {
  var f = function(message: string, inner?: ErrorWithOptionalInner) {
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
    Object.defineProperty(this, 'inner', {
      enumerable: false,
      writable: false,
      value: inner
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

// todo; with inner ex

// https://github.com/bjyoungblood/es6-error
// class Exception extends ExtendableError {
//     public innerException: Error;
//     constructor(message?: string, innerException?: Error|string) {
//         super(message);
//         // if (typeof (<any>Error).captureStackTrace === 'function') {
//         //     //noinspection JSUnresolvedFunction
//         //     (<any>Error).captureStackTrace(this, arguments.callee);
//         // }
//         this.name = "Exception";
//         if (innerException) {
//             if (innerException instanceof Error) {
//                 this.innerException = innerException;
//                 this.message = message + ", innerException: " + this.innerException.message;
//             }
//             else if (typeof innerException === "string") {
//                 this.innerException = new Error(innerException);
//                 this.message = message + ", innerException: " + this.innerException.message;
//             }
//             else {
//                 // this.innerException = <any>innerException;
//                 // this.message = message + ", innerException: " + this.innerException;
//             }
//         }
//         else {
//             this.message = message;
//         }
//     }
// }
//
