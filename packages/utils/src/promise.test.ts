import { describe, it } from 'node:test'
import assert from 'node:assert'
import { sequence, waitFor, delay, timeout, TimeoutError, retry, deferred } from './promise.js'

describe('sequence', () => {
  it('executes promises in order', async () => {
    const order: number[] = []

    const fns = [
      async () => {
        order.push(1)
        return 'first'
      },
      async () => {
        order.push(2)
        return 'second'
      },
      async () => {
        order.push(3)
        return 'third'
      },
    ]

    const results = await sequence(fns)

    assert.deepStrictEqual(order, [1, 2, 3])
    assert.deepStrictEqual(results, ['first', 'second', 'third'])
  })

  it('handles empty array', async () => {
    const results = await sequence([])
    assert.deepStrictEqual(results, [])
  })

  it('stops on first error', async () => {
    const order: number[] = []

    const fns = [
      async () => {
        order.push(1)
        return 'first'
      },
      async () => {
        order.push(2)
        throw new Error('Second failed')
      },
      async () => {
        order.push(3)
        return 'third'
      },
    ]

    await assert.rejects(async () => {
      await sequence(fns)
    }, /Second failed/)

    assert.deepStrictEqual(order, [1, 2])
  })
})

describe('waitFor', () => {
  it('resolves immediately when condition is truthy', async () => {
    const result = await waitFor(() => 'found')
    assert.strictEqual(result, 'found')
  })

  it('resolves when condition becomes truthy', async () => {
    let value: string | null = null
    setTimeout(() => {
      value = 'appeared'
    }, 50)

    const result = await waitFor(() => value, 1000)
    assert.strictEqual(result, 'appeared')
  })

  it('rejects on timeout', async () => {
    await assert.rejects(async () => waitFor(() => null, 100), /waitFor timed out after 100ms/)
  })

  it('polls at specified interval', async () => {
    let callCount = 0
    let value: string | null = null

    setTimeout(() => {
      value = 'found'
    }, 120)

    await waitFor(
      () => {
        callCount++
        return value
      },
      500,
      50,
    )

    // Should have polled approximately 3-4 times (0ms, 50ms, 100ms, then found at ~120ms)
    assert.ok(callCount >= 3 && callCount <= 5, `Expected 3-5 calls, got ${callCount}`)
  })

  it('returns typed result', async () => {
    const result = await waitFor(() => ({ name: 'test', value: 42 }))
    assert.strictEqual(result.name, 'test')
    assert.strictEqual(result.value, 42)
  })
})

describe('delay', () => {
  it('resolves after specified time', async () => {
    const start = Date.now()
    await delay(50)
    const elapsed = Date.now() - start
    assert.ok(elapsed >= 45 && elapsed < 100, `Expected ~50ms, got ${elapsed}ms`)
  })

  it('resolves with undefined', async () => {
    const result = await delay(10)
    assert.strictEqual(result, undefined)
  })
})

describe('timeout', () => {
  it('resolves if promise completes in time', async () => {
    const result = await timeout(Promise.resolve(42), 100)
    assert.strictEqual(result, 42)
  })

  it('rejects with TimeoutError if promise is too slow', async () => {
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve(42), 200))
    await assert.rejects(async () => timeout(slowPromise, 50), TimeoutError)
  })

  it('passes through promise rejection', async () => {
    const failingPromise = Promise.reject(new Error('original error'))
    await assert.rejects(async () => timeout(failingPromise, 100), /original error/)
  })
})

describe('retry', () => {
  it('succeeds on first try', async () => {
    let attempts = 0
    const result = await retry(async () => {
      attempts++
      return 'success'
    })
    assert.strictEqual(result, 'success')
    assert.strictEqual(attempts, 1)
  })

  it('retries on failure', async () => {
    let attempts = 0
    const result = await retry(
      async () => {
        attempts++
        if (attempts < 3) throw new Error('not yet')
        return 'success'
      },
      { attempts: 3, delayMs: 10 },
    )
    assert.strictEqual(result, 'success')
    assert.strictEqual(attempts, 3)
  })

  it('throws after max attempts', async () => {
    let attempts = 0
    await assert.rejects(
      async () =>
        retry(
          async () => {
            attempts++
            throw new Error('always fails')
          },
          { attempts: 3, delayMs: 10 },
        ),
      /always fails/,
    )
    assert.strictEqual(attempts, 3)
  })

  it('respects shouldRetry predicate', async () => {
    let attempts = 0
    await assert.rejects(
      async () =>
        retry(
          async () => {
            attempts++
            throw new Error('fatal')
          },
          {
            attempts: 5,
            delayMs: 10,
            shouldRetry: (e) => !e.message.includes('fatal'),
          },
        ),
      /fatal/,
    )
    assert.strictEqual(attempts, 1)
  })
})

describe('deferred', () => {
  it('creates a promise that can be resolved externally', async () => {
    const d = deferred<number>()
    setTimeout(() => d.resolve(42), 10)
    const result = await d.promise
    assert.strictEqual(result, 42)
  })

  it('creates a promise that can be rejected externally', async () => {
    const d = deferred<number>()
    setTimeout(() => d.reject(new Error('oops')), 10)
    await assert.rejects(async () => d.promise, /oops/)
  })
})
