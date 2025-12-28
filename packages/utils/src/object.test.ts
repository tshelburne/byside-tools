import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  pick,
  omit,
  mapValues,
  mapKeys,
  camelCaseKeys,
  pascalCaseKeys,
  snakeCaseKeys,
  kebabCaseKeys,
  constantCaseKeys,
  removeUndefined,
  removeNullish,
  deepMerge,
  pluck,
  updateAt,
  keys,
  values,
  entries,
  keyBy,
} from './object.js'

describe('pick', () => {
  it('picks specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.deepStrictEqual(pick(obj, ['a', 'c']), { a: 1, c: 3 })
  })

  it('ignores non-existent keys', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(pick(obj, ['a', 'c' as keyof typeof obj]), { a: 1 })
  })

  it('handles empty keys array', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(pick(obj, []), {})
  })
})

describe('omit', () => {
  it('omits specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.deepStrictEqual(omit(obj, ['b']), { a: 1, c: 3 })
  })

  it('handles non-existent keys', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(omit(obj, ['c' as keyof typeof obj]), { a: 1, b: 2 })
  })

  it('handles empty keys array', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(omit(obj, []), { a: 1, b: 2 })
  })
})

describe('mapValues', () => {
  it('transforms all values', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.deepStrictEqual(
      mapValues(obj, (v) => v * 2),
      { a: 2, b: 4, c: 6 },
    )
  })

  it('provides key to callback', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(
      mapValues(obj, (v, k) => `${k}:${v}`),
      { a: 'a:1', b: 'b:2' },
    )
  })

  it('handles empty object', () => {
    assert.deepStrictEqual(
      mapValues({}, (v: number) => v * 2),
      {},
    )
  })
})

describe('removeUndefined', () => {
  it('removes undefined values', () => {
    const obj = { a: 1, b: undefined, c: 3 }
    assert.deepStrictEqual(removeUndefined(obj), { a: 1, c: 3 })
  })

  it('preserves null values', () => {
    const obj = { a: 1, b: null, c: undefined }
    assert.deepStrictEqual(removeUndefined(obj), { a: 1, b: null })
  })

  it('preserves falsy values', () => {
    const obj = { a: 0, b: '', c: false, d: undefined }
    assert.deepStrictEqual(removeUndefined(obj), { a: 0, b: '', c: false })
  })
})

describe('removeNullish', () => {
  it('removes null and undefined values', () => {
    const obj = { a: 1, b: null, c: undefined, d: 4 }
    assert.deepStrictEqual(removeNullish(obj), { a: 1, d: 4 })
  })

  it('preserves falsy values', () => {
    const obj = { a: 0, b: '', c: false, d: null }
    assert.deepStrictEqual(removeNullish(obj), { a: 0, b: '', c: false })
  })
})

describe('deepMerge', () => {
  it('merges flat objects', () => {
    assert.deepStrictEqual(deepMerge({ a: 1 }, { b: 2 }), { a: 1, b: 2 })
  })

  it('overwrites with source values', () => {
    assert.deepStrictEqual(deepMerge({ a: 1, b: 2 }, { b: 3 }), { a: 1, b: 3 })
  })

  it('deeply merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } }
    const source = { a: { c: 3, d: 4 } }
    assert.deepStrictEqual(deepMerge(target, source), { a: { b: 1, c: 3, d: 4 } })
  })

  it('replaces arrays instead of merging', () => {
    const target = { a: [1, 2, 3] }
    const source = { a: [4, 5] }
    assert.deepStrictEqual(deepMerge(target, source), { a: [4, 5] })
  })
})

describe('pluck', () => {
  it('gets nested value by path', () => {
    const obj = { a: { b: { c: 42 } } }
    assert.strictEqual(pluck(obj, 'a.b.c'), 42)
  })

  it('gets top-level value', () => {
    const obj = { a: 1, b: 2 }
    assert.strictEqual(pluck(obj, 'a'), 1)
  })

  it('returns undefined for missing path', () => {
    const obj = { a: { b: 1 } }
    assert.strictEqual(pluck(obj, 'a.c' as 'a.b'), undefined)
  })

  it('returns undefined for null in path', () => {
    const obj = { a: null }
    assert.strictEqual(pluck(obj, 'a.b' as 'a'), undefined)
  })
})

describe('keys', () => {
  it('returns typed keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.deepStrictEqual(keys(obj), ['a', 'b', 'c'])
  })
})

describe('values', () => {
  it('returns typed values', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.deepStrictEqual(values(obj), [1, 2, 3])
  })
})

describe('entries', () => {
  it('returns typed entries', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(entries(obj), [
      ['a', 1],
      ['b', 2],
    ])
  })
})

describe('keyBy', () => {
  it('creates object keyed by function', () => {
    const items = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ]
    assert.deepStrictEqual(
      keyBy(items, (x) => x.id),
      {
        a: { id: 'a', value: 1 },
        b: { id: 'b', value: 2 },
      },
    )
  })

  it('last item wins for duplicate keys', () => {
    const items = [
      { id: 'a', value: 1 },
      { id: 'a', value: 2 },
    ]
    assert.deepStrictEqual(
      keyBy(items, (x) => x.id),
      {
        a: { id: 'a', value: 2 },
      },
    )
  })
})

