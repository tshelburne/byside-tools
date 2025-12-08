import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  editable,
  editableForm,
  handle,
  element,
  text,
  encoders,
  type Editable,
} from './editable.js'

describe('editable', () => {
  it('creates an Editable from value and onChange', () => {
    const onChange = mock.fn()
    const e = editable('hello', onChange)

    assert.equal(e.value, 'hello')
    e.onChange('world')
    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, ['world'])
  })
})

describe('editableForm', () => {
  it('creates an Editable from a form-like object', () => {
    const setValues = mock.fn()
    const form = { values: { name: 'John' }, setValues }
    const e = editableForm(form)

    assert.deepEqual(e.value, { name: 'John' })
    e.onChange({ name: 'Jane' })
    assert.equal(setValues.mock.calls.length, 1)
    assert.deepEqual(setValues.mock.calls[0].arguments, [{ name: 'Jane' }])
  })
})

describe('handle', () => {
  it('drills into a simple property', () => {
    const onChange = mock.fn()
    const e: Editable<{ name: string; age: number }> = {
      value: { name: 'John', age: 30 },
      onChange,
    }

    const nameEditable = handle(e, 'name')
    assert.equal(nameEditable.value, 'John')

    nameEditable.onChange('Jane')
    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, [{ name: 'Jane', age: 30 }])
  })

  it('drills into nested properties with dot notation', () => {
    const onChange = mock.fn()
    const e: Editable<{ user: { profile: { name: string } } }> = {
      value: { user: { profile: { name: 'John' } } },
      onChange,
    }

    const nameEditable = handle(e, 'user.profile.name')
    assert.equal(nameEditable.value, 'John')

    nameEditable.onChange('Jane')
    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, [{ user: { profile: { name: 'Jane' } } }])
  })

  it('handles array indices', () => {
    const onChange = mock.fn()
    const e: Editable<string[]> = {
      value: ['a', 'b', 'c'],
      onChange,
    }

    const itemEditable = handle(e, '1')
    assert.equal(itemEditable.value, 'b')

    itemEditable.onChange('x')
    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, [['a', 'x', 'c']])
  })

  it('calls optional callbacks', () => {
    const onChange = mock.fn()
    const extraOnChange = mock.fn()
    const e: Editable<{ name: string }> = {
      value: { name: 'John' },
      onChange,
    }

    const nameEditable = handle(e, 'name', { onChange: extraOnChange })
    nameEditable.onChange('Jane')

    assert.equal(onChange.mock.calls.length, 1)
    assert.equal(extraOnChange.mock.calls.length, 1)
    assert.deepEqual(extraOnChange.mock.calls[0].arguments, ['Jane'])
  })
})

describe('encoders', () => {
  it('string encoder is identity', () => {
    assert.equal(encoders.string.encode('hello'), 'hello')
    assert.equal(encoders.string.decode('hello'), 'hello')
  })

  it('number encoder converts to/from string', () => {
    assert.equal(encoders.number.encode(42), '42')
    assert.equal(encoders.number.decode('42'), 42)
  })

  it('boolean encoder converts to/from string', () => {
    assert.equal(encoders.boolean.encode(true), 'true')
    assert.equal(encoders.boolean.encode(false), 'false')
    assert.equal(encoders.boolean.decode('true'), true)
    assert.equal(encoders.boolean.decode('false'), false)
  })

  it('date encoder converts to/from ISO date string', () => {
    const date = new Date('2024-01-15')
    assert.equal(encoders.date.encode(date), '2024-01-15')
    assert.deepEqual(encoders.date.decode('2024-01-15'), new Date('2024-01-15'))
  })

  it('json encoder converts to/from JSON string', () => {
    const encoder = encoders.json<{ a: number }>()
    assert.equal(encoder.encode({ a: 1 }), '{"a":1}')
    assert.deepEqual(encoder.decode('{"a":1}'), { a: 1 })
  })
})

describe('element', () => {
  it('converts Editable to HTML input props', () => {
    const onChange = mock.fn()
    const e: Editable<number> = { value: 42, onChange }

    const props = element(e, encoders.number)
    assert.equal(props.value, '42')

    // Simulate input change event
    const mockEvent = { target: { value: '100' } } as React.ChangeEvent<HTMLInputElement>
    props.onChange(mockEvent)

    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, [100])
  })
})

describe('text', () => {
  it('is shorthand for element with string encoder', () => {
    const onChange = mock.fn()
    const e: Editable<string> = { value: 'hello', onChange }

    const props = text(e)
    assert.equal(props.value, 'hello')

    const mockEvent = { target: { value: 'world' } } as React.ChangeEvent<HTMLInputElement>
    props.onChange(mockEvent)

    assert.equal(onChange.mock.calls.length, 1)
    assert.deepEqual(onChange.mock.calls[0].arguments, ['world'])
  })
})
