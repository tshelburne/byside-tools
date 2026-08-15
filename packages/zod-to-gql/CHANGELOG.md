# @byside/zod-to-gql

## 0.5.1

### Patch Changes

- 4836b07: Match a registered schema through `.describe()`.

  `.describe()` returns a clone sharing its `_zod.def`, so a schema registered in
  `types` was not found once it was described at its use site:

  ```ts
  const Ref = z.object({ id: z.string() })
  zodToGql('Main', z.object({ ref: Ref.describe('the thing') }), {
    types: new Map([[Ref, 'RefType']]),
  })
  // was:  type Main { ref: JSON! }
  // now:  type Main { ref: RefType! }
  ```

  That is the idiomatic spelling — describing a reference where it is used is how
  it carries help text — so the map missed exactly where it was most used, and did
  so silently: `JSON` is a legal type and the SDL still builds.

  Lookups now fall back to comparing the shared `def`. Two structurally identical
  but separately-declared schemas still do not match, which is asserted.

- be4477c: Resolve zod 4's top-level format constructors.

  `z.uuid()`, `z.iso.datetime()`, `z.iso.date()`, `z.int()` and friends were not
  recognised — only the chained spellings were:

  ```
  z.string().uuid()   →  UUID!      z.uuid()          →  String!   (now UUID!)
  z.string().datetime() → Datetime! z.iso.datetime()  →  String!   (now Datetime!)
  z.number().int()    →  Int!       z.int()           →  String!   (now Int!)
  ```

  Two causes, one per type. The format lives on the schema's own `_def.format`
  rather than in `_def.checks`; and `z.uuid()` returns a `ZodUUID`, which is not
  `instanceof z.ZodString`, so the branch that reads formats never ran for it.
  Same for `z.int()` and `ZodNumber`.

  Formats are now looked up by name in `scalars` rather than branched on, so
  `z.iso.date()` resolves to `Date` (which it never did), and a caller can name a
  scalar for any format their server publishes:

  ```ts
  zodToGql('A', z.object({ email: z.email() }), { scalars: { email: 'Email' } })
  ```

  This mattered because it failed silently: `String` is a legal GraphQL type, the
  SDL builds, and the only symptom is a generated client type looser than the
  schema. `z.string().uuid()` is also the deprecated half of each pair, so the
  spelling that worked was the one people are migrating away from.

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
