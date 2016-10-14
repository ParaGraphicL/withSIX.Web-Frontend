import {flatten, entries, removeEl, aryToMap, includes, move, uniq} from './utils/iterable'
import {indexOfIgnoreCase, endsWithIgnoreCase, startsWithIgnoreCase, toUpperCaseFirst, toLowerCaseFirst, containsIgnoreCase, equalsIgnoreCase, truncate, sluggify, sluggifyEntityName, toShortId, fromShortId} from './utils/string'
import {defineFunctions} from './utils/extenders'
import Linq from 'linq4es2015'

Linq.setExtensions();

defineFunctions(String.prototype, {
  'indexOfIgnoreCase': indexOfIgnoreCase,
  'endsWithIgnoreCase': endsWithIgnoreCase,
  'startsWithIgnoreCase': startsWithIgnoreCase,
  'toUpperCaseFirst': toUpperCaseFirst,
  'toLowerCaseFirst': toLowerCaseFirst,
  'containsIgnoreCase': containsIgnoreCase,
  'equalsIgnoreCase': equalsIgnoreCase,
  'toShortId': toShortId,
  'fromShortId': fromShortId,
  'sluggify': sluggify,
  'sluggifyEntityName': sluggifyEntityName,
  'truncate': truncate
})

defineFunctions(Array.prototype, {
   'flatten': flatten,
   'removeEl': removeEl,
   'toMap': aryToMap,
   'includes': includes,
   'move': move,
   'uniq': uniq,
});
defineFunctions(Object.prototype, {
   'entries': entries
});
