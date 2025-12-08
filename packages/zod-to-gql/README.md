# @byside/zod-to-gql

Convert Zod schemas to GraphQL SDL type definitions.

## Installation

```bash
npm install @byside/zod-to-gql
# or
pnpm add @byside/zod-to-gql
```

## Usage

```typescript
import { z } from 'zod'
import { zodToGql, zodSchemasToGql } from '@byside/zod-to-gql'

// Single schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  age: z.number().int().optional(),
  isAdmin: z.boolean(),
})

console.log(zodToGql('User', UserSchema))
// type User {
//   id: UUID!
//   name: String!
//   age: Int
//   isAdmin: Boolean!
// }

// Enum
const StatusSchema = z.enum(['pending', 'active', 'completed'])
console.log(zodToGql('Status', StatusSchema))
// enum Status {
//   PENDING
//   ACTIVE
//   COMPLETED
// }

// Multiple schemas
const schemas = {
  User: UserSchema,
  Status: StatusSchema,
}
console.log(zodSchemasToGql(schemas))
```

## Options

### Custom Scalars

```typescript
zodToGql('Entity', schema, {
  scalars: {
    uuid: 'ID', // Map UUID to ID instead
    datetime: 'DateTime',
  }
})
```

### Named Type References

Reference other types instead of inlining nested objects:

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
})

const PersonSchema = z.object({
  name: z.string(),
  address: AddressSchema,
})

const types = new Map([[AddressSchema, 'Address']])

zodToGql('Person', PersonSchema, { types })
// type Person {
//   name: String!
//   address: Address!
// }
```

## Type Mappings

| Zod Type | GraphQL Type |
|----------|--------------|
| `z.string()` | `String` |
| `z.string().uuid()` | `UUID` |
| `z.string().datetime()` | `Datetime` |
| `z.number()` | `Float` |
| `z.number().int()` | `Int` |
| `z.boolean()` | `Boolean` |
| `z.array(T)` | `[T]` |
| `z.object({})` | `JSON` (or named type) |
| `z.enum([...])` | `String` (as field) or `enum` (as top-level) |
| `.optional()` | removes `!` |
| `.default()` | keeps `!` (always present in output) |

## License

MIT
