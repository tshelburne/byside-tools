import { z } from 'zod'

/** Base Zod schema type - compatible with both Zod 3 and Zod 4 */
type ZodSchema = z.ZodTypeAny | z.core.$ZodType

export type ZodToGqlOptions = {
  /** Custom scalar mappings (e.g., { 'uuid': 'UUID' }) */
  scalars?: Record<string, string>
  /** Named type mappings for nested objects (schema -> GraphQL type name) */
  types?: Map<ZodSchema, string>
  /** Throw if an object schema is encountered that isn't in the schemas record (only applies to record overload) */
  strict?: boolean
  /** Preserve original case for enum values instead of uppercasing them */
  preserveEnumCase?: boolean
  /**
   * Which half of the schema to emit. Mirrors `z.toJSONSchema(schema, { io })`.
   *
   * `'output'` (the default) emits `type`, and renders a union as a GraphQL
   * `union` with a block per member.
   *
   * `'input'` emits `input`, and **merges** a union's members into a single
   * input with every non-shared field optional — because GraphQL has no input
   * unions, and an input is the one place the type system cannot express the
   * choice.
   *
   * The merge is deliberately lossy: the wire then admits combinations the
   * schema rejects. That is safe precisely when the schema is still parsed at
   * the door, which is the only way an input should ever be consumed — the
   * caller gets the schema's own error rather than a second opinion. What it
   * buys is that mapping back is the identity: `{ id }` matches one branch,
   * `{ card }` fails it and matches another, a discriminant picks its variant,
   * and nothing hand-written sits in between.
   */
  io?: 'output' | 'input'
}

const DEFAULT_SCALARS: Record<string, string> = {
  uuid: 'UUID',
  datetime: 'Datetime',
  date: 'Date',
  json: 'JSON',
}

/**
 * Convert a single Zod schema to GraphQL SDL type definition.
 */
export function zodToGql(name: string, schema: ZodSchema, options?: ZodToGqlOptions): string
/**
 * Convert multiple Zod schemas to GraphQL SDL.
 * Automatically resolves cross-references between schemas in the record.
 *
 * @example
 * ```ts
 * zodToGql({
 *   DomainProduct: ProductSchema,
 *   DomainInventory: InventorySchema, // references ProductSchema
 * })
 * // => type DomainProduct { ... }
 * //    type DomainInventory { product: DomainProduct! }
 * ```
 */
export function zodToGql(schemas: Record<string, ZodSchema>, options?: ZodToGqlOptions): string
export function zodToGql(
  nameOrSchemas: string | Record<string, ZodSchema>,
  schemaOrOptions?: ZodSchema | ZodToGqlOptions,
  options?: ZodToGqlOptions,
): string {
  if (typeof nameOrSchemas === 'string') {
    return zodSchemaToGql(nameOrSchemas, schemaOrOptions as ZodSchema, options)
  }
  return zodSchemasToGql(nameOrSchemas, schemaOrOptions as ZodToGqlOptions)
}

/**
 * Convert multiple Zod schemas to GraphQL SDL.
 * Automatically resolves cross-references between schemas in the record.
 */
function zodSchemasToGql(
  schemas: Record<string, ZodSchema>,
  options: ZodToGqlOptions = {},
): string {
  const types = new Map<ZodSchema, string>(options.types)
  for (const [name, schema] of Object.entries(schemas)) {
    types.set(schema, name)
  }

  const mergedOptions: ZodToGqlOptions = { ...options, types }

  if (options.strict) {
    validateAllReferences(schemas, types)
  }

  return Object.entries(schemas)
    .map(([name, schema]) => zodSchemaToGql(name, schema, mergedOptions))
    .join('\n\n')
}

/**
 * Convert a single Zod schema to GraphQL SDL type definition.
 *
 * Returns one or more SDL blocks separated by blank lines. Most schemas
 * yield a single block, but a discriminated union of inline (unregistered)
 * objects expands into one block per member plus the `union` declaration.
 */
