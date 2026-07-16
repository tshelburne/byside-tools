import { camelCase, constantCase, kebabCase, pascalCase, snakeCase } from './string.js'

export type { Path, PathValue, MapKeys, DeepMapKeys, MapKeysReturn } from './object.types.js'
export type { CamelCase, PascalCase, SnakeCase, KebabCase, ConstantCase } from './string.types.js'

import type { Path, PathValue, MapKeysReturn } from './object.types.js'

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const keysSet = new Set<PropertyKey>(keys)
  const result = {} as Omit<T, K>
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!keysSet.has(key)) {
      ;(result as T)[key] = obj[key]
    }
  }
  return result
}

/**
 * Transform all values in an object
 */
export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): { [K in keyof T]: U } {
  const result = {} as { [K in keyof T]: U }
  for (const key of Object.keys(obj) as Array<keyof T>) {
    result[key] = fn(obj[key], key)
  }
  return result
}

/**
 * Remove keys with undefined values from an object
 */
export function removeUndefined<T extends object>(obj: T): Partial<T> {
  const result = {} as Partial<T>
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Remove keys with null or undefined values from an object
 */
export function removeNullish<T extends object>(obj: T): Partial<T> {
  const result = {} as Partial<T>
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] != null) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Check if a value is a plain object (not an array, null, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  )
}

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  const result = { ...target } as T & U

  for (const key of Object.keys(source) as Array<keyof U>) {
    const sourceValue = source[key]
    const targetValue = (target as Record<keyof U, unknown>)[key]

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      ;(result as Record<keyof U, unknown>)[key] = deepMerge(targetValue, sourceValue)
    } else {
      ;(result as Record<keyof U, unknown>)[key] = sourceValue
    }
  }

  return result
}

/**
 * Get a nested value from an object by dot-separated path
 */
export function pluck<T extends object, P extends Path<T>>(obj: T, path: P): PathValue<T, P> {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined as PathValue<T, P>
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current as PathValue<T, P>
}

/**
 * Immutably update a nested value in an object by dot-separated path.
 * Handles both object properties and array indices.
 *
 * @example
 * const user = { name: 'John', address: { city: 'NYC' } }
 * updateAt(user, 'address.city', 'LA') // { name: 'John', address: { city: 'LA' } }
 *
 * const items = ['a', 'b', 'c']
 * updateAt(items, '1', 'x') // ['a', 'x', 'c']
 */
export function updateAt<T, P extends string>(obj: T, path: P, value: PathValue<T, P>): T {
  const keys = path.split('.')
  return updateAtKeys(obj, keys, value) as T
}

function updateAtKeys(obj: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) return value

  const [head, ...rest] = keys as [string, ...string[]]

  if (Array.isArray(obj)) {
    const index = Number(head)
    const result = [...obj]
    result[index] = updateAtKeys(obj[index], rest, value)
    return result
  }

  if (obj != null && typeof obj === 'object') {
    return {
      ...obj,
      [head]: updateAtKeys((obj as Record<string, unknown>)[head], rest, value),
    }
  }

  return obj
}

/**
 * Typed Object.keys
 */
export function keys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

/**
 * Typed Object.values
 */
export function values<T extends object>(obj: T): Array<T[keyof T]> {
  return Object.values(obj) as Array<T[keyof T]>
}

/**
 * Typed Object.entries
 */
export function entries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}

/**
 * Create an object from an array using a key function
 */
export function keyBy<T, K extends PropertyKey>(
  arr: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T> {
  return arr.reduce((acc, item) => ({ ...acc, [keyFn(item)]: item }), {} as Record<K, T>)
}

interface MapKeysOptions {
  recursive?: boolean
}

/**
 * Transform all keys in an object using a mapping function.
 *
 * @example
 * mapKeys({ first_name: 'John' }, k => k.toUpperCase())
 * // { FIRST_NAME: 'John' }
 *
 * @example
 * mapKeys({ user: { first_name: 'John' } }, k => k.toUpperCase(), { recursive: true })
 * // { USER: { FIRST_NAME: 'John' } }
 */
export function mapKeys<T extends object>(
  obj: T,
  fn: (key: string) => string,
  opts?: MapKeysOptions,
): Record<string, T[keyof T]> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key]
    const newKey = fn(key)

    if (opts?.recursive && isPlainObject(value)) {
      result[newKey] = mapKeys(value, fn, opts)
    } else if (opts?.recursive && Array.isArray(value)) {
      result[newKey] = value.map((item) => (isPlainObject(item) ? mapKeys(item, fn, opts) : item))
    } else {
      result[newKey] = value
    }
  }

  return result as Record<string, T[keyof T]>
}

/**
 * Transform all object keys to camelCase
 *
 * @example
 * camelCaseKeys({ first_name: 'John', last_name: 'Doe' })
 * // { firstName: 'John', lastName: 'Doe' }
 */
export function camelCaseKeys<T extends object, O extends MapKeysOptions | undefined = undefined>(
  obj: T,
  opts?: O,
): MapKeysReturn<T, typeof camelCase, O> {
  return mapKeys(obj, camelCase, opts) as MapKeysReturn<T, typeof camelCase, O>
}

/**
 * Transform all object keys to PascalCase
 *
 * @example
 * pascalCaseKeys({ first_name: 'John' })
 * // { FirstName: 'John' }
 */
export function pascalCaseKeys<T extends object, O extends MapKeysOptions | undefined = undefined>(
  obj: T,
  opts?: O,
): MapKeysReturn<T, typeof pascalCase, O> {
  return mapKeys(obj, pascalCase, opts) as MapKeysReturn<T, typeof pascalCase, O>
}

/**
 * Transform all object keys to snake_case
 *
 * @example
 * snakeCaseKeys({ firstName: 'John', lastName: 'Doe' })
 * // { first_name: 'John', last_name: 'Doe' }
 */
export function snakeCaseKeys<T extends object, O extends MapKeysOptions | undefined = undefined>(
  obj: T,
  opts?: O,
): MapKeysReturn<T, typeof snakeCase, O> {
  return mapKeys(obj, snakeCase, opts) as MapKeysReturn<T, typeof snakeCase, O>
}

/**
 * Transform all object keys to kebab-case
 *
 * @example
 * kebabCaseKeys({ firstName: 'John' })
 * // { 'first-name': 'John' }
 */
export function kebabCaseKeys<T extends object, O extends MapKeysOptions | undefined = undefined>(
  obj: T,
  opts?: O,
): MapKeysReturn<T, typeof kebabCase, O> {
  return mapKeys(obj, kebabCase, opts) as MapKeysReturn<T, typeof kebabCase, O>
}

/**
 * Transform all object keys to CONSTANT_CASE
 *
 * @example
 * constantCaseKeys({ firstName: 'John' })
 * // { FIRST_NAME: 'John' }
 */
export function constantCaseKeys<
  T extends object,
  O extends MapKeysOptions | undefined = undefined,
>(obj: T, opts?: O): MapKeysReturn<T, typeof constantCase, O> {
  return mapKeys(obj, constantCase, opts) as MapKeysReturn<T, typeof constantCase, O>
}
