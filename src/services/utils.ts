import Linq from 'linq4es2015';

export default class Utils {
  static flattenEnumerable<T>(results: Enumerable<T>[]) {
    var concated = Linq.empty();
    results.forEach(x => concated = concated.concat(x));
    return concated;
  }
  static flatten<T>(results: T[][]) {
    let concated = [];
    results.forEach(x => concated = concated.concat(x));
    return concated;
  }
}
