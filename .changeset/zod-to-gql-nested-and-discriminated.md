---
'@byside/zod-to-gql': minor
---

Fix nested wrapper resolution and add discriminated-union auto-handling.

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
  that *are* registered keep their explicit names.
