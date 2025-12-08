/**
 * Removes null and undefined values from an array.
 */
export function compact<T>(arr: Array<T | null | undefined>): T[] {
  return arr.filter((x): x is T => x != null)
}
