/**
 * Convert to Title Case, replacing underscores with spaces
 * Example: "south_asian" -> "South Asian"
 */
export function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Capitalize the first letter of a string
 * Example: "hello world" -> "Hello world"
 */
export function capitalize(value: string): string {
  if (value.length === 0) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Split a string into words, handling various delimiters and casing
 */
function splitWords(value: string): string[] {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // split ABCDef -> ABC Def
    .replace(/[-_]/g, ' ') // replace delimiters with space
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Convert to camelCase
 * Example: "hello_world" -> "helloWorld"
 * Example: "Hello World" -> "helloWorld"
 */
export function camelCase(value: string): string {
  const words = splitWords(value)
  if (words.length === 0) return ''
  return words
    .map((word, i) => {
      const lower = word.toLowerCase()
      return i === 0 ? lower : capitalize(lower)
    })
    .join('')
}

/**
 * Convert to PascalCase
 * Example: "hello_world" -> "HelloWorld"
 * Example: "hello world" -> "HelloWorld"
 */
export function pascalCase(value: string): string {
  const words = splitWords(value)
  return words.map((word) => capitalize(word.toLowerCase())).join('')
}

/**
 * Convert to snake_case
 * Example: "helloWorld" -> "hello_world"
 * Example: "Hello World" -> "hello_world"
 */
export function snakeCase(value: string): string {
  const words = splitWords(value)
  return words.map((word) => word.toLowerCase()).join('_')
}

/**
 * Convert to kebab-case
 * Example: "helloWorld" -> "hello-world"
 * Example: "Hello World" -> "hello-world"
 */
export function kebabCase(value: string): string {
  const words = splitWords(value)
  return words.map((word) => word.toLowerCase()).join('-')
}

/**
 * Convert to CONSTANT_CASE
 * Example: "helloWorld" -> "HELLO_WORLD"
 */
export function constantCase(value: string): string {
  const words = splitWords(value)
  return words.map((word) => word.toUpperCase()).join('_')
}

/**
 * Truncate a string to a maximum length, adding an ellipsis if truncated
 */
export function truncate(value: string, maxLength: number, suffix = '...'): string {
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Pluralize a word based on count
 * Example: pluralize(1, "item") -> "item"
 * Example: pluralize(5, "item") -> "items"
 * Example: pluralize(5, "person", "people") -> "people"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural ?? singular + 's'
}
