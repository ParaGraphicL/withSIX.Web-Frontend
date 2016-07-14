export const defineProperty = (target: Object, name: string, value: any, overwrite = false) => {
  if (!overwrite && target[name]) return;
  Object.defineProperty(target, name, {
    value: value,
    enumerable: false,
    configurable: true,
    writable: true
  })
}

// export const defineProperty2 = (target: Object, name: string, value: Function, overwrite = false) => {
//   if (!overwrite && target[name]) return;
//   Object.defineProperty(target, name, {
//     value: function(...args) { return value(...args) },
//     enumerable: false,
//     configurable: true,
//     writable: true
//   })
// }

export const defineProperties = <T>(object: Object, map: {[key: string]: T}, overwrite = false, transform = (x: T) => x) =>
  Object.keys(map).forEach(name =>
    defineProperty(object, name, transform(map[name]), overwrite))

export const defineFunctions = (object: Object, map: {[key: string]: Function}, overwrite = false) =>
  defineProperties(object, map, overwrite, f => function(...args) { return f(this, ...args) })
