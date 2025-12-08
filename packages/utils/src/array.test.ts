import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  compact,
  range,
  chunk,
  unique,
  uniqueBy,
  groupBy,
  partition,
  zip,
  difference,
  intersect,
} from './array.js'

describe('compact', () => {
  it('removes null values', () => {
    const result = compact([1, null, 2, null, 3])
    assert.deepStrictEqual(result, [1, 2, 3])
  })

  it('removes undefined values', () => {
    const result = compact([1, undefined, 2, undefined, 3])
    assert.deepStrictEqual(result, [1, 2, 3])
  })

  it('removes both null and undefined', () => {
    const result = compact([null, 1, undefined, 2, null, undefined])
    assert.deepStrictEqual(result, [1, 2])
  })

  it('returns empty array for all nullish values', () => {
    const result = compact([null, undefined, null])
    assert.deepStrictEqual(result, [])
  })

  it('preserves falsy non-nullish values', () => {
    const result = compact([0, '', false, null, undefined])
    assert.deepStrictEqual(result, [0, '', false])
  })
})

describe('range', () => {
  it('creates range from start to end', () => {
    assert.deepStrictEqual(range(0, 5), [0, 1, 2, 3, 4])
  })

  it('creates range with non-zero start', () => {
    assert.deepStrictEqual(range(3, 7), [3, 4, 5, 6])
  })

  it('returns empty array when start >= end', () => {
    assert.deepStrictEqual(range(5, 5), [])
    assert.deepStrictEqual(range(5, 3), [])
  })

  it('handles negative numbers', () => {
    assert.deepStrictEqual(range(-2, 2), [-2, -1, 0, 1])
  })
})

describe('chunk', () => {
  it('splits array into chunks of specified size', () => {
    assert.deepStrictEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  })

  it('handles exact divisions', () => {
    assert.deepStrictEqual(chunk([1, 2, 3, 4], 2), [
      [1, 2],
      [3, 4],
    ])
  })

  it('handles size larger than array', () => {
    assert.deepStrictEqual(chunk([1, 2], 5), [[1, 2]])
  })

  it('returns empty array for size <= 0', () => {
    assert.deepStrictEqual(chunk([1, 2, 3], 0), [])
    assert.deepStrictEqual(chunk([1, 2, 3], -1), [])
  })

  it('handles empty array', () => {
    assert.deepStrictEqual(chunk([], 3), [])
  })
})

describe('unique', () => {
  it('removes duplicate values', () => {
    assert.deepStrictEqual(unique([1, 2, 2, 3, 1, 4]), [1, 2, 3, 4])
  })

  it('handles empty array', () => {
    assert.deepStrictEqual(unique([]), [])
  })

  it('handles strings', () => {
    assert.deepStrictEqual(unique(['a', 'b', 'a', 'c']), ['a', 'b', 'c'])
  })
})

describe('uniqueBy', () => {
  it('removes duplicates by key function', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ]
    const result = uniqueBy(items, (x) => x.id)
    assert.deepStrictEqual(result, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })

  it('keeps first occurrence', () => {
    const result = uniqueBy([1.1, 1.9, 2.1, 2.9], Math.floor)
    assert.deepStrictEqual(result, [1.1, 2.1])
  })
})

describe('groupBy', () => {
  it('groups items by key function', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ]
    const result = groupBy(items, (x) => x.type)
    assert.deepStrictEqual(result, {
      a: [
        { type: 'a', value: 1 },
        { type: 'a', value: 3 },
      ],
      b: [{ type: 'b', value: 2 }],
    })
  })

  it('handles empty array', () => {
    assert.deepStrictEqual(
      groupBy([], (x: number) => x),
      {},
    )
  })
})

describe('partition', () => {
  it('splits array by predicate', () => {
    const [evens, odds] = partition([1, 2, 3, 4, 5], (x) => x % 2 === 0)
    assert.deepStrictEqual(evens, [2, 4])
    assert.deepStrictEqual(odds, [1, 3, 5])
  })

  it('handles all passing predicate', () => {
    const [pass, fail] = partition([2, 4, 6], (x) => x % 2 === 0)
    assert.deepStrictEqual(pass, [2, 4, 6])
    assert.deepStrictEqual(fail, [])
  })

  it('handles none passing predicate', () => {
    const [pass, fail] = partition([1, 3, 5], (x) => x % 2 === 0)
    assert.deepStrictEqual(pass, [])
    assert.deepStrictEqual(fail, [1, 3, 5])
  })
})

describe('zip', () => {
  it('combines arrays element-wise', () => {
    assert.deepStrictEqual(zip([1, 2, 3], ['a', 'b', 'c']), [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ])
  })

  it('stops at shorter array', () => {
    assert.deepStrictEqual(zip([1, 2], ['a', 'b', 'c']), [
      [1, 'a'],
      [2, 'b'],
    ])
  })

  it('handles empty arrays', () => {
    assert.deepStrictEqual(zip([], [1, 2]), [])
    assert.deepStrictEqual(zip([1, 2], []), [])
  })
})

describe('difference', () => {
  it('returns items in first but not second', () => {
    assert.deepStrictEqual(difference([1, 2, 3, 4], [2, 4]), [1, 3])
  })

  it('handles no overlap', () => {
    assert.deepStrictEqual(difference([1, 2], [3, 4]), [1, 2])
  })

  it('handles complete overlap', () => {
    assert.deepStrictEqual(difference([1, 2], [1, 2, 3]), [])
  })
})

describe('intersect', () => {
  it('returns items in both arrays', () => {
    assert.deepStrictEqual(intersect([1, 2, 3, 4], [2, 4, 6]), [2, 4])
  })

  it('handles no overlap', () => {
    assert.deepStrictEqual(intersect([1, 2], [3, 4]), [])
  })

  it('handles complete overlap', () => {
    assert.deepStrictEqual(intersect([1, 2], [1, 2]), [1, 2])
  })
})
