import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { renderHook, act } from '@testing-library/react'
import { useAsyncCallback } from './async.js'

// Setup DOM environment
const happyWindow = new Window()
// @ts-expect-error happy-dom Window doesn't fully match DOM Window
globalThis.window = happyWindow
// @ts-expect-error happy-dom Document doesn't fully match DOM Document
globalThis.document = happyWindow.document

describe('useAsyncCallback', () => {
  it('starts with loading false and no error', () => {
    const { result } = renderHook(() => useAsyncCallback(async () => 'result'))

    assert.strictEqual(result.current.loading, false)
    assert.strictEqual(result.current.error, null)
  })

  it('sets loading to true during execution', async () => {
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => {
      resolve = r
    })

    const { result } = renderHook(() => useAsyncCallback(async () => promise))

    act(() => {
      result.current.onCall()
    })

    assert.strictEqual(result.current.loading, true)

    await act(async () => {
      resolve!('done')
      await promise
    })

    assert.strictEqual(result.current.loading, false)
  })

  it('returns the result from the async function', async () => {
    const { result } = renderHook(() => useAsyncCallback(async () => 'hello'))

    let returnValue: string | undefined
    await act(async () => {
      returnValue = await result.current.onCall()
    })

    assert.strictEqual(returnValue, 'hello')
  })

  it('captures errors and sets error state', async () => {
    const { result } = renderHook(() =>
      useAsyncCallback(async () => {
        throw new Error('Something went wrong')
      }),
    )

    await act(async () => {
      await result.current.onCall()
    })

    assert.strictEqual(result.current.loading, false)
    assert.ok(result.current.error instanceof Error)
    assert.strictEqual(result.current.error?.message, 'Something went wrong')
  })

  it('converts non-Error throws to Error', async () => {
    const { result } = renderHook(() =>
      useAsyncCallback(async () => {
        throw 'string error'
      }),
    )

    await act(async () => {
      await result.current.onCall()
    })

    assert.ok(result.current.error instanceof Error)
    assert.strictEqual(result.current.error?.message, 'string error')
  })

  it('clears error on next call', async () => {
    let shouldFail = true
    const { result } = renderHook(() =>
      useAsyncCallback(async () => {
        if (shouldFail) throw new Error('Failed')
        return 'success'
      }),
    )

    await act(async () => {
      await result.current.onCall()
    })

    assert.ok(result.current.error !== null)

    shouldFail = false
    await act(async () => {
      await result.current.onCall()
    })

    assert.strictEqual(result.current.error, null)
  })

  it('returns undefined when error occurs', async () => {
    const { result } = renderHook(() =>
      useAsyncCallback(async () => {
        throw new Error('Failed')
      }),
    )

    let returnValue: unknown = 'not-undefined'
    await act(async () => {
      returnValue = await result.current.onCall()
    })

    assert.strictEqual(returnValue, undefined)
  })

  it('passes arguments to the async function', async () => {
    const fn = mock.fn(async (a: number, b: string) => `${a}-${b}`)

    const { result } = renderHook(() => useAsyncCallback(fn))

    let returnValue: string | undefined
    await act(async () => {
      returnValue = await result.current.onCall(42, 'test')
    })

    assert.strictEqual(returnValue, '42-test')
    assert.strictEqual(fn.mock.callCount(), 1)
    assert.deepStrictEqual(fn.mock.calls[0]?.arguments, [42, 'test'])
  })

  it('maintains stable onCall reference across renders', () => {
    const { result, rerender } = renderHook(() => useAsyncCallback(async () => 'result'))

    const firstOnCall = result.current.onCall

    rerender()

    assert.strictEqual(result.current.onCall, firstOnCall)
  })

  it('uses latest function reference', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useAsyncCallback(async () => value))

    value = 'second'
    rerender()

    let returnValue: string | undefined
    await act(async () => {
      returnValue = await result.current.onCall()
    })

    assert.strictEqual(returnValue, 'second')
  })
})