function zodSchemaToGql(name: string, schema: ZodSchema, options: ZodToGqlOptions = {}): string {
  const scalars = { ...DEFAULT_SCALARS, ...options.scalars }
  const types = options.types
  const lines: string[] = []

  const keyword = options.io === 'input' ? 'input' : 'type'

  if (schema instanceof z.ZodObject) {
    lines.push(`${keyword} ${name} {`)
    const shape = schema.shape as Record<string, ZodSchema>
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const gqlType = zodTypeToGql(fieldSchema, scalars, types)
      lines.push(`  ${key}: ${gqlType}`)
    }
    lines.push('}')
  } else if (schema instanceof z.ZodEnum) {
    lines.push(`enum ${name} {`)
    for (const value of schema.options as string[]) {
      lines.push(`  ${options.preserveEnumCase ? value : value.toUpperCase()}`)
    }
    lines.push('}')
  } else if (schema instanceof z.ZodDiscriminatedUnion) {
    if (options.io === 'input') {
      return mergedInputToGql(
        name,
        (schema as unknown as ZodDiscriminatedUnionLike).options,
        scalars,
        types,
        options,
      )
    }
    return discriminatedUnionToGql(
      name,
      schema as unknown as ZodDiscriminatedUnionLike,
      scalars,
      types,
      options,
    )
  } else if (schema instanceof z.ZodUnion) {
    const members = (schema as z.ZodUnion<never>).options as readonly ZodSchema[]
    if (options.io === 'input' && members.every((m) => m instanceof z.ZodObject)) {
      return mergedInputToGql(name, members as readonly z.ZodObject[], scalars, types, options)
    }
    const unionMembers = resolveUnionMembers(schema as z.ZodUnion<never>, types)
    lines.push(`union ${name} = ${unionMembers.join(' | ')}`)
  } else {
    throw new Error(
      `Top-level schema must be ZodObject, ZodEnum, ZodUnion, or ZodDiscriminatedUnion, got ${schema.constructor.name}`,
    )
  }

  return lines.join('\n')
}

/**
 * Render a `z.discriminatedUnion(...)` as a GraphQL `union` plus member
 * `type`s. If a member is already registered in the types map (e.g., the
 * caller exported the variant individually), we reuse that name; otherwise
 * we synthesise a name from the discriminator literal — `Event` with a
 * member discriminated by `event: 'session_start'` becomes `EventSessionStart`.
 *
 * This lets callers register a single union schema (without enumerating
 * every variant) and still get a well-formed schema, which matches how
 * `z.discriminatedUnion` is most often used in practice.
 */
/**
 * Cross-version structural shape for `z.discriminatedUnion`. We can't use
 * `z.ZodDiscriminatedUnion` directly because its generic parameter
 * tightened between Zod 3 and Zod 4; coercing to this minimal shape lets
 * us read the two pieces we need (`discriminator` and member options)
 * without colliding with either version's stricter signature.
 */
interface ZodDiscriminatedUnionLike {
  _def: { discriminator: string }
  options: readonly z.ZodObject[]
}

function discriminatedUnionToGql(
  name: string,
  schema: ZodDiscriminatedUnionLike,
  scalars: Record<string, string>,
  types: Map<ZodSchema, string> | undefined,
  options: ZodToGqlOptions,
): string {
  const discriminator = schema._def.discriminator
  const memberSchemas = schema.options
  const blocks: string[] = []
  const memberNames: string[] = []

  // Mutable types map so synthesised members are visible to each other if
  // they reference shared sub-schemas registered upstream.
  const localTypes = new Map<ZodSchema, string>(types)

  for (const member of memberSchemas) {
    let memberName = lookupType(localTypes, member)
    if (!memberName) {
      const literal = discriminatorLiteral(member, discriminator)
      memberName = `${name}${pascalCase(literal)}`
      localTypes.set(member, memberName)

      // Synthesise the SDL block for this inline member.
      blocks.push(zodSchemaToGql(memberName, member, { ...options, types: localTypes }))
    }
    memberNames.push(memberName)
  }

  blocks.push(`union ${name} = ${memberNames.join(' | ')}`)
  return blocks.join('\n\n')
}

