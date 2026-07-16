/**
 * Type-level utilities for object manipulation and tests.
 * Tests run at compile time - if this file compiles, the types are correct.
 */

import type { CamelCase, PascalCase, SnakeCase, KebabCase, ConstantCase } from './string.types.js'
import type { Equals, Expect, Extends } from './test.js'
import type { camelCase, pascalCase, snakeCase, kebabCase, constantCase } from './string.js'

// --- Path Types ---

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? K | `${K}.${PathImpl<T[K], keyof T[K] & string>}`
    : K
  : never

/**
 * Recursively extracts all valid dot-notation paths for an object type.
 * Supports nested objects and arrays.
 *
 * @example
 * type User = { name: string; address: { city: string } }
 * type UserPaths = Path<User> // 'name' | 'address' | 'address.city'
 */
export type Path<T> =
  T extends Array<infer U>
    ? `${number}` | `${number}.${Path<U>}`
    : T extends Record<string, unknown>
      ? PathImpl<T, keyof T & string>
      : never

/**
 * Extracts the type at a given path within an object type.
 * Supports nested objects and array indices.
 *
 * @example
 * type User = { name: string; tags: string[] }
 * type Name = PathValue<User, 'name'> // string
 * type Tag = PathValue<string[], '0'> // string
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : K extends `${number}`
      ? T extends Array<infer U>
        ? PathValue<U, Rest>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${number}`
      ? T extends Array<infer U>
        ? U
        : never
      : never

/**
 * A function that transforms a string key to another string type
 */
/**
 * Apply a key transformation function type to a string.
 * Maps typeof camelCase -> CamelCase<S>, etc.
 */
type ApplyKeyMapper<F, S extends string> = F extends typeof camelCase
  ? CamelCase<S>
  : F extends typeof pascalCase
    ? PascalCase<S>
    : F extends typeof snakeCase
      ? SnakeCase<S>
      : F extends typeof kebabCase
        ? KebabCase<S>
        : F extends typeof constantCase
          ? ConstantCase<S>
          : string

/**
 * Map object keys using a key transformation function type.
 *
 * @example
 * type Result = MapKeys<{ first_name: string }, typeof camelCase>
 * // { firstName: string }
 */
export type MapKeys<T, F> = {
  [K in keyof T as K extends string ? ApplyKeyMapper<F, K> : K]: T[K]
}

/**
 * Like {@link MapKeys}, but recurses through nested objects and arrays — the
 * type-level mirror of `mapKeys(obj, fn, { recursive: true })`. Dates and other
 * non-plain leaves pass through untouched, matching the runtime's `isPlainObject`
 * check.
 *
 * @example
 * type Result = DeepMapKeys<{ user_info: { first_name: string } }, typeof camelCase>
 * // { userInfo: { firstName: string } }
 */
export type DeepMapKeys<T, F> = T extends Date
  ? T
  : T extends ReadonlyArray<infer U>
    ? Array<DeepMapKeys<U, F>>
    : T extends object
      ? { [K in keyof T as K extends string ? ApplyKeyMapper<F, K> : K]: DeepMapKeys<T[K], F> }
      : T

/**
 * The return type of a `*CaseKeys` call: {@link DeepMapKeys} when
 * `{ recursive: true }` is passed, {@link MapKeys} otherwise. Keyed on the
 * options type so the compile-time shape tracks the runtime `recursive` option.
 */
export type MapKeysReturn<T, F, Opts> = Opts extends { recursive: true }
  ? DeepMapKeys<T, F>
  : MapKeys<T, F>

// --- Test Fixtures ---

type User = {
  name: string
  age: number
  address: {
    city: string
    zip: number
    coords: {
      lat: number
      lng: number
    }
  }
}

type UserWithTags = {
  name: string
  tags: string[]
}

type NestedArrays = {
  matrix: number[][]
  users: { name: string; scores: number[] }[]
}

// --- Path<T> Tests ---

// Simple object paths
type _PathUser = Expect<
  Equals<
    Path<User>,
    | 'name'
    | 'age'
    | 'address'
    | 'address.city'
    | 'address.zip'
    | 'address.coords'
    | 'address.coords.lat'
    | 'address.coords.lng'
  >
>

// Array paths (numeric indices)
type _PathStringArray = Expect<Extends<Path<string[]>, `${number}`>>

// Object with array field
type _PathUserWithTags = Expect<Extends<Path<UserWithTags>, 'name' | 'tags' | `tags.${number}`>>

// --- PathValue<T, P> Tests ---

