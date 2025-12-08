/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value == null
}

/**
 * Check if a value is NOT null or undefined (type-narrowing)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value != null
}

/**
 * Check if a value is "empty" (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Check if a value is a non-empty array
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Check if a value is a plain object (not array, null, Date, etc.)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  )
}

/**
 * Check if a value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * Check if a value is a promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value != null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  )
}

/**
 * Assert that a condition is true, narrowing the type
 */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed')
  }
}

/**
 * Assert that a value is not null/undefined, narrowing the type
 */
export function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value == null) {
    throw new Error(message ?? 'Expected value to exist')
  }
}

/**
 * Exhaustive check for switch statements - TypeScript will error if not all cases are handled
 */
export function exhaustive(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled case: ${value}`)
}
