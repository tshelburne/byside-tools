import { handle, type Editable, type Path, type PathValue } from '../editable.js'
import { keys } from '@byside/utils'
import { useState, useCallback, useRef } from 'react'
import type { ZodType } from 'zod'

/**
 * Form validation hook inspired by Mantine's useForm, adapted to work with both React web and React Native.
 *
 * This hook provides form state management, Zod schema validation, and integrates seamlessly
 * with the Editable pattern from @byside/react. Unlike Mantine's useForm (which is web-only),
 * this version works cross-platform.
 *
 * @example
 * ```tsx
 * import { useForm } from '@byside/react'
 * import { z } from 'zod'
 *
 * const schema = z.object({
 *   email: z.string().email('Invalid email'),
 *   password: z.string().min(8, 'Must be at least 8 characters')
 * })
 *
 * function LoginForm() {
 *   const form = useForm({
 *     initialValues: { email: '', password: '' },
 *     schema,
 *     validateInputOnBlur: true
 *   })
 *
 *   const onSubmit = () => {
 *     const validation = form.validate()
 *     if (!validation.hasErrors) {
 *       // Submit form.values
 *     }
 *   }
 *
 *   return (
 *     <form>
 *       <input {...form.getInputProps('email')} />
 *       {form.errors.email && <span>{form.errors.email}</span>}
 *
 *       <input {...form.getInputProps('password')} type="password" />
 *       {form.errors.password && <span>{form.errors.password}</span>}
 *
 *       <button onClick={onSubmit}>Submit</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @remarks
 * This is a React Native-compatible port of Mantine's useForm hook. Key differences:
 * - Uses @byside/react's Editable pattern instead of Mantine's input components
 * - Works with both React web and React Native
 * - Simpler API focused on Zod validation
 * - Uses typed utilities from @byside/utils for better type safety
 *
 * @see https://mantine.dev/form/use-form/ - Original Mantine useForm documentation
 */

type FormErrors<T> = Partial<Record<keyof T, string>>

export interface UseFormOptions<T extends Record<string, unknown>> {
  /** Initial form values */
  initialValues: T
  /** Optional Zod schema for validation */
  schema?: ZodType<T>
  /** Whether to validate fields on blur (default: false) */
  validateInputOnBlur?: boolean
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  /** Current form values */
  values: T
  /** Current field errors */
  errors: FormErrors<T>
  /** Tracks which fields have been touched */
  touched: Partial<Record<keyof T, boolean>>
  /** Check if all form values are valid according to schema */
  isValid: () => boolean
  /** Validate all fields and populate errors. Returns whether there are errors. */
  validate: () => { hasErrors: boolean }
  /** Get props for an input field (value, onChange, onBlur, error) */
  getInputProps: <K extends keyof T & string>(
    field: K,
  ) => Required<Editable<T[K]>> & { error?: string }
  /** Programmatically set a field value */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  /** Programmatically set a field error */
  setFieldError: (field: keyof T, error: string | null) => void
  /** Reset form to initial values and clear all errors/touched state */
  reset: () => void
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const { initialValues, schema, validateInputOnBlur = false } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  // Use ref to access latest values in callbacks without stale closures
  const valuesRef = useRef(values)
  valuesRef.current = values

  const touchedRef = useRef(touched)
  touchedRef.current = touched

  const validateField = (field: keyof T, value: unknown): string | null => {
    if (!schema) return null
    const testValues = { ...valuesRef.current, [field]: value }
    const result = schema.safeParse(testValues)
    if (result.success) return null
    const fieldError = result.error.issues.find((e) => e.path[0] === field)
    return fieldError?.message ?? null
  }

  // These are intentionally not fully memoized - they use refs for fresh values
  const isValidMemo = useCallback(isValid, [schema])
  const validateMemo = useCallback(validate, [schema])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setFieldValueMemo = useCallback(setFieldValue, [schema])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setFieldErrorMemo = useCallback(setFieldError, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getInputPropsMemo = useCallback(getInputProps, [
    values,
    errors,
    validateInputOnBlur,
    schema,
  ])
  const resetMemo = useCallback(reset, [initialValues])

  return {
    values,
    errors,
    touched,
    isValid: isValidMemo,
    validate: validateMemo,
    getInputProps: getInputPropsMemo,
    setFieldValue: setFieldValueMemo,
    setFieldError: setFieldErrorMemo,
    reset: resetMemo,
  }

  function isValid(): boolean {
    if (!schema) return true
    return schema.safeParse(valuesRef.current).success
  }

  function validate(): { hasErrors: boolean } {
    if (!schema) {
      setErrors({})
      return { hasErrors: false }
    }
    const result = schema.safeParse(valuesRef.current)
    if (result.success) {
      setErrors({})
      return { hasErrors: false }
    }
    const newErrors: FormErrors<T> = {}
    for (const error of result.error.issues) {
      const field = error.path[0] as keyof T
      if (!newErrors[field]) {
        newErrors[field] = error.message
      }
    }
    setErrors(newErrors)
    return { hasErrors: keys(newErrors).length > 0 }
  }

  function updateError(field: keyof T, error: string | null) {
    setErrors((prev) => {
      if (error) return { ...prev, [field]: error }
      const { [field]: _, ...rest } = prev
      return rest as FormErrors<T>
    })
  }

  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (touchedRef.current[field] && schema) {
      const error = validateField(field, value)
      updateError(field, error)
    }
  }

  function setFieldError(field: keyof T, error: string | null) {
    updateError(field, error)
  }

  function getInputProps<K extends keyof T & string>(
    field: K,
  ): Required<Editable<T[K]>> & { error?: string } {
    const editable: Editable<T> = {
      value: values,
      onChange: (v) => setValues(v),
      onBlur: (v) => setValues(v),
    }
    const fieldEditable = handle(editable, field as unknown as Path<T>)

    return {
      value: fieldEditable.value as T[K],

      onChange: (value: T[K]) => {
        fieldEditable.onChange(value as PathValue<T, Path<T>>)
        if (touchedRef.current[field] && schema) {
          const error = validateField(field, value)
          updateError(field, error)
        }
      },

      onBlur:
        validateInputOnBlur ?
          (value: T[K]) => {
            fieldEditable.onBlur(value as PathValue<T, Path<T>>)
            setTouched((prev) => ({ ...prev, [field]: true }))
            if (schema) {
              const error = validateField(field, value)
              if (error) {
                setErrors((prev) => ({ ...prev, [field]: error }))
              }
            }
          }
        : (value: T[K]) => {
            fieldEditable.onBlur(value as PathValue<T, Path<T>>)
          },

      error: errors[field],
    }
  }

  function reset() {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }
}