/**
 * Merge a union's members into one `input` block.
 *
 * GraphQL has no input unions, so the choice cannot be expressed in the type
 * system and has to survive somewhere else — the schema, parsed at the door.
 *
 * A field is required only when EVERY member has it AND requires it. A
 * discriminant present in all five variants therefore stays required, while a
 * field two of them carry does not. Getting that wrong is a bug that reads as
 * correct: require a non-shared field and the other branches become
 * unsendable, with nothing to indicate why.
 *
 * A discriminant renders as `String` rather than a synthesised enum, because
 * its values have to match the schema's literals byte-for-byte and this
 * package uppercases enum values by default. A caller wanting a real enum
 * registers one and references it.
 */
function mergedInputToGql(
  name: string,
  members: readonly z.ZodObject[],
  scalars: Record<string, string>,
  types: Map<ZodSchema, string> | undefined,
  options: ZodToGqlOptions,
): string {
  const seen = new Map<string, { schema: ZodSchema; count: number; requiredIn: number }>()

  for (const member of members) {
    for (const [key, field] of Object.entries(member.shape as Record<string, ZodSchema>)) {
      const { isOptional } = unwrapSchema(field)
      const entry = seen.get(key) ?? { schema: field, count: 0, requiredIn: 0 }
      entry.count += 1
      if (!isOptional) entry.requiredIn += 1
      seen.set(key, entry)
    }
  }

  const lines = [`input ${name} {`]
  for (const [key, entry] of seen) {
    const shared = entry.count === members.length && entry.requiredIn === members.length
    // A literal is a discriminant; its wire value must survive unchanged.
    const type =
      entry.schema instanceof z.ZodLiteral ?
        'String'
      : zodTypeToGql(entry.schema, scalars, types).replace(/!$/, '')
    lines.push(`  ${key}: ${type}${shared ? '!' : ''}`)
  }
  lines.push('}')
  return lines.join('\n')
}

function discriminatorLiteral(member: z.ZodObject, discriminator: string): string {
  const shape = member.shape as Record<string, ZodSchema>
  const field = shape[discriminator]
  if (field instanceof z.ZodLiteral && typeof field.value === 'string') {
    return field.value
  }
  // Fallback: stringify whatever we found so the user gets a debuggable name
  // instead of a silent collision.
  return field instanceof z.ZodLiteral ? String(field.value) : 'Variant'
}

function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function zodTypeToGql(
  schema: ZodSchema,
  scalars: Record<string, string>,
  types?: Map<ZodSchema, string>,
): string {
  const unwrapped = unwrapSchema(schema)
  const isOptional = unwrapped.isOptional
  const inner = unwrapped.schema

  const baseType = resolveBaseType(inner, scalars, types)
  return isOptional ? baseType : `${baseType}!`
}

/**
 * Strip `optional`, `nullable`, and `default` wrappers from a schema. Field
 * declarations like `MySchema.nullable().optional()` produce a chain of
 * wrappers (ZodOptional → ZodNullable → MySchema); we need to peel them
 * all off so the types-map lookup in `resolveBaseType` sees the same
 * schema reference the caller registered. Stops at the first non-wrapper.
 */
function unwrapSchema(schema: ZodSchema): { schema: ZodSchema; isOptional: boolean } {
  let current = schema
  let isOptional = false

  while (true) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      isOptional = true
      current = current.unwrap()
      continue
    }
    if (current instanceof z.ZodDefault) {
      // `default` makes the field non-optional (a value is always present),
      // so we don't flip isOptional, but we do unwrap to inspect the inner.
      current = current.removeDefault()
      continue
    }
    break
  }

  return { schema: current, isOptional }
}

type ZodCheck = { kind?: string; format?: string; isInt?: boolean }

/**
 * Whether this is a string, however it was constructed.
 *
 * `instanceof z.ZodString` is not enough in Zod 4: `z.uuid()` returns a
 * `ZodUUID`, which extends `ZodStringFormat` and NOT `ZodString`, so the branch
 * never ran for it. Checking the def's own type catches every format class
 * without naming them, and Zod 3 keeps working because its string schemas are
 * `ZodString` instances anyway.
 */
