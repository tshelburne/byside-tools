/**
 * Removes null and undefined values from an array.
 */
export function compact<T>(arr: Array<T | null | undefined>): T[] {
  return arr.filter((x): x is T => x != null)
}

/**
 * Generate an array of numbers from start (inclusive) to end (exclusive)
 */
export function range(start: number, end: number): number[] {
  const length = Math.max(0, end - start)
  return Array.from({ length }, (_, i) => start + i)
}

/**
 * Split an array into chunks of a given size
 */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) return []
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

/**
 * Get unique values from an array (by reference/value equality)
 */
export function unique<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Get unique values from an array using a key function
 */
export function uniqueBy<T, K>(arr: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  return arr.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Group array items by a key function
 */
export function groupBy<T, K extends PropertyKey>(
  arr: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item)
      return { ...acc, [key]: [...(acc[key] ?? []), item] }
    },
    {} as Record<K, T[]>,
  )
}

/**
 * Split an array into two arrays based on a predicate.
 * Returns [matching, nonMatching]
 */
export function partition<T>(arr: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  return arr.reduce<[T[], T[]]>(
    ([pass, fail], item) => (predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]]),
    [[], []],
  )
}

/**
 * Combine two arrays element-wise into an array of tuples
 */
export function zip<A, B>(a: readonly A[], b: readonly B[]): [A, B][] {
  const length = Math.min(a.length, b.length)
  const result: [A, B][] = []
  for (let i = 0; i < length; i++) {
    result.push([a[i] as A, b[i] as B])
  }
  return result
}

/**
 * Get items that are in the first array but not in the second
 */
export function difference<T>(a: readonly T[], b: readonly T[]): T[] {
  const setB = new Set(b)
  return a.filter((item) => !setB.has(item))
}

/**
 * Get items that are in both arrays
 */
export function intersect<T>(a: readonly T[], b: readonly T[]): T[] {
  const setB = new Set(b)
  return a.filter((item) => setB.has(item))
}

/**
 * Replace an item at a given index, returning a new array.
 * Useful for immutable state updates.
 */
export function replaceAt<T>(arr: readonly T[], index: number, value: T): T[] {
  const result = [...arr]
  result[index] = value
  return result
}
