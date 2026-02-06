/**
 * Type-level string case conversion utilities and tests.
 * Tests run at compile time - if this file compiles, the types are correct.
 */

import type { Equals, Expect } from './test.js'

// --- String Case Type Utilities ---

type UppercaseLetters =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'

/**
 * Split a string at delimiter boundaries (_, -, space)
 */
type SplitAtDelimiters<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? Head extends ''
    ? SplitAtDelimiters<Tail>
    : [Head, ...SplitAtDelimiters<Tail>]
  : S extends `${infer Head}-${infer Tail}`
    ? Head extends ''
      ? SplitAtDelimiters<Tail>
      : [Head, ...SplitAtDelimiters<Tail>]
    : S extends `${infer Head} ${infer Tail}`
      ? Head extends ''
        ? SplitAtDelimiters<Tail>
        : [Head, ...SplitAtDelimiters<Tail>]
      : S extends ''
        ? []
        : [S]

/**
 * Check if a string is all uppercase
 */
type IsAllUppercase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends UppercaseLetters
    ? IsAllUppercase<Tail>
    : false
  : true

/**
 * Split a single word at camelCase boundaries (lowercase followed by uppercase).
 * If the word is all uppercase, treat it as a single word.
 */
type SplitCamelWord<S extends string, Acc extends string = ''> = IsAllUppercase<S> extends true
  ? S extends ''
    ? Acc extends ''
      ? []
      : [Acc]
    : [S]
  : S extends `${infer Head}${infer Tail}`
    ? Head extends UppercaseLetters
      ? Acc extends ''
        ? SplitCamelWord<Tail, Head>
        : [Acc, ...SplitCamelWord<Tail, Head>]
      : SplitCamelWord<Tail, `${Acc}${Head}`>
    : Acc extends ''
      ? []
      : [Acc]

/**
 * Apply camel splitting to each word from delimiter splitting
 */
type SplitAllWords<Words extends string[]> = Words extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? [...SplitCamelWord<First>, ...SplitAllWords<Rest>]
  : []

/**
 * Split a string into words, handling delimiters and case transitions
 */
type SplitWords<S extends string> = SplitAllWords<SplitAtDelimiters<S>>

/**
 * Join words into camelCase: first word lowercase, rest capitalized
 */
type JoinCamelCase<Words extends string[]> = Words extends [infer First extends string]
  ? Lowercase<First>
  : Words extends [infer First extends string, ...infer Rest extends string[]]
    ? `${Lowercase<First>}${JoinPascalCase<Rest>}`
    : ''

/**
 * Join words into PascalCase: all words capitalized
 */
type JoinPascalCase<Words extends string[]> = Words extends [infer First extends string]
  ? Capitalize<Lowercase<First>>
  : Words extends [infer First extends string, ...infer Rest extends string[]]
    ? `${Capitalize<Lowercase<First>>}${JoinPascalCase<Rest>}`
    : ''

/**
 * Join words into snake_case: all lowercase with underscores
 */
type JoinSnakeCase<Words extends string[]> = Words extends [infer First extends string]
  ? Lowercase<First>
  : Words extends [infer First extends string, ...infer Rest extends string[]]
    ? `${Lowercase<First>}_${JoinSnakeCase<Rest>}`
    : ''

/**
 * Join words into kebab-case: all lowercase with hyphens
 */
type JoinKebabCase<Words extends string[]> = Words extends [infer First extends string]
  ? Lowercase<First>
  : Words extends [infer First extends string, ...infer Rest extends string[]]
    ? `${Lowercase<First>}-${JoinKebabCase<Rest>}`
    : ''

/**
 * Join words into CONSTANT_CASE: all uppercase with underscores
 */
type JoinConstantCase<Words extends string[]> = Words extends [infer First extends string]
  ? Uppercase<First>
  : Words extends [infer First extends string, ...infer Rest extends string[]]
    ? `${Uppercase<First>}_${JoinConstantCase<Rest>}`
    : ''

/**
 * Convert a string to camelCase at the type level
 */
export type CamelCase<S extends string> = JoinCamelCase<SplitWords<S>>

/**
 * Convert a string to PascalCase at the type level
 */
export type PascalCase<S extends string> = JoinPascalCase<SplitWords<S>>

/**
 * Convert a string to snake_case at the type level
 */
export type SnakeCase<S extends string> = JoinSnakeCase<SplitWords<S>>

/**
 * Convert a string to kebab-case at the type level
 */
export type KebabCase<S extends string> = JoinKebabCase<SplitWords<S>>

