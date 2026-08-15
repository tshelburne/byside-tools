---
'@byside/zod-to-gql': minor
---

Add an `io: 'input'` option, mirroring `z.toJSONSchema(schema, { io })`.

`io: 'output'` stays the default and is unchanged — `type` blocks, and a union
rendered as a GraphQL `union` with a block per member.

`io: 'input'` emits `input` blocks, and **merges** a union's members into a
single input rather than declaring one, because GraphQL has no input unions:

```ts
zodToGql('PaymentInput', z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ card: z.string(), postcode: z.string().nullable() }),
]), { io: 'input' })

// input PaymentInput {
//   id: UUID
//   card: String
//   postcode: String
// }
```

A field is required only when every member has it and requires it, so a
discriminant stays required while a field one branch carries does not —
requiring a non-shared field would make the other branches unsendable.

A discriminant renders as `String` rather than a synthesised enum, because its
values must match the schema's literals byte-for-byte and enum values are
uppercased by default.

The merge is deliberately lossy — the wire admits combinations the schema
rejects — so an input generated this way must be parsed by the same schema at
the door, which is where the caller gets a precise error.
