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

export {
  useStorage,
  useSession,
  useLocal,
  clearStorage,
  StorageProvider,
  useStorageContext,
  type StorageOptions,
  type StorageReturn,
  type StorageProviderProps,
  type KeyMapper,
} from './storage.js'
