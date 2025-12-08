import { test } from 'node:test'
import assert from 'node:assert'
import { compact } from './array.js'

test('compact removes null values', () => {
  const result = compact([1, null, 2, null, 3])
  assert.deepStrictEqual(result, [1, 2, 3])
})

test('compact removes undefined values', () => {
  const result = compact([1, undefined, 2, undefined, 3])
  assert.deepStrictEqual(result, [1, 2, 3])
})

test('compact removes both null and undefined', () => {
  const result = compact([null, 1, undefined, 2, null, undefined])
  assert.deepStrictEqual(result, [1, 2])
})

test('compact returns empty array for all nullish values', () => {
  const result = compact([null, undefined, null])
  assert.deepStrictEqual(result, [])
})

test('compact preserves falsy non-nullish values', () => {
  const result = compact([0, '', false, null, undefined])
  assert.deepStrictEqual(result, [0, '', false])
})
