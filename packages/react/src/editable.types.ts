/**
 * Type-level tests for Editable types.
 * These tests run at compile time - if this file compiles, the types are correct.
 */

import type { Editable, Path, PathValue } from './editable.js'
import type { Equals, Expect } from '@byside/utils/test'
import { handle, useEditable, element, encoders } from './editable.js'

// --- Test Fixtures ---

type User = {
  name: string
  age: number
  address: { city: string }
}

// --- Editable<T> Tests ---

type _EditableUser = Expect<
  Equals<
    Editable<User>,
    { value: User; onChange: (value: User) => void; onBlur?: (value: User) => void }
  >
>

type _EditableString = Expect<
  Equals<
    Editable<string>,
    { value: string; onChange: (value: string) => void; onBlur?: (value: string) => void }
  >
>

// --- handle() Return Type Tests ---

declare const userEditable: Editable<User>

// handle() should return Required<Editable<PathValue<T, P>>>
type _HandleName = Expect<
  Equals<ReturnType<typeof handle<User, 'name'>>, Required<Editable<string>>>
>
type _HandleAge = Expect<Equals<ReturnType<typeof handle<User, 'age'>>, Required<Editable<number>>>>
type _HandleCity = Expect<
  Equals<ReturnType<typeof handle<User, 'address.city'>>, Required<Editable<string>>>
>

// --- handle() with Arrays ---
// Note: Path<T> generates array paths for top-level arrays but not nested array properties.
// Runtime handle() still works with array paths via string coercion.

type StringArray = string[]
type _HandleArray0 = Expect<
  Equals<ReturnType<typeof handle<StringArray, '0'>>, Required<Editable<string>>>
>

// --- useEditable() Return Type ---

type _UseEditableReturn = Expect<
  Equals<ReturnType<typeof useEditable<string>>, Required<Editable<string>>>
>

// --- element() Return Type ---

declare const numEditable: Editable<number>
type _ElementReturn = Expect<
  Equals<
    ReturnType<typeof element<number>>,
    {
      value: string
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => void
      onBlur?: (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => void
    }
  >
>

// --- Encoder Types ---

type _StringEncoder = Expect<
  Equals<typeof encoders.string, { encode: (v: string) => string; decode: (v: string) => string }>
>
type _NumberEncoder = Expect<
  Equals<typeof encoders.number, { encode: (v: number) => string; decode: (v: string) => number }>
>

// --- Re-exported Types from @byside/utils ---

// Path and PathValue should be re-exported
type _PathReexported = Expect<Equals<Path<User>, 'name' | 'age' | 'address' | 'address.city'>>
type _PathValueReexported = Expect<Equals<PathValue<User, 'name'>, string>>

export {}
