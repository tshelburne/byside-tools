import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  isNullish,
  exists,
  isEmpty,
  isNonEmptyString,
  isNonEmptyArray,
  isPlainObject,
  isFunction,
  isPromise,
  assertExists,
  exhaustive,
} from './guards.js'

describe('isNullish', () => {
  it('returns true for null', () => {
    assert.strictEqual(isNullish(null), true)
  })

  it('returns true for undefined', () => {
    assert.strictEqual(isNullish(undefined), true)
  })

  it('returns false for falsy values', () => {
    assert.strictEqual(isNullish(0), false)
    assert.strictEqual(isNullish(''), false)
    assert.strictEqual(isNullish(false), false)
  })

  it('returns false for truthy values', () => {
    assert.strictEqual(isNullish(1), false)
    assert.strictEqual(isNullish('hello'), false)
    assert.strictEqual(isNullish({}), false)
  })
})

describe('exists', () => {
  it('returns false for null', () => {
    assert.strictEqual(exists(null), false)
  })

  it('returns false for undefined', () => {
    assert.strictEqual(exists(undefined), false)
  })

  it('returns true for falsy values', () => {
    assert.strictEqual(exists(0), true)
    assert.strictEqual(exists(''), true)
    assert.strictEqual(exists(false), true)
  })

  it('returns true for truthy values', () => {
    assert.strictEqual(exists(1), true)
    assert.strictEqual(exists('hello'), true)
    assert.strictEqual(exists({}), true)
  })
})

describe('isEmpty', () => {
  it('returns true for null', () => {
    assert.strictEqual(isEmpty(null), true)
  })

  it('returns true for undefined', () => {
    assert.strictEqual(isEmpty(undefined), true)
  })

  it('returns true for empty string', () => {
    assert.strictEqual(isEmpty(''), true)
  })

  it('returns false for non-empty string', () => {
    assert.strictEqual(isEmpty('hello'), false)
  })

  it('returns true for empty array', () => {
    assert.strictEqual(isEmpty([]), true)
  })

  it('returns false for non-empty array', () => {
    assert.strictEqual(isEmpty([1]), false)
  })

  it('returns true for empty object', () => {
    assert.strictEqual(isEmpty({}), true)
  })

  it('returns false for non-empty object', () => {
    assert.strictEqual(isEmpty({ a: 1 }), false)
  })

  it('returns false for numbers', () => {
    assert.strictEqual(isEmpty(0), false)
    assert.strictEqual(isEmpty(42), false)
  })
})

describe('isNonEmptyString', () => {
  it('returns false for empty string', () => {
    assert.strictEqual(isNonEmptyString(''), false)
  })

  it('returns true for non-empty string', () => {
    assert.strictEqual(isNonEmptyString('hello'), true)
  })

  it('returns false for non-strings', () => {
    assert.strictEqual(isNonEmptyString(null), false)
    assert.strictEqual(isNonEmptyString(123), false)
    assert.strictEqual(isNonEmptyString([]), false)
  })
})

describe('isNonEmptyArray', () => {
  it('returns false for empty array', () => {
    assert.strictEqual(isNonEmptyArray([]), false)
  })

  it('returns true for non-empty array', () => {
    assert.strictEqual(isNonEmptyArray([1]), true)
    assert.strictEqual(isNonEmptyArray([1, 2, 3]), true)
  })

  it('returns false for null/undefined', () => {
    assert.strictEqual(isNonEmptyArray(null), false)
    assert.strictEqual(isNonEmptyArray(undefined), false)
  })
})

describe('isPlainObject', () => {
  it('returns true for plain objects', () => {
    assert.strictEqual(isPlainObject({}), true)
    assert.strictEqual(isPlainObject({ a: 1 }), true)
  })

  it('returns false for arrays', () => {
    assert.strictEqual(isPlainObject([]), false)
    assert.strictEqual(isPlainObject([1, 2]), false)
  })

  it('returns false for null', () => {
    assert.strictEqual(isPlainObject(null), false)
  })

  it('returns false for class instances', () => {
    assert.strictEqual(isPlainObject(new Date()), false)
    assert.strictEqual(isPlainObject(new Map()), false)
  })
})

describe('isFunction', () => {
  it('returns true for functions', () => {
    assert.strictEqual(
      isFunction(() => {}),
      true,
    )
    assert.strictEqual(
      isFunction(function () {}),
      true,
    )
  })

  it('returns false for non-functions', () => {
    assert.strictEqual(isFunction('hello'), false)
    assert.strictEqual(isFunction({}), false)
    assert.strictEqual(isFunction(null), false)
  })
})

describe('isPromise', () => {
  it('returns true for promises', () => {
    assert.strictEqual(isPromise(Promise.resolve()), true)
    assert.strictEqual(isPromise(new Promise(() => {})), true)
  })

  it('returns true for promise-like objects', () => {
    assert.strictEqual(isPromise({ then: () => {} }), true)
  })

  it('returns false for non-promises', () => {
    assert.strictEqual(isPromise({}), false)
    assert.strictEqual(isPromise(null), false)
    assert.strictEqual(
      isPromise(() => {}),
      false,
    )
  })
})

describe('assertExists', () => {
  it('does not throw for existing values', () => {
    assert.doesNotThrow(() => assertExists(1))
    assert.doesNotThrow(() => assertExists('hello'))
    assert.doesNotThrow(() => assertExists(0))
    assert.doesNotThrow(() => assertExists(''))
  })

  it('throws for null', () => {
    assert.throws(() => assertExists(null), /Expected value to exist/)
  })

  it('throws for undefined', () => {
    assert.throws(() => assertExists(undefined), /Expected value to exist/)
  })

  it('throws with custom message', () => {
    assert.throws(() => assertExists(null, 'Custom message'), /Custom message/)
  })
})

describe('exhaustive', () => {
  it('throws when called', () => {
    assert.throws(() => exhaustive('unexpected' as never), /Unhandled case/)
  })

  it('throws with custom message', () => {
    assert.throws(() => exhaustive('test' as never, 'Custom error'), /Custom error/)
  })
})
