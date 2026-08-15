# @byside/zod-to-gql

## 0.5.0

### Minor Changes

- 9afe5de: Add an `io: 'input'` option, mirroring `z.toJSONSchema(schema, { io })`.

  `io: 'output'` stays the default and is unchanged — `type` blocks, and a union
  rendered as a GraphQL `union` with a block per member.

  `io: 'input'` emits `input` blocks, and **merges** a union's members into a
  single input rather than declaring one, because GraphQL has no input unions:

  ```ts
  zodToGql(
    'PaymentInput',
    z.union([
      z.object({ id: z.string().uuid() }),
      z.object({ card: z.string(), postcode: z.string().nullable() }),
    ]),
    { io: 'input' },
  )

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

## 0.4.1

### Patch Changes

- Map `z.date()` fields to a GraphQL scalar instead of silently falling through to `String`. `resolveBaseType` now handles `ZodDate` via the `date` scalar option (default `Date`), so `zodToGql(schema, { scalars: { date: 'Datetime' } })` yields `Datetime`.

## 0.4.0

### Minor Changes

- b272e55: Fix nested wrapper resolution and add discriminated-union auto-handling.
  - **Bugfix**: `MySchema.nullable().optional()` (and other multi-step wrapper
    chains like `.optional().nullable()`, `.default().optional()`) now resolves
    to the registered type name instead of falling back to `JSON`/`String`.
    Previously the unwrap stopped after one step and the inner schema reference
    never matched the types-map entry.
  - **Feature**: `z.discriminatedUnion(...)` schemas can now be registered
    without enumerating every variant. When a member isn't already in the
    types map, the generator synthesises a name from the discriminator literal
    (PascalCased) — e.g. `Event` with members tagged `'session_start'` /
    `'web_navigation'` produces `EventSessionStart` / `EventWebNavigation`
    plus `union Event = EventSessionStart | EventWebNavigation`. Members
    that _are_ registered keep their explicit names.

## 0.3.0

### Minor Changes

- 36900f1: Enabled preserving enum case

## 0.2.0

### Minor Changes

- 5209136: Update zodToGql to support record tranformation
