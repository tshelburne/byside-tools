import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Ok, Err, tryCatch, tryCatchAsync, isOk, isErr, unwrapOr } from './result.js'

describe('Result', () => {
  describe('Ok', () => {
    it('creates a success result', () => {
      const result = Ok(42)
      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.value, 42)
    })
  })

  describe('Err', () => {
    it('creates a failure result', () => {
      const error = new Error('oops')
      const result = Err(error)
      assert.strictEqual(result.ok, false)
      assert.strictEqual(result.error, error)
    })
  })

  describe('tryCatch', () => {
    it('returns Ok when function succeeds', () => {
      const result = tryCatch(() => 42)
      assert.strictEqual(result.ok, true)
      if (result.ok) assert.strictEqual(result.value, 42)
    })

    it('returns Err when function throws', () => {
      const result = tryCatch(() => {
        throw new Error('oops')
      })
      assert.strictEqual(result.ok, false)
      if (!result.ok) assert.strictEqual(result.error.message, 'oops')
    })

    it('wraps non-Error throws in Error', () => {
      const result = tryCatch(() => {
        throw 'string error'
      })
      assert.strictEqual(result.ok, false)
      if (!result.ok) assert.strictEqual(result.error.message, 'string error')
    })
  })

  describe('tryCatchAsync', () => {
    it('returns Ok when promise resolves', async () => {
      const result = await tryCatchAsync(Promise.resolve(42))
      assert.strictEqual(result.ok, true)
      if (result.ok) assert.strictEqual(result.value, 42)
    })

    it('returns Ok when async function succeeds', async () => {
      const result = await tryCatchAsync(async () => 42)
      assert.strictEqual(result.ok, true)
      if (result.ok) assert.strictEqual(result.value, 42)
    })

    it('returns Err when promise rejects', async () => {
      const result = await tryCatchAsync(Promise.reject(new Error('oops')))
      assert.strictEqual(result.ok, false)
      if (!result.ok) assert.strictEqual(result.error.message, 'oops')
    })

    it('returns Err when async function throws', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('oops')
      })
      assert.strictEqual(result.ok, false)
      if (!result.ok) assert.strictEqual(result.error.message, 'oops')
    })
  })

  describe('isOk', () => {
    it('returns true for Ok', () => {
      assert.strictEqual(isOk(Ok(42)), true)
    })

    it('returns false for Err', () => {
      assert.strictEqual(isOk(Err(new Error('oops'))), false)
    })
  })

  describe('isErr', () => {
    it('returns true for Err', () => {
      assert.strictEqual(isErr(Err(new Error('oops'))), true)
    })

    it('returns false for Ok', () => {
      assert.strictEqual(isErr(Ok(42)), false)
    })
  })

  describe('unwrapOr', () => {
    it('returns value for Ok', () => {
      assert.strictEqual(unwrapOr(Ok(42), 0), 42)
    })

    it('returns fallback for Err', () => {
      assert.strictEqual(unwrapOr(Err(new Error('oops')), 0), 0)
    })
  })
})
