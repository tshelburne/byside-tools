import { useState, type ChangeEvent, type FocusEvent } from 'react'
import { replaceAt, type Path, type PathValue } from '@byside/utils'

/**
 * A standardized interface for controlled form input state.
 * Represents a value and callbacks for updating it.
 */
export interface Editable<T> {
  value: T
  onChange: (value: T) => void
  onBlur?: (value: T) => void
}

/**
 * Creates an Editable from a value and onChange handler.
 */
export function editable<T>(value: T, onChange: (value: T) => void): Editable<T> {
  return { value, onChange }
}

/**
 * Creates an Editable from a form-like object (e.g., Formik, react-hook-form).
 */
export function editableForm<T>(form: { values: T; setValues: (values: T) => void }): Editable<T> {
  return {
    value: form.values,
    onChange: (value) => form.setValues(value),
  }
}

/**
 * React hook that creates a local Editable state.
 */
export function useEditable<T>(initialValue: T): Required<Editable<T>> {
  const [value, setValue] = useState<T>(initialValue)

  return {
    value,
    onChange: (v) => setValue(v),
    onBlur: (v) => setValue(v),
  }
}

// Re-export Path types from @byside/utils for convenience
export type { Path, PathValue } from '@byside/utils'

/**
 * Drills into a nested property of an Editable, creating a new Editable
 * for that nested value with automatic parent updates.
 *
 * Supports:
 * - Object properties: handle(e, 'name')
 * - Nested paths: handle(e, 'address.city')
 * - Array indices: handle(e, '0') or handle(e, '0.name')
 *
 * @example
 * const user = useEditable({ name: 'John', address: { city: 'NYC' } })
 * const name = handle(user, 'name') // Editable<string>
 * const city = handle(user, 'address.city') // Editable<string>
 */
export function handle<T, P extends Path<T>>(
  e: Editable<T>,
  path: P,
  opts?: Omit<Partial<Editable<PathValue<T, P>>>, 'value'>,
): Required<Editable<PathValue<T, P>>> {
  const pathStr = String(path)

  if (pathStr.includes('.')) {
    const [first, ...rest] = pathStr.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstEditable = handle(e, first as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handle(firstEditable, rest.join('.') as any, opts as any) as Required<
      Editable<PathValue<T, P>>
    >
  }

  const key = pathStr as keyof T
  const isArray = Array.isArray(e.value)
  const index = isArray ? Number(pathStr) : -1

  return {
    value: (isArray ? (e.value as unknown[])[index] : e.value?.[key]) as PathValue<T, P>,

    onChange(v) {
      const updated = isArray ? replaceAt(e.value as unknown[], index, v) : { ...e.value, [key]: v }
      e.onChange(updated as T)
      opts?.onChange?.(v)
    },

    onBlur(v) {
      const updated = isArray ? replaceAt(e.value as unknown[], index, v) : { ...e.value, [key]: v }
      e.onBlur?.(updated as T)
      opts?.onBlur?.(v)
    },
  }
}

// --- HTML Element Integration ---

type InputEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/**
 * Maps between a typed value and its string representation for HTML inputs.
 */
export interface Encoder<T, U = string> {
  encode: (value: T) => U
  decode: (encoded: U) => T
}

/**
 * Common encoders for HTML input elements.
 */
export const encoders = {
  string: {
    encode: (v: string) => v,
    decode: (v: string) => v,
  } satisfies Encoder<string>,

  number: {
    encode: (v: number) => String(v),
    decode: (v: string) => Number(v),
  } satisfies Encoder<number>,

  boolean: {
    encode: (v: boolean) => String(v),
    decode: (v: string) => v === 'true',
  } satisfies Encoder<boolean>,

  date: {
    encode: (v: Date) => v.toISOString().slice(0, 10),
    decode: (v: string) => new Date(v),
  } satisfies Encoder<Date>,

  json: <T>(): Encoder<T> => ({
    encode: (v: T) => JSON.stringify(v),
    decode: (v: string) => JSON.parse(v) as T,
  }),
}

/**
 * Props compatible with HTML input/select/textarea elements.
 */
export interface HtmlInputProps {
  value: string
  onChange: (e: ChangeEvent<InputEl>) => void
  onBlur?: (e: FocusEvent<InputEl>) => void
}

/**
 * Converts an Editable<T> to HTML input props using an encoder.
 * Useful for binding typed state to native form elements.
 *
 * @example
 * const age = useEditable(25)
 * return <input type="number" {...element(age, encoders.number)} />
 */
export function element<T>(e: Editable<T>, encoder: Encoder<T>): HtmlInputProps {
  return {
    value: encoder.encode(e.value),
    onChange(evt) {
      e.onChange(encoder.decode(evt.target.value))
    },
    onBlur(evt) {
      e.onBlur?.(encoder.decode(evt.target.value))
    },
  }
}

/**
 * Shorthand for binding a string Editable directly to an input.
 * No encoding needed since the value is already a string.
 */
export function text(e: Editable<string>): HtmlInputProps {
  return element(e, encoders.string)
}
