import { useEffect, useRef, useState } from 'react'

/**
 * Cache entry for a singleton value.
 */
interface CacheEntry<V> {
  value: V | null
  subscribers: Set<(value: V | null) => void>
  cleanup: () => void
}

/**
 * Result returned from a create function.
 * Can be void, a cleanup function, or a config object with initial value.
 */
type CreateResult<V> = void | (() => void) | { initialValue: V; cleanup?: () => void }

/**
 * Create function for global singletons (no key).
 */
type GlobalCreateFn<V> = (setValue: (value: V) => void) => CreateResult<V>

/**
 * Create function for keyed singletons.
 */
type KeyedCreateFn<K, V> = (key: K, setValue: (value: V) => void) => CreateResult<V>

const caches = new WeakMap<ImportMeta, Map<unknown, CacheEntry<unknown>>>()
const GLOBAL = Symbol('global')

/**
 * Clears all cache entries for a given module. For testing only.
 */
export function _clearSingletonCache(meta: ImportMeta): void {
  caches.delete(meta)
}

/**
 * Global singleton hook (no key parameter).
 *
 * Creates a shared value that persists across component mounts.
 * First subscriber creates the entry, last subscriber cleans it up.
 *
 * @example
 * // WebSocket connection shared across components
 * const socket = useSingleton(import.meta, (setValue) => {
 *   const ws = new WebSocket('wss://example.com')
 *   ws.onopen = () => setValue(ws)
 *   return () => ws.close()
 * })
 */
export function useSingleton<V>(meta: ImportMeta, create: GlobalCreateFn<V>): V | null

/**
 * Keyed singleton hook.
 *
 * Creates a shared value per unique key. Different keys have independent
 * lifecycles. Pass null to skip creation.
 *
 * @example
 * // Per-user data subscription
 * const userData = useSingleton(import.meta, userId, (id, setValue) => {
 *   const unsubscribe = subscribeToUser(id, setValue)
 *   return unsubscribe
 * })
 */
export function useSingleton<K, V>(
  meta: ImportMeta,
  key: K | null,
  create: KeyedCreateFn<K, V>,
): V | null

export function useSingleton<K, V>(
  meta: ImportMeta,
  keyOrCreate: K | null | GlobalCreateFn<V>,
  maybeCreate?: KeyedCreateFn<K, V>,
): V | null {
  const isGlobal = typeof keyOrCreate === 'function'
  const key = isGlobal ? GLOBAL : (keyOrCreate as K | null)
  const create = isGlobal
    ? (_k: unknown, sv: (v: V) => void) => (keyOrCreate as GlobalCreateFn<V>)(sv)
    : (maybeCreate as KeyedCreateFn<K, V>)

  const [value, setValue] = useState<V | null>(() => {
    if (key === null) return null
    const cache = caches.get(meta)
    return (cache?.get(key)?.value as V) ?? null
  })

  const createRef = useRef(create)
  createRef.current = create

  useEffect(() => {
    if (key === null) {
      setValue(null)
      return
    }

    let cache = caches.get(meta)
    if (!cache) {
      cache = new Map()
      caches.set(meta, cache)
    }

    let entry = cache.get(key) as CacheEntry<V> | undefined

    if (!entry) {
      entry = createEntry(key as K, createRef.current)
      cache.set(key, entry as CacheEntry<unknown>)
    }

    entry.subscribers.add(setValue)
    setValue(entry.value)

    return () => {
      entry!.subscribers.delete(setValue)
      if (entry!.subscribers.size === 0) {
        entry!.cleanup()
        cache!.delete(key)
      }
    }
  }, [meta, key])

  return value
}

function createEntry<K, V>(key: K, create: KeyedCreateFn<K, V>): CacheEntry<V> {
  const entry: CacheEntry<V> = {
    value: null,
    subscribers: new Set(),
    cleanup: () => {},
  }

  const result = create(key, (newValue) => {
    entry.value = newValue
    for (const subscriber of entry.subscribers) {
      subscriber(newValue)
    }
  })

  if (result !== null && typeof result === 'object' && 'initialValue' in result) {
    entry.value = result.initialValue
    entry.cleanup = result.cleanup ?? (() => {})
  } else if (typeof result === 'function') {
    entry.cleanup = result
  }

  return entry
}
