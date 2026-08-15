---
'@byside/zod-to-gql': patch
---

Match a registered schema through `.describe()`.

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
