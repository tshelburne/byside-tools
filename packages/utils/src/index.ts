// Array utilities
export {
  compact,
  range,
  chunk,
  unique,
  uniqueBy,
  groupBy,
  partition,
  zip,
  difference,
  intersect,
  replaceAt,
} from './array.js'

// Object utilities
export {
  pick,
  omit,
  mapValues,
  removeUndefined,
  removeNullish,
  deepMerge,
  pluck,
  updateAt,
  keys,
  values,
  entries,
  keyBy,
  type Path,
  type PathValue,
} from './object.js'

// String utilities
export {
  titleCase,
  capitalize,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
  truncate,
  pluralize,
} from './string.js'

// Promise utilities
export { sequence, waitFor, delay, timeout, TimeoutError, retry, deferred } from './promise.js'
export type { RetryOptions, Deferred } from './promise.js'

// Browser utilities
export { waitForElement } from './browser.js'

// Result type
export { Ok, Err, tryCatch, tryCatchAsync, isOk, isErr, unwrapOr } from './result.js'
export type { Result, Ok as OkType, Err as ErrType } from './result.js'

// Formatting utilities
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatPhone,
} from './format.js'
export type {
  NumberFormatOptions,
  CurrencyFormatOptions,
  PercentFormatOptions,
  DateFormatOptions,
  DateFormatStyle,
} from './format.js'

// Type guards
export {
  isNullish,
  exists,
  isEmpty,
  isNonEmptyString,
  isNonEmptyArray,
  isPlainObject,
  isFunction,
  isPromise,
  assert,
  assertExists,
  exhaustive,
} from './guards.js'

// Type-level testing utilities
export type { Expect, Equals, Extends, IsNever, IsAny, IsUnknown } from './test.js'
