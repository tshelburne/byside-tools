---
'@byside/zod-to-gql': patch
---

Resolve zod 4's top-level format constructors.

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
