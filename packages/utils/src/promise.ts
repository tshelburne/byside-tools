/**
 * Execute an array of promise-returning functions sequentially
 * @param fns - Array of functions that return promises
 * @returns Promise that resolves to array of results
 */
export async function sequence<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = []

  for (const fn of fns) {
    const result = await fn()
    results.push(result)
  }

  return results
}

/**
 * Poll until a condition returns a truthy value
 * @param fn - Function that returns the value to check (truthy = done)
 * @param timeoutMs - Maximum time to wait before rejecting
 * @param pollMs - Polling interval (default 50ms)
 * @returns Promise that resolves to the truthy value
 */
export function waitFor<T>(
  fn: () => T | null | undefined,
  timeoutMs = 10000,
  pollMs = 50,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    function poll() {
      const result = fn()
      if (result) {
        resolve(result)
        return
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`waitFor timed out after ${timeoutMs}ms`))
        return
      }

      setTimeout(poll, pollMs)
    }

    poll()
  })
}
