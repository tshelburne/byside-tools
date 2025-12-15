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
 * Convert a single Zod schema to GraphQL SDL type definition.
 * Compatible with both Zod 3 and Zod 4 schemas.
 */
function zodSchemaToGql(name: string, schema: ZodSchema, options: ZodToGqlOptions = {}): string {
  const scalars = { ...DEFAULT_SCALARS, ...options.scalars }
  const types = options.types
  const lines: string[] = []

  if (schema instanceof z.ZodObject) {
    lines.push(`type ${name} {`)
    const shape = schema.shape as Record<string, ZodSchema>
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const gqlType = zodTypeToGql(fieldSchema, scalars, types)
      lines.push(`  ${key}: ${gqlType}`)
    }
    lines.push('}')
  } else if (schema instanceof z.ZodEnum) {
    lines.push(`enum ${name} {`)
    for (const value of schema.options as string[]) {
      lines.push(`  ${value.toUpperCase()}`)
    }
    lines.push('}')
  } else {
    throw new Error(`Top-level schema must be ZodObject or ZodEnum, got ${schema.constructor.name}`)
  }

  return lines.join('\n')
}

/**
 * Convert multiple Zod schemas to GraphQL SDL.
 * Automatically resolves cross-references between schemas in the record.
 * Compatible with both Zod 3 and Zod 4 schemas.
 */
function zodSchemasToGql(
  schemas: Record<string, ZodSchema>,
  options: ZodToGqlOptions = {},
): string {
  // Build types Map from schemas record, merging with any user-provided types
  const types = new Map<ZodSchema, string>(options.types)
  for (const [name, schema] of Object.entries(schemas)) {
    types.set(schema, name)
  }

  const mergedOptions: ZodToGqlOptions = {
    ...options,
    types,
  }

  if (options.strict) {
    validateAllReferences(schemas, types)
  }

  return Object.entries(schemas)
    .map(([name, schema]) => zodSchemaToGql(name, schema, mergedOptions))
    .join('\n\n')
}

/**
 * Validate that all object schema references are present in the types map.
 * Throws if an unregistered object schema is found.
 */
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

  if (inner instanceof z.ZodObject && !types.has(inner)) {
    throw new Error(
      `Strict mode: Field "${fieldName}" on type "${parentType}" references an unregistered object schema. ` +
        `Add it to the schemas record or disable strict mode.`,
    )
  }
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

function unwrapSchema(schema: ZodSchema): {
  schema: ZodSchema
  isOptional: boolean
} {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return { schema: schema.unwrap(), isOptional: true }
  }
  if (schema instanceof z.ZodDefault) {
    return { schema: schema.removeDefault(), isOptional: false }
  }
  return { schema, isOptional: false }
}

type ZodCheck = { kind?: string; format?: string; isInt?: boolean }

function resolveBaseType(
  schema: ZodSchema,
  scalars: Record<string, string>,
  types?: Map<ZodSchema, string>,
): string {
  if (types?.has(schema)) {
    return types.get(schema)!
  }

  if (schema instanceof z.ZodString) {
    const def = schema._def as { checks?: ZodCheck[] }
    const checks = def.checks ?? []
    if (checks.some((c) => c.kind === 'uuid' || c.format === 'uuid')) {
      return scalars.uuid ?? 'String'
    }
    if (checks.some((c) => c.kind === 'datetime' || c.format === 'datetime')) {
      return scalars.datetime ?? 'String'
    }
    return 'String'
  }

  if (schema instanceof z.ZodNumber) {
    const def = schema._def as { checks?: ZodCheck[] }
    const checks = def.checks ?? []
    if (checks.some((c) => c.kind === 'int' || c.isInt === true)) {
      return 'Int'
    }
    return 'Float'
  }

  if (schema instanceof z.ZodBoolean) {
    return 'Boolean'
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
    // Zod 4 uses .value property, Zod 3 uses _def.value
    const value = schema.value
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float'
    if (typeof value === 'boolean') return 'Boolean'
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema.options as ZodSchema[]
    const allStringish = options.every((opt) => {
      if (opt instanceof z.ZodString || opt instanceof z.ZodEnum) return true
      if (opt instanceof z.ZodLiteral && typeof opt.value === 'string') return true
      return false
    })
    if (!allStringish) {
      throw new Error(
        `Union types can only contain strings, string literals, or enums. ` +
          `For object unions, register each type in the schemas record.`,
      )
    }
    return 'String'
  }

  return 'String'
}
