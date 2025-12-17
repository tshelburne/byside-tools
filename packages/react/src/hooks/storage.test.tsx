import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { Window } from 'happy-dom'
import { renderHook, act, waitFor } from '@testing-library/react'

import {
  useStorage,
  useAsyncStorage,
  StorageProvider,
  clearStorage,
  type AsyncStorage,
} from './storage.js'

// Setup DOM environment
const happyWindow = new Window()
// @ts-expect-error happy-dom Window doesn't fully match DOM Window
globalThis.window = happyWindow
// @ts-expect-error happy-dom Document doesn't fully match DOM Document
globalThis.document = happyWindow.document

function createMockStorage(): Storage {
  const storage: Storage = {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(this, key)
        ? ((this as Record<string, string>)[key] ?? null)
        : null
    },
    setItem(key: string, value: string) {
      ;(this as Record<string, string>)[key] = value
    },
    removeItem(key: string) {
      delete (this as Record<string, string>)[key]
    },
    clear() {
      for (const key of Object.keys(this)) {
        if (
          key !== 'getItem' &&
          key !== 'setItem' &&
          key !== 'removeItem' &&
          key !== 'clear' &&
          key !== 'key' &&
          key !== 'length'
        ) {
          delete (this as Record<string, string>)[key]
        }
      }
    },
    key(index: number) {
      const keys = Object.keys(this).filter(
        (k) => !['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'].includes(k),
      )
      return keys[index] ?? null
    },
    get length() {
      return Object.keys(this).filter(
        (k) => !['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'].includes(k),
      ).length
    },
  }
  return storage
}

function createMockAsyncStorage(): AsyncStorage & { store: Map<string, string> } {
  const store = new Map<string, string>()
  return {
    store,
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: async (key: string) => {
      store.delete(key)
    },
  }
}

describe('useStorage', () => {
  it('returns init value when key not in storage', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() => useStorage('test', storage, { init: 'default' }))

    assert.equal(result.current[0], 'default')
  })

  it('returns stored value when key exists', () => {
    const storage = createMockStorage()
    storage.setItem('test', JSON.stringify('stored'))

    const { result } = renderHook(() => useStorage('test', storage, { init: 'default' }))

    assert.equal(result.current[0], 'stored')
  })

  it('sets value in storage when setter is called', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() => useStorage<string>('test', storage, { init: 'default' }))

    act(() => {
      result.current[1]('new value')
    })

    assert.equal(result.current[0], 'new value')
    assert.equal(storage.getItem('test'), JSON.stringify('new value'))
  })

  it('removes from storage when set to null', () => {
    const storage = createMockStorage()
    storage.setItem('test', JSON.stringify('value'))

    const { result } = renderHook(() => useStorage<string | null>('test', storage, { init: null }))

    act(() => {
      result.current[1](null)
    })

    assert.equal(result.current[0], null)
    assert.equal(storage.getItem('test'), null)
  })

  it('applies onReload transform', () => {
    const storage = createMockStorage()
    storage.setItem('test', JSON.stringify({ version: 1, data: 'old' }))

    const { result } = renderHook(() =>
      useStorage('test', storage, {
        init: { version: 2, data: '' },
        onReload: (v) => ({ ...v, version: 2 }),
      }),
    )

    assert.deepEqual(result.current[0], { version: 2, data: 'old' })
  })

  it('returns init when JSON parse fails', () => {
    const storage = createMockStorage()
    storage.setItem('test', 'not valid json')

    const { result } = renderHook(() => useStorage('test', storage, { init: 'default' }))

    assert.equal(result.current[0], 'default')
  })

  it('uses keyMapper from StorageProvider', () => {
    const storage = createMockStorage()
    storage.setItem('prefix:test', JSON.stringify('prefixed'))

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(StorageProvider, { keyMapper: (k) => `prefix:${k}`, children })

    const { result } = renderHook(() => useStorage('test', storage, { init: 'default' }), {
      wrapper,
    })

    assert.equal(result.current[0], 'prefixed')
  })

  it('returns init when key is null', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() => useStorage(null, storage, { init: 'default' }))

    assert.equal(result.current[0], 'default')
  })
})

describe('useAsyncStorage', () => {
  it('starts with init value and isLoading true', () => {
    const storage = createMockAsyncStorage()
    const { result } = renderHook(() => useAsyncStorage('test', storage, { init: 'default' }))

    assert.equal(result.current[0], 'default')
    assert.equal(result.current[2], true)
  })

  it('loads stored value and sets isLoading false', async () => {
    const storage = createMockAsyncStorage()
    storage.store.set('test', JSON.stringify('stored'))

    const { result } = renderHook(() => useAsyncStorage('test', storage, { init: 'default' }))

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    assert.equal(result.current[0], 'stored')
  })

  it('returns init value when key not in storage', async () => {
    const storage = createMockAsyncStorage()
    const { result } = renderHook(() => useAsyncStorage('test', storage, { init: 'default' }))

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    assert.equal(result.current[0], 'default')
  })

  it('sets value in storage when setter is called', async () => {
    const storage = createMockAsyncStorage()
    const { result } = renderHook(() =>
      useAsyncStorage<string>('test', storage, { init: 'default' }),
    )

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    act(() => {
      result.current[1]('new value')
    })

    assert.equal(result.current[0], 'new value')
    assert.equal(storage.store.get('test'), JSON.stringify('new value'))
  })

  it('removes from storage when set to null', async () => {
    const storage = createMockAsyncStorage()
    storage.store.set('test', JSON.stringify('value'))

    const { result } = renderHook(() =>
      useAsyncStorage<string | null>('test', storage, { init: null }),
    )

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    act(() => {
      result.current[1](null)
    })

    assert.equal(result.current[0], null)
    assert.equal(storage.store.has('test'), false)
  })

  it('applies onReload transform', async () => {
    const storage = createMockAsyncStorage()
    storage.store.set('test', JSON.stringify({ version: 1, data: 'old' }))

    const { result } = renderHook(() =>
      useAsyncStorage('test', storage, {
        init: { version: 2, data: '' },
        onReload: (v) => ({ ...v, version: 2 }),
      }),
    )

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    assert.deepEqual(result.current[0], { version: 2, data: 'old' })
  })

  it('returns init when JSON parse fails', async () => {
    const storage = createMockAsyncStorage()
    storage.store.set('test', 'not valid json')

    const { result } = renderHook(() => useAsyncStorage('test', storage, { init: 'default' }))

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    assert.equal(result.current[0], 'default')
  })

  it('sets isLoading false immediately when key is null', async () => {
    const storage = createMockAsyncStorage()
    const { result } = renderHook(() => useAsyncStorage(null, storage, { init: 'default' }))

    await waitFor(() => {
      assert.equal(result.current[2], false)
    })

    assert.equal(result.current[0], 'default')
  })
})

describe('clearStorage', () => {
  it('clears entries matching pattern', () => {
    const storage = createMockStorage()
    storage.setItem('app:user', 'user')
    storage.setItem('app:settings', 'settings')
    storage.setItem('other:data', 'data')

    clearStorage(storage, /^app:/)

    assert.equal(storage.getItem('app:user'), null)
    assert.equal(storage.getItem('app:settings'), null)
    assert.equal(storage.getItem('other:data'), 'data')
  })
})
