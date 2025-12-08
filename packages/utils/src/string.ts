/**
 * Convert to Title Case, replacing underscores with spaces
 * Example: "south_asian" -> "South Asian"
 */
export function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
