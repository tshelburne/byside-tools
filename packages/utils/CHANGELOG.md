# @byside/utils

## 0.5.0

### Minor Changes

- 87b64c3: Add recursive (deep) key-mapping types to `*CaseKeys`.

  `mapKeys` already recurses at runtime with `{ recursive: true }`, but the return
  type of `camelCaseKeys` / `snakeCaseKeys` / etc. was always shallow — nested keys
  were renamed at runtime while the type still showed the original casing, a
  runtime/type mismatch.
  - **Feature**: new `DeepMapKeys<T, F>` type — the recursive mirror of `MapKeys`,
    renaming keys through nested objects and arrays (Dates and primitive leaves
    pass through untouched, matching the runtime `isPlainObject` check).
  - **Feature**: new `MapKeysReturn<T, F, Opts>` — resolves to `DeepMapKeys` when
    `Opts extends { recursive: true }`, else `MapKeys`.
  - All five `*CaseKeys` functions now return `MapKeysReturn` keyed on their opts,
    so `camelCaseKeys(obj, { recursive: true })` is deeply typed. Backward
    compatible: calls without `{ recursive: true }` keep the identical shallow type.

## 0.4.1

### Patch Changes

- 05bbb33: improved util types

## 0.4.0

### Minor Changes

- e03ed02: added date utilties

## 0.3.0

### Minor Changes

- 1aefa16: added key functions for objects

## 0.2.0

### Minor Changes

- ccc9357: Added many new utils
