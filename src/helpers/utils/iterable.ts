import Linq from 'linq4es2015';

export const flatten = <T>([first, ...rest]): T[] => {
  if (first === undefined)
    return [];
  else if (!Array.isArray(first))
    return [<T>first, ...flatten<T>(rest)];
  else
    return [...flatten<T>(first), ...flatten<T>(rest)];
}

// alternative
const foldl = (fn, terminalValue, [first, ...rest]) =>
  first === void 0
   ? terminalValue
   : foldl(fn, fn(terminalValue, first), rest)

const flatten2 = (list: any[]) => foldl(
  (a: any[], b) => a.concat(Array.isArray(b) ? flatten2(b) : b)
  , []
  , list);

export const flattenEnumerable = <T>(results: Enumerable<T>[]) => {
  var concated = Linq.empty<T>();
  results.forEach(x => concated = concated.concat(x));
  return concated;
}

export function* entries<T>(obj: T) {
   for (let key of Object.keys(obj)) {
     yield [key, obj[key]];
   }
}