/**
 * Convert a string to CONSTANT_CASE at the type level
 */
export type ConstantCase<S extends string> = JoinConstantCase<SplitWords<S>>

// --- CamelCase Tests ---

// From snake_case
type _CamelFromSnake1 = Expect<Equals<CamelCase<'first_name'>, 'firstName'>>
type _CamelFromSnake2 = Expect<Equals<CamelCase<'user_id'>, 'userId'>>
type _CamelFromSnake3 = Expect<Equals<CamelCase<'is_active'>, 'isActive'>>

// From kebab-case
type _CamelFromKebab1 = Expect<Equals<CamelCase<'first-name'>, 'firstName'>>
type _CamelFromKebab2 = Expect<Equals<CamelCase<'user-id'>, 'userId'>>

// From PascalCase
type _CamelFromPascal1 = Expect<Equals<CamelCase<'FirstName'>, 'firstName'>>
type _CamelFromPascal2 = Expect<Equals<CamelCase<'UserId'>, 'userId'>>

// From CONSTANT_CASE
type _CamelFromConstant1 = Expect<Equals<CamelCase<'FIRST_NAME'>, 'firstName'>>
type _CamelFromConstant2 = Expect<Equals<CamelCase<'USER_ID'>, 'userId'>>

// Already camelCase
type _CamelIdempotent = Expect<Equals<CamelCase<'firstName'>, 'firstName'>>

// --- PascalCase Tests ---

// From snake_case
type _PascalFromSnake1 = Expect<Equals<PascalCase<'first_name'>, 'FirstName'>>
type _PascalFromSnake2 = Expect<Equals<PascalCase<'user_id'>, 'UserId'>>

// From camelCase
type _PascalFromCamel1 = Expect<Equals<PascalCase<'firstName'>, 'FirstName'>>
type _PascalFromCamel2 = Expect<Equals<PascalCase<'userId'>, 'UserId'>>

// From kebab-case
type _PascalFromKebab1 = Expect<Equals<PascalCase<'first-name'>, 'FirstName'>>

// Already PascalCase
type _PascalIdempotent = Expect<Equals<PascalCase<'FirstName'>, 'FirstName'>>

// --- SnakeCase Tests ---

// From camelCase
type _SnakeFromCamel1 = Expect<Equals<SnakeCase<'firstName'>, 'first_name'>>
type _SnakeFromCamel2 = Expect<Equals<SnakeCase<'userId'>, 'user_id'>>
type _SnakeFromCamel3 = Expect<Equals<SnakeCase<'isActive'>, 'is_active'>>

// From PascalCase
type _SnakeFromPascal1 = Expect<Equals<SnakeCase<'FirstName'>, 'first_name'>>
type _SnakeFromPascal2 = Expect<Equals<SnakeCase<'UserId'>, 'user_id'>>

// From kebab-case
type _SnakeFromKebab1 = Expect<Equals<SnakeCase<'first-name'>, 'first_name'>>

// Already snake_case
type _SnakeIdempotent = Expect<Equals<SnakeCase<'first_name'>, 'first_name'>>

// --- KebabCase Tests ---

// From camelCase
type _KebabFromCamel1 = Expect<Equals<KebabCase<'firstName'>, 'first-name'>>
type _KebabFromCamel2 = Expect<Equals<KebabCase<'userId'>, 'user-id'>>

// From PascalCase
type _KebabFromPascal1 = Expect<Equals<KebabCase<'FirstName'>, 'first-name'>>

// From snake_case
type _KebabFromSnake1 = Expect<Equals<KebabCase<'first_name'>, 'first-name'>>

// Already kebab-case
type _KebabIdempotent = Expect<Equals<KebabCase<'first-name'>, 'first-name'>>

// --- ConstantCase Tests ---

// From camelCase
type _ConstantFromCamel1 = Expect<Equals<ConstantCase<'firstName'>, 'FIRST_NAME'>>
type _ConstantFromCamel2 = Expect<Equals<ConstantCase<'userId'>, 'USER_ID'>>

// From snake_case
type _ConstantFromSnake1 = Expect<Equals<ConstantCase<'first_name'>, 'FIRST_NAME'>>

// From PascalCase
type _ConstantFromPascal1 = Expect<Equals<ConstantCase<'FirstName'>, 'FIRST_NAME'>>

// Already CONSTANT_CASE
type _ConstantIdempotent = Expect<Equals<ConstantCase<'FIRST_NAME'>, 'FIRST_NAME'>>