describe('updateAt', () => {
  it('updates top-level property', () => {
    const obj = { a: 1, b: 2 }
    assert.deepStrictEqual(updateAt(obj, 'a', 10), { a: 10, b: 2 })
  })

  it('updates nested property', () => {
    const obj = { user: { name: 'John', age: 30 } }
    assert.deepStrictEqual(updateAt(obj, 'user.name', 'Jane'), {
      user: { name: 'Jane', age: 30 },
    })
  })

  it('updates deeply nested property', () => {
    const obj = { a: { b: { c: { d: 1 } } } }
    assert.deepStrictEqual(updateAt(obj, 'a.b.c.d', 99), {
      a: { b: { c: { d: 99 } } },
    })
  })

  it('updates array element by index', () => {
    const arr = ['a', 'b', 'c']
    assert.deepStrictEqual(updateAt(arr, '1', 'x'), ['a', 'x', 'c'])
  })

  it('updates nested array element', () => {
    const obj = { items: ['a', 'b', 'c'] }
    assert.deepStrictEqual(updateAt(obj, 'items.1', 'x'), { items: ['a', 'x', 'c'] })
  })

  it('updates object within array', () => {
    const obj = { users: [{ name: 'John' }, { name: 'Jane' }] }
    assert.deepStrictEqual(updateAt(obj, 'users.0.name', 'Jack'), {
      users: [{ name: 'Jack' }, { name: 'Jane' }],
    })
  })

  it('returns new object (immutable)', () => {
    const original = { a: { b: 1 } }
    const result = updateAt(original, 'a.b', 2)
    assert.deepStrictEqual(original, { a: { b: 1 } })
    assert.deepStrictEqual(result, { a: { b: 2 } })
    assert.notStrictEqual(original, result)
    assert.notStrictEqual(original.a, result.a)
  })
})

describe('mapKeys', () => {
  it('transforms all keys', () => {
    const obj = { first_name: 'John', last_name: 'Doe' }
    assert.deepStrictEqual(
      mapKeys(obj, (k) => k.toUpperCase()),
      { FIRST_NAME: 'John', LAST_NAME: 'Doe' },
    )
  })

  it('handles empty object', () => {
    assert.deepStrictEqual(
      mapKeys({}, (k) => k.toUpperCase()),
      {},
    )
  })

  it('recursively transforms nested object keys', () => {
    const obj = { user_data: { first_name: 'John', address_info: { zip_code: '12345' } } }
    assert.deepStrictEqual(
      mapKeys(obj, (k) => k.toUpperCase(), { recursive: true }),
      { USER_DATA: { FIRST_NAME: 'John', ADDRESS_INFO: { ZIP_CODE: '12345' } } },
    )
  })

  it('recursively transforms keys in arrays of objects', () => {
    const obj = { users: [{ first_name: 'John' }, { first_name: 'Jane' }] }
    assert.deepStrictEqual(
      mapKeys(obj, (k) => k.toUpperCase(), { recursive: true }),
      { USERS: [{ FIRST_NAME: 'John' }, { FIRST_NAME: 'Jane' }] },
    )
  })

  it('preserves non-object array items', () => {
    const obj = { values: [1, 'two', true] }
    assert.deepStrictEqual(
      mapKeys(obj, (k) => k.toUpperCase(), { recursive: true }),
      { VALUES: [1, 'two', true] },
    )
  })

  it('does not recurse when option is false', () => {
    const obj = { user_data: { first_name: 'John' } }
    assert.deepStrictEqual(
      mapKeys(obj, (k) => k.toUpperCase()),
      {
        USER_DATA: { first_name: 'John' },
      },
    )
  })
})

describe('camelCaseKeys', () => {
  it('transforms keys to camelCase', () => {
    const obj = { first_name: 'John', last_name: 'Doe' }
    assert.deepStrictEqual(camelCaseKeys(obj), { firstName: 'John', lastName: 'Doe' })
  })

  it('handles recursive option', () => {
    const obj = { user_data: { first_name: 'John' } }
    assert.deepStrictEqual(camelCaseKeys(obj, { recursive: true }), {
      userData: { firstName: 'John' },
    })
  })
})

describe('pascalCaseKeys', () => {
  it('transforms keys to PascalCase', () => {
    const obj = { first_name: 'John' }
    assert.deepStrictEqual(pascalCaseKeys(obj), { FirstName: 'John' })
  })
})

describe('snakeCaseKeys', () => {
  it('transforms keys to snake_case', () => {
    const obj = { firstName: 'John', lastName: 'Doe' }
    assert.deepStrictEqual(snakeCaseKeys(obj), { first_name: 'John', last_name: 'Doe' })
  })
})

describe('kebabCaseKeys', () => {
  it('transforms keys to kebab-case', () => {
    const obj = { firstName: 'John' }
    assert.deepStrictEqual(kebabCaseKeys(obj), { 'first-name': 'John' })
  })
})

describe('constantCaseKeys', () => {
  it('transforms keys to CONSTANT_CASE', () => {
    const obj = { firstName: 'John' }
    assert.deepStrictEqual(constantCaseKeys(obj), { FIRST_NAME: 'John' })
  })
})

// Type-level tests are in object.types.ts and run at compile time via `pnpm typecheck`
