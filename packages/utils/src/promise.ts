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

/**
 * Wait for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Add a timeout to a promise. Rejects with TimeoutError if the promise doesn't resolve in time.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  attempts?: number
  /** Initial delay in ms before first retry (default: 1000) */
  delayMs?: number
  /** Multiply delay by this factor after each attempt (default: 2) */
  backoff?: number
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs?: number
  /** Only retry if this returns true for the error (default: retry all) */
  shouldRetry?: (error: Error) => boolean
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    delayMs = 1000,
    backoff = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true,
  } = options

  let lastError: Error
  let currentDelay = delayMs

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))

      if (attempt === attempts || !shouldRetry(lastError)) {
        throw lastError
      }

      await delay(currentDelay)
      currentDelay = Math.min(currentDelay * backoff, maxDelayMs)
    }
  }

  throw lastError!
}

/**
 * Create a deferred promise that can be resolved/rejected externally
 */
export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}
