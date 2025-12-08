/**
 * Type-level tests for Path and PathValue types.
 * These tests run at compile time - if this file compiles, the types are correct.
 */

import type { Path, PathValue } from './object.js'
import type { Equals, Expect, Extends } from './test.js'

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

// --- Export to make this a module ---
export {}
