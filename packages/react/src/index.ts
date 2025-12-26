// Editable - controlled form state management
export {
  editable,
  editableForm,
  useEditable,
  handle,
  element,
  text,
  encoders,
  type Editable,
  type Path,
  type PathValue,
  type Encoder,
  type HtmlInputProps,
} from './editable.js'

// Hooks - reusable React hooks
export {
  // DOM hooks
  useBodyClass,
  useCssVariable,
  useInjectStyles,
  useUrlChange,
  useDevMode,
  useWindowSize,
  useElementSize,
  // Singleton hook
  useSingleton,
  _clearSingletonCache,
  // Async callback hook
  useAsyncCallback,
  type AsyncCallbackReturn,
  // Storage hooks
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
} from './hooks/index.js'
