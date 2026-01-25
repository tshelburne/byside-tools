/**
 * Ensures a value is a Date object.
 * Useful when working with ORMs that return Date | string.
 *
 * @example
 * const date = ensureDate('2024-01-01') // Date object
 * const date = ensureDate(new Date()) // Date object (passthrough)
 */
export function ensureDate(value: Date | string): Date
export function ensureDate(value: Date | string | null): Date | null
export function ensureDate(value: Date | string | null): Date | null {
  if (value === null) return null
  return value instanceof Date ? value : new Date(value)
}
