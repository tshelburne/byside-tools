/**
 * Type-level testing utilities.
 * Use these to write compile-time type assertions.
 *
 * @example
 * import type { Expect, Equals } from '@byside/utils/test'
 *
 * type _Test = Expect<Equals<Path<User>, 'name' | 'age'>>
 */

/**
 * Returns true if T and U are exactly equal types.
 */
export type Equals<T, U> =
  (<X>() => X extends T ? 1 : 2) extends <X>() => X extends U ? 1 : 2 ? true : false

/**
 * Asserts that T is true at compile time.
 * Causes a type error if T is false or not a boolean literal.
 *
 * @example
 * type _Pass = Expect<true>
 * type _Fail = Expect<false> // Error!
 */
export type Expect<T extends true> = T

/**
 * Returns true if T extends U.
 *
 * @example
 * type _Test = Expect<Extends<'foo', string>> // passes
 */
export type Extends<T, U> = T extends U ? true : false

/**
 * Returns true if T is exactly `never`.
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Returns true if T is `any`.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Returns true if T is `unknown`.
 */
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false
