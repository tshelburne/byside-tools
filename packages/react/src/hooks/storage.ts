import {
  createContext,
  createElement,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

/**
 * Options for storage hooks.
 */
export interface StorageOptions<T> {
  /** Initial value when key doesn't exist in storage */
  init?: T
  /** Transform value after reading from storage (e.g., for migrations) */
  onReload?: (value: T) => T
}

/**
 * Return type for storage hooks.
 */
export type StorageReturn<T> = readonly [T, (value: T) => void]

/**
 * Function to map storage keys (e.g., add namespace prefix).
 */
export type KeyMapper = (key: string) => string

const StorageContext = createContext<KeyMapper>((key) => key)

/**
 * Provider for customizing storage key mapping.
 * Useful for namespacing or environment-specific keys.
 *
 * @example
 * <StorageProvider keyMapper={(key) => `myapp:${key}`}>
 *   <App />
 * </StorageProvider>
 */
export interface StorageProviderProps {
  keyMapper: KeyMapper
  children: ReactNode
}

export function StorageProvider({ keyMapper, children }: StorageProviderProps) {
  return createElement(StorageContext.Provider, { value: keyMapper }, children)
}

/**
 * Hook to access the current storage key mapper.
 */
export function useStorageContext() {
  return useContext(StorageContext)
}

/**
 * Generic storage hook that works with any Storage API.
 * Values are JSON serialized automatically.
 *
 * @example
 * const [prefs, setPrefs] = useStorage('prefs', localStorage, { init: {} })
 */
export function useStorage<T>(
  key: string | null,
  storage: Storage,
  opts?: StorageOptions<T>,
): StorageReturn<T> {
  const { init = null as T, onReload = (v: T) => v } = opts ?? {}
  const keyMapper = useStorageContext()
  const finalKey = key ? keyMapper(key) : null
  const [value, setValue] = useState<T>(() => onReload(get()))

  useEffect(
    function resetToStored() {
      const storedValue = get()
      const reloadedValue = onReload(storedValue)
      set(reloadedValue)
    },
    [finalKey],
  )

  return [value, set] as const

  function get(): T {
    if (!finalKey) return init
    const item = storage.getItem(finalKey)
    if (item === null) return init

    try {
      return JSON.parse(item) as T
    } catch {
      return init
    }
  }

  function set(newValue: T) {
    setValue(newValue)

    if (!finalKey) return
    if (newValue === null) {
      storage.removeItem(finalKey)
      return
    }

    storage.setItem(finalKey, JSON.stringify(newValue))
  }
}

/**
 * Hook for sessionStorage (cleared when browser tab closes).
 *
 * @example
 * const [formDraft, setFormDraft] = useSession('form-draft', { init: {} })
 */
export function useSession<T>(key: string | null, opts?: StorageOptions<T>): StorageReturn<T> {
  return useStorage(key, sessionStorage, opts)
}

/**
 * Hook for localStorage (persists across sessions).
 *
 * @example
 * const [theme, setTheme] = useLocal('theme', { init: 'light' })
 */
export function useLocal<T>(key: string | null, opts?: StorageOptions<T>): StorageReturn<T> {
  return useStorage(key, localStorage, opts)
}

/**
 * Clears all storage entries matching a pattern.
 *
 * @example
 * clearStorage(localStorage, /^myapp:/) // Clear all keys starting with 'myapp:'
 */
export function clearStorage(storage: Storage, pattern: RegExp) {
  Object.keys(storage)
    .filter((key) => pattern.test(key))
    .forEach((key) => storage.removeItem(key))
}
