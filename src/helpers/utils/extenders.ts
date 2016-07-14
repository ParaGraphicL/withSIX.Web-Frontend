export const defineProperty = (target: Object, name: string, value: Function, overwrite = false) => {
  if (!overwrite && target[name]) return;
  Object.defineProperty(target, name, {
    value: function(...args) { return value(this, ...args) },
    enumerable: false,
    configurable: true,
    writable: true
  })
}

export const defineProperty2 = (target: Object, name: string, value: Function, overwrite = false) => {
  if (!overwrite && target[name]) return;
  Object.defineProperty(target, name, {
    value: function(...args) { return value(...args) },
    enumerable: false,
    configurable: true,
    writable: true
  })
}

export const defineProperties = (object: Object, map: {[key: string]: Function}, overwrite = false) =>
  Object.keys(map).forEach(name =>
    defineProperty(object, name, map[name], overwrite));