// Top-level properties
type _PVName = Expect<Equals<PathValue<User, 'name'>, string>>
type _PVAge = Expect<Equals<PathValue<User, 'age'>, number>>
type _PVAddress = Expect<Equals<PathValue<User, 'address'>, User['address']>>

// Nested properties
type _PVCity = Expect<Equals<PathValue<User, 'address.city'>, string>>
type _PVZip = Expect<Equals<PathValue<User, 'address.zip'>, number>>
type _PVLat = Expect<Equals<PathValue<User, 'address.coords.lat'>, number>>

// Array element access
type _PVTag0 = Expect<Equals<PathValue<string[], '0'>, string>>
type _PVTag1 = Expect<Equals<PathValue<string[], '1'>, string>>
type _PVTag99 = Expect<Equals<PathValue<string[], '99'>, string>>

// Object with array - accessing array element
type _PVUserTag = Expect<Equals<PathValue<UserWithTags, 'tags.0'>, string>>

// Nested arrays
type _PVMatrix = Expect<Equals<PathValue<NestedArrays, 'matrix.0'>, number[]>>
type _PVMatrixEl = Expect<Equals<PathValue<NestedArrays, 'matrix.0.0'>, number>>

// Array of objects
type _PVUsersName = Expect<Equals<PathValue<NestedArrays, 'users.0.name'>, string>>
type _PVUsersScores = Expect<Equals<PathValue<NestedArrays, 'users.0.scores'>, number[]>>
type _PVUsersScore = Expect<Equals<PathValue<NestedArrays, 'users.0.scores.0'>, number>>

// --- Invalid Paths (should be `never`) ---

type _InvalidPath1 = Expect<Equals<PathValue<User, 'invalid'>, never>>
type _InvalidPath2 = Expect<Equals<PathValue<User, 'address.invalid'>, never>>
type _InvalidPath3 = Expect<Equals<PathValue<User, 'name.invalid'>, never>>

// --- MapKeys Type Tests ---

type ApiResponse = {
  first_name: string
  last_name: string
  is_active: boolean
}

// MapKeys with camel transform
type _MapKeysCamel = Expect<
  Equals<
    MapKeys<ApiResponse, typeof camelCase>,
    { firstName: string; lastName: string; isActive: boolean }
  >
>

// MapKeys with pascal transform
type _MapKeysPascal = Expect<
  Equals<
    MapKeys<ApiResponse, typeof pascalCase>,
    { FirstName: string; LastName: string; IsActive: boolean }
  >
>

// MapKeys with snake transform (from camel)
type CamelInput = { firstName: string; lastName: string }
type _MapKeysSnake = Expect<
  Equals<MapKeys<CamelInput, typeof snakeCase>, { first_name: string; last_name: string }>
>

// MapKeys with kebab transform
type _MapKeysKebab = Expect<
  Equals<MapKeys<CamelInput, typeof kebabCase>, { 'first-name': string; 'last-name': string }>
>

// MapKeys with constant transform
type _MapKeysConstant = Expect<
  Equals<MapKeys<CamelInput, typeof constantCase>, { FIRST_NAME: string; LAST_NAME: string }>
>

// --- DeepMapKeys (recursive) Type Tests ---

type NestedApi = {
  user_info: { first_name: string; last_name: string }
  meta_data: {
    created_at: string
    tags: { tag_name: string }[]
  }
}

type NestedCamel = {
  userInfo: { firstName: string; lastName: string }
  metaData: {
    createdAt: string
    tags: { tagName: string }[]
  }
}

// DeepMapKeys renames keys through nested objects and arrays of objects
type _DeepCamel = Expect<Equals<DeepMapKeys<NestedApi, typeof camelCase>, NestedCamel>>

// ...and round-trips back with a snake transform
type _DeepSnake = Expect<Equals<DeepMapKeys<NestedCamel, typeof snakeCase>, NestedApi>>

// Dates and primitive leaves pass through untouched, not recursed into as objects
type WithLeaves = { created_at: Date; hit_count: number; sub: { is_ok: boolean } }
type _DeepLeaves = Expect<
  Equals<
    DeepMapKeys<WithLeaves, typeof camelCase>,
    { createdAt: Date; hitCount: number; sub: { isOk: boolean } }
  >
>

// The function return type is deep only when { recursive: true } is passed,
// and stays shallow otherwise — matching the runtime `recursive` option.
type _ReturnRecursive = Expect<
  Equals<MapKeysReturn<NestedApi, typeof camelCase, { recursive: true }>, NestedCamel>
>
type _ReturnShallow = Expect<
  Equals<
    MapKeysReturn<NestedApi, typeof camelCase, undefined>,
    MapKeys<NestedApi, typeof camelCase>
  >
>