/**
 * Whether this is a number, however it was constructed. `z.int()` returns a
 * `ZodNumberFormat` rather than a `ZodNumber`, the same way `z.uuid()` does for
 * strings — so the same check is needed, for the same reason.
 */
function isNumberSchema(schema: ZodSchema): schema is z.ZodNumber {
  if (schema instanceof z.ZodNumber) return true
  return (schema as { _def?: { type?: string } })._def?.type === 'number'
}

/**
 * Whether a number is an integer, whichever way it was said.
 *
 *   z.number().int()  →  a check
 *   z.int()           →  the schema's own format
 *
 * The distinction is not cosmetic: GraphQL's `Int` is 32-bit and `Float` is
 * not, so getting it wrong changes what a client accepts.
 */
function isInteger(schema: ZodSchema): boolean {
  const def = (schema as { _def?: { format?: string; checks?: ZodCheck[] } })._def ?? {}
  if (def.format === 'safeint' || def.format === 'int32' || def.format === 'int') return true
  return (def.checks ?? []).some(
    (check) => check.kind === 'int' || check.isInt === true || check.format === 'safeint',
  )
}

function isStringSchema(schema: ZodSchema): schema is z.ZodString {
  if (schema instanceof z.ZodString) return true
  return (schema as { _def?: { type?: string } })._def?.type === 'string'
}

/**
 * The format of a string schema, whichever way it was spelled.
 *
 * Zod 4 has two, and they store it in different places:
 *
 *   z.string().uuid()  →  a check, `checks[].format`
 *   z.uuid()           →  the schema's own `_def.format`
 *
 * Reading only the checks means the top-level spelling falls through to
 * `String` — silently, because `String` is a legal GraphQL type and the SDL
 * still builds. The only symptom is a generated client type looser than the
 * schema, and `z.string().uuid()` is the deprecated half of the pair, so the
 * spelling that worked is the one people are leaving.
 *
 * Returning the NAME rather than mapping here is what lets a caller add a
 * scalar for any format — `email`, `url`, whatever their server publishes —
 * without this function growing a branch per format.
 */
function stringFormat(schema: z.ZodString): string | undefined {
  const def = schema._def as { format?: string; checks?: ZodCheck[] }
  if (def.format) return def.format
  for (const check of def.checks ?? []) {
    const format = check.format ?? check.kind
    if (format) return format
  }
  return undefined
}

function resolveBaseType(
  schema: ZodSchema,
  scalars: Record<string, string>,
  types?: Map<ZodSchema, string>,
): string {
  const registered = lookupType(types, schema)
  if (registered) {
    return registered
  }

  if (isStringSchema(schema)) {
    const format = stringFormat(schema)
    return (format && scalars[format]) || 'String'
  }

  if (isNumberSchema(schema)) {
    return isInteger(schema) ? 'Int' : 'Float'
  }

  if (schema instanceof z.ZodBoolean) {
    return 'Boolean'
  }

  if (schema instanceof z.ZodDate) {
    return scalars.date ?? 'String'
  }

  if (schema instanceof z.ZodEnum) {
    return 'String'
  }

  if (schema instanceof z.ZodArray) {
    const itemType = zodTypeToGql(schema.element, scalars, types)
    return `[${itemType}]`
  }

  if (schema instanceof z.ZodObject) {
    return scalars.json ?? 'JSON'
  }

  if (schema instanceof z.ZodLiteral) {
    const value = schema.value
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float'
    if (typeof value === 'boolean') return 'Boolean'
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema.options as ZodSchema[]

    const registeredName = lookupType(types, schema)
    if (registeredName) {
      return registeredName
    }

    const allStringish = options.every((opt) => {
      if (opt instanceof z.ZodString || opt instanceof z.ZodEnum) return true
      if (opt instanceof z.ZodLiteral && typeof opt.value === 'string') return true
      return false
    })
    if (allStringish) {
      return 'String'
    }

    const allNumbers = options.every(
      (opt) =>
        opt instanceof z.ZodNumber ||
        (opt instanceof z.ZodLiteral && typeof opt.value === 'number'),
    )
    if (allNumbers) {
      const allInts = options.every((opt) => {
        if (opt instanceof z.ZodLiteral) return Number.isInteger(opt.value)
        if (opt instanceof z.ZodNumber) {
          const def = opt._def as { checks?: Array<{ kind?: string }> }
          return def.checks?.some((c) => c.kind === 'int') ?? false
        }
        return false
      })
      return allInts ? 'Int' : 'Float'
    }

    const allBooleans = options.every(
      (opt) =>
        opt instanceof z.ZodBoolean ||
        (opt instanceof z.ZodLiteral && typeof opt.value === 'boolean'),
    )
    if (allBooleans) {
      return 'Boolean'
    }

    const allObjects = options.every((opt) => opt instanceof z.ZodObject)
    if (allObjects) {
      throw new Error(
        `Object union used as a field must be registered in the schemas record. ` +
          `Add the union schema to the record with a name, e.g., { MyUnion: z.union([A, B]) }`,
      )
    }

    throw new Error(
      `Union contains mixed types that cannot be converted to GraphQL. ` +
        `Unions must contain all strings, all numbers, all booleans, or all registered objects.`,
    )
  }

  return 'String'
}

