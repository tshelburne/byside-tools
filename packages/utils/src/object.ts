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

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : undefined
  : P extends keyof T
    ? T[P]
    : undefined

/**
 * Get a nested value from an object by dot-separated path
 */
export function pluck<T extends object, P extends string>(obj: T, path: P): PathValue<T, P> {
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
