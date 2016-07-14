import {flatten, entries} from './utils/iterable'
import {indexOfIgnoreCase, endsWithIgnoreCase, startsWithIgnoreCase, toUpperCaseFirst, toLowerCaseFirst, containsIgnoreCase, equalsIgnoreCase, truncate, sluggify, sluggifyEntityName} from './utils/string'
import {defineProperties} from './utils/extenders'
import Linq from 'linq4es2015'

Linq.setExtensions();

defineProperties(String.prototype, {
  'indexOfIgnoreCase': indexOfIgnoreCase,
  'endsWithIgnoreCase': endsWithIgnoreCase,
  'startsWithIgnoreCase': startsWithIgnoreCase,
  'toUpperCaseFirst': toUpperCaseFirst,
  'toLowerCaseFirst': toLowerCaseFirst,
  'containsIgnoreCase': containsIgnoreCase,
  'equalsIgnoreCase': equalsIgnoreCase,
  'toShortId': Tools.toShortId,
  'fromShortId': Tools.fromShortId,
  'sluggify': sluggify,
  'sluggifyEntityName': sluggifyEntityName,
  'truncate': truncate
})

defineProperties(Array.prototype, {
   'flatten': flatten
});
defineProperties(Object.prototype, {
   'entries': entries
});
