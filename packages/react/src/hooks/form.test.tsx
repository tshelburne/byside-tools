import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Window } from 'happy-dom'
import { keys } from '@byside/utils'
import { renderHook, act } from '@testing-library/react'
import { z } from 'zod'
import { useForm } from './form.js'

// Setup DOM environment
const happyWindow = new Window()
// @ts-expect-error happy-dom Window doesn't fully match DOM Window
globalThis.window = happyWindow
// @ts-expect-error happy-dom Document doesn't fully match DOM Document
globalThis.document = happyWindow.document

const TestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

describe('useForm', () => {
  describe('initialization', () => {
    it('initializes with provided values', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: 'John', email: 'john@example.com' } }),
      )
      assert.deepEqual(result.current.values, {
        name: 'John',
        email: 'john@example.com',
      })
    })

    it('initializes with empty errors', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      assert.deepEqual(result.current.errors, {})
    })

    it('initializes with empty touched state', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      assert.deepEqual(result.current.touched, {})
    })
  })

  describe('setFieldValue', () => {
    it('updates field value', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      act(() => result.current.setFieldValue('name', 'Jane'))
      assert.equal(result.current.values.name, 'Jane')
    })
  })

  describe('setFieldError', () => {
    it('sets a custom error', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      act(() => result.current.setFieldError('name', 'Custom error'))
      assert.equal(result.current.errors.name, 'Custom error')
    })

    it('clears error when set to null', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      act(() => result.current.setFieldError('name', 'Error'))
      act(() => result.current.setFieldError('name', null))
      assert.equal(result.current.errors.name, undefined)
    })
  })

  describe('getInputProps', () => {
    it('returns value and onChange', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: 'Test', email: '' } }))
      const props = result.current.getInputProps('name')
      assert.equal(props.value, 'Test')
      assert.equal(typeof props.onChange, 'function')
    })

    it('onChange updates the field value', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      act(() => result.current.getInputProps('name').onChange('Updated'))
      assert.equal(result.current.values.name, 'Updated')
    })

    it('includes error when present', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: '', email: '' }, schema: TestSchema }),
      )
      act(() => result.current.validate())
      const props = result.current.getInputProps('name')
      assert.equal(props.error, 'Name is required')
    })

    it('includes onBlur', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      const props = result.current.getInputProps('name')
      assert.equal(typeof props.onBlur, 'function')
    })

    it('onBlur validates field when validateInputOnBlur is true', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: '', email: 'invalid' },
          schema: TestSchema,
          validateInputOnBlur: true,
        }),
      )
      act(() => result.current.getInputProps('email').onBlur('invalid'))
      assert.equal(result.current.touched.email, true)
      assert.equal(result.current.errors.email, 'Invalid email')
    })
  })

  describe('isValid', () => {
    it('returns true when no schema provided', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      assert.equal(result.current.isValid(), true)
    })

    it('returns true when values pass schema validation', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: 'John', email: 'john@example.com' },
          schema: TestSchema,
        }),
      )
      assert.equal(result.current.isValid(), true)
    })

    it('returns false when values fail schema validation', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: '', email: 'invalid' },
          schema: TestSchema,
        }),
      )
      assert.equal(result.current.isValid(), false)
    })

    it('reflects current values after changes', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: '', email: '' }, schema: TestSchema }),
      )
      assert.equal(result.current.isValid(), false)
      act(() => {
        result.current.setFieldValue('name', 'Jane')
        result.current.setFieldValue('email', 'jane@example.com')
      })
      assert.equal(result.current.isValid(), true)
    })
  })

  describe('validate', () => {
    it('returns hasErrors false when no schema', () => {
      const { result } = renderHook(() => useForm({ initialValues: { name: '', email: '' } }))
      let validation: { hasErrors: boolean }
      act(() => {
        validation = result.current.validate()
      })
      assert.equal(validation!.hasErrors, false)
    })

    it('returns hasErrors false when valid', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: 'John', email: 'john@example.com' },
          schema: TestSchema,
        }),
      )
      let validation: { hasErrors: boolean }
      act(() => {
        validation = result.current.validate()
      })
      assert.equal(validation!.hasErrors, false)
    })

    it('returns hasErrors true when invalid', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: '', email: '' }, schema: TestSchema }),
      )
      let validation: { hasErrors: boolean }
      act(() => {
        validation = result.current.validate()
      })
      assert.equal(validation!.hasErrors, true)
    })

    it('populates errors for all invalid fields', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: '', email: 'invalid' },
          schema: TestSchema,
        }),
      )
      act(() => result.current.validate())
      assert.equal(result.current.errors.name, 'Name is required')
      assert.equal(result.current.errors.email, 'Invalid email')
    })

    it('clears errors when values become valid', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: '', email: '' }, schema: TestSchema }),
      )
      act(() => result.current.validate())
      assert.equal(result.current.errors.name, 'Name is required')

      act(() => {
        result.current.setFieldValue('name', 'John')
        result.current.setFieldValue('email', 'john@example.com')
      })
      act(() => result.current.validate())

      assert.equal(result.current.errors.name, undefined)
      assert.equal(result.current.errors.email, undefined)
    })
  })

  describe('reset', () => {
    it('resets values to initial values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: 'Initial', email: 'initial@example.com' },
        }),
      )
      act(() => result.current.setFieldValue('name', 'Changed'))
      act(() => result.current.reset())
      assert.equal(result.current.values.name, 'Initial')
    })

    it('clears all errors', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { name: '', email: '' }, schema: TestSchema }),
      )
      act(() => result.current.validate())
      assert.ok(keys(result.current.errors).length > 0)
      act(() => result.current.reset())
      assert.deepEqual(result.current.errors, {})
    })

    it('clears touched state', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: '', email: '' },
          validateInputOnBlur: true,
        }),
      )
      act(() => result.current.getInputProps('name').onBlur(''))
      assert.equal(result.current.touched.name, true)
      act(() => result.current.reset())
      assert.deepEqual(result.current.touched, {})
    })
  })

  describe('complex schemas', () => {
    it('handles optional fields', () => {
      const OptionalSchema = z.object({
        required: z.string().min(1, 'Required'),
        optional: z.string().optional(),
      })
      const { result } = renderHook(() =>
        useForm({
          initialValues: { required: 'value', optional: undefined },
          schema: OptionalSchema,
        }),
      )
      assert.equal(result.current.isValid(), true)
    })

    it('handles number fields', () => {
      const NumberSchema = z.object({ age: z.number().min(18, 'Must be 18+') })
      const { result } = renderHook(() =>
        useForm({ initialValues: { age: 10 }, schema: NumberSchema }),
      )
      assert.equal(result.current.isValid(), false)
      act(() => result.current.validate())
      assert.equal(result.current.errors.age, 'Must be 18+')
    })
  })
})
