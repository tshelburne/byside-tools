/**
 * A discriminated union representing either success (Ok) or failure (Err).
 * Makes failure explicit in the type system.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>

export interface Ok<T> {
  readonly ok: true
  readonly value: T
}

export interface Err<E> {
  readonly ok: false
  readonly error: E
}

/**
 * Create a success result
 */
export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

/**
 * Create a failure result
 */
export function Err<E>(error: E): Err<E> {
  return { ok: false, error }
}

/**
 * Wrap a synchronous function that might throw into a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn())
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Wrap an async function or promise that might reject into a Result
 */
export async function tryCatchAsync<T>(
  fn: (() => Promise<T>) | Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const result = typeof fn === 'function' ? await fn() : await fn
    return Ok(result)
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok
}

/**
 * Unwrap a Result, returning the value or a fallback
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}
