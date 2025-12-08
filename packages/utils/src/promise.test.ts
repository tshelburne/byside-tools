import { test } from 'node:test'
import assert from 'node:assert'
import { sequence, waitFor } from './promise.js'

test('sequence executes promises in order', async () => {
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

test('sequence handles empty array', async () => {
  const results = await sequence([])
  assert.deepStrictEqual(results, [])
})

test('sequence stops on first error', async () => {
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

test('waitFor resolves immediately when condition is truthy', async () => {
  const result = await waitFor(() => 'found')
  assert.strictEqual(result, 'found')
})

test('waitFor resolves when condition becomes truthy', async () => {
  let value: string | null = null
  setTimeout(() => {
    value = 'appeared'
  }, 50)

  const result = await waitFor(() => value, 1000)
  assert.strictEqual(result, 'appeared')
})

test('waitFor rejects on timeout', async () => {
  await assert.rejects(async () => waitFor(() => null, 100), /waitFor timed out after 100ms/)
})

test('waitFor polls at specified interval', async () => {
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

test('waitFor returns typed result', async () => {
  const result = await waitFor(() => ({ name: 'test', value: 42 }))
  assert.strictEqual(result.name, 'test')
  assert.strictEqual(result.value, 42)
})
