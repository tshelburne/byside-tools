# @byside/zod-to-gql

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