/**
 * Find a registered name for a schema.
 *
 * Identity is not enough. `.describe()` returns a CLONE — a different object
 * that shares its `_zod.def` — so a caller who registers `OrderRef` and then
 * writes `OrderRef.describe('the order')` at a field gets no match, and the
 * field silently degrades to `JSON`. That spelling is idiomatic (it is how a
 * reference carries its help text), so identity alone makes the types map miss
 * exactly where it is most used.
 *
 * Matching on the shared `def` catches the clone without making the lookup
 * structural, which would be both slower and much easier to get subtly wrong.
 */
function lookupType(
  types: Map<ZodSchema, string> | undefined,
  schema: ZodSchema,
): string | undefined {
  if (!types) return undefined
  const direct = types.get(schema)
  if (direct) return direct

  const def = defOf(schema)
  if (!def) return undefined
  for (const [registered, name] of types) {
    if (defOf(registered) === def) return name
  }
  return undefined
}

function defOf(schema: ZodSchema): unknown {
  return (schema as { _zod?: { def?: unknown } })._zod?.def
}

function resolveUnionMembers(schema: z.ZodUnion<never>, types?: Map<ZodSchema, string>): string[] {
  const options = (schema as { options: readonly ZodSchema[] }).options
  const members: string[] = []

  for (const opt of options) {
    if (!(opt instanceof z.ZodObject)) {
      throw new Error(
        `Union members must be object types when used as a top-level union declaration.`,
      )
    }
    const typeName = lookupType(types, opt)
    if (!typeName) {
      throw new Error(
        `Union member is not registered in the types map. ` +
          `Register all union member schemas in the schemas record.`,
      )
    }
    members.push(typeName)
  }

  return members
}

function validateAllReferences(
  schemas: Record<string, ZodSchema>,
  types: Map<ZodSchema, string>,
): void {
  for (const [typeName, schema] of Object.entries(schemas)) {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape as Record<string, ZodSchema>
      for (const [fieldName, fieldSchema] of Object.entries(shape)) {
        validateFieldSchema(fieldSchema, types, typeName, fieldName)
      }
    }
  }
}

function validateFieldSchema(
  schema: ZodSchema,
  types: Map<ZodSchema, string>,
  parentType: string,
  fieldName: string,
): void {
  const unwrapped = unwrapSchema(schema)
  const inner = unwrapped.schema

  if (inner instanceof z.ZodArray) {
    validateFieldSchema(inner.element, types, parentType, fieldName)
    return
  }

  if (inner instanceof z.ZodObject && !lookupType(types, inner)) {
    throw new Error(
      `Strict mode: Field "${fieldName}" on type "${parentType}" references an unregistered object schema. ` +
        `Add it to the schemas record or disable strict mode.`,
    )
  }
}
