export const createHttpError = (name: string, proto = Error.prototype): HttpErrorConstructor<any> => {
  var f = function(message: string, requestInfo: IRequestInfo<any>) {
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
    Object.defineProperty(this, 'status', {
      enumerable: false,
      writable: false,
      value: requestInfo.status
    });
    Object.defineProperty(this, 'statusText', {
      enumerable: false,
      writable: false,
      value: requestInfo.statusText
    });
    Object.defineProperty(this, 'body', {
      enumerable: false,
      writable: false,
      value: requestInfo.body
    });
    Object.defineProperty(this, 'headers', {
      enumerable: false,
      writable: true,
      value: requestInfo.headers
    });
    Object.defineProperty(this, 'requestID', {
      enumerable: false,
      writable: true,
      value: requestInfo.headers ? requestInfo.headers['withSIX-RequestID'] : null
    });

    if (requestInfo.body && requestInfo.body.modelState) {
      Object.defineProperty(this, 'modelState', {
        enumerable: false,
        writable: true,
        value: requestInfo.body.modelState
      });
    }

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


export interface IRequestInfo<T> {
  status: number;
  statusText: string;
  body: T;
  headers?: Headers;
}


export interface HttpErrorConstructor<T extends ErrorResponseBody> {
  new (message: string, requestInfo: IRequestInfo<T>): IHttpException<T>;
}

export interface ValidationErrorConstructor {
  new (message: string, requestInfo: IRequestInfo<ValidationResponseBody>): IValidationException;
}

export interface IHttpException<T extends ErrorResponseBody> extends Error, IRequestInfo<T> { }
export interface IValidationException extends IHttpException<ValidationResponseBody> {
  modelState?;
}

export interface ErrorResponseBody {
  message: string;
}

export interface ValidationResponseBody extends ErrorResponseBody {
  modelState?
}
