import { useCallback, useRef, useState } from 'react'

/**
 * Return type for useAsyncCallback hook.
 */
export interface AsyncCallbackReturn<T, A extends unknown[]> {
  /** Whether the async operation is currently running */
  loading: boolean
  /** Error from the last failed execution, cleared on next call */
  error: Error | null
  /** The callback to invoke the async operation */
  onCall: (...args: A) => Promise<T | undefined>
}

/**
 * Wraps an async function with loading and error state management.
 *
 * Automatically tracks loading state and captures errors. Error state is
 * cleared when the callback is invoked again.
 *
 * @example
 * // Basic usage
 * const { loading, error, onCall } = useAsyncCallback(async () => {
 *   await api.saveData(form.values)
 * })
 *
 * return (
 *   <form onSubmit={onCall}>
 *     {error && <p>{error.message}</p>}
 *     <button disabled={loading}>
 *       {loading ? 'Saving...' : 'Save'}
 *     </button>
 *   </form>
 * )
 *
 * @example
 * // With arguments
 * const { loading, error, onCall } = useAsyncCallback(async (id: string) => {
 *   return await api.fetchItem(id)
 * })
 *
 * const item = await onCall('123')
 */
export function useAsyncCallback<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): AsyncCallbackReturn<T, A> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const onCall = useCallback(async (...args: A): Promise<T | undefined> => {
    setLoading(true)
    setError(null)
    try {
      return await fnRef.current(...args)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, onCall }
}
