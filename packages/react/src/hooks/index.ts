export {
  useBodyClass,
  useCssVariable,
  useInjectStyles,
  useUrlChange,
  useDevMode,
  useWindowSize,
  useElementSize,
} from './dom.js'

export { useSingleton, _clearSingletonCache } from './singleton.js'

export { useAsyncCallback, type AsyncCallbackReturn } from './async.js'

export {
  useStorage,
  useSession,
  useLocal,
  useAsyncStorage,
  clearStorage,
  StorageProvider,
  useStorageContext,
  type StorageOptions,
  type StorageReturn,
  type StorageProviderProps,
  type KeyMapper,
  type AsyncStorage,
  type AsyncStorageReturn,
} from './storage.js'
