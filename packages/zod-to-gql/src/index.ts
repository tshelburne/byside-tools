import { z } from 'zod'

export type ZodToGqlOptions = {
  /** Custom scalar mappings (e.g., { 'uuid': 'UUID' }) */
  scalars?: Record<string, string>
  /** Named type mappings for nested objects (schema -> GraphQL type name) */
  types?: Map<z.ZodTypeAny, string>
}

const DEFAULT_SCALARS: Record<string, string> = {
  uuid: 'UUID',
  datetime: 'Datetime',
  date: 'Date',
  json: 'JSON',
}

/**
 * Convert a Zod schema to GraphQL SDL type definition
 */
export function zodToGql(
  name: string,
  schema: z.ZodTypeAny,
  options: ZodToGqlOptions = {},
): string {
  const scalars = { ...DEFAULT_SCALARS, ...options.scalars }
  const types = options.types
  const lines: string[] = []

  if (schema instanceof z.ZodObject) {
    lines.push(`type ${name} {`)
    const shape = schema.shape as Record<string, z.ZodTypeAny>
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
    throw new Error(
      `Top-level schema must be ZodObject or ZodEnum, got ${schema.constructor.name}`,
    )
  }

  return lines.join('\n')
}

/**
 * Convert multiple Zod schemas to GraphQL SDL
 */
export function zodSchemasToGql(
  schemas: Record<string, z.ZodTypeAny>,
  options: ZodToGqlOptions = {},
): string {
  return Object.entries(schemas)
    .map(([name, schema]) => zodToGql(name, schema, options))
    .join('\n\n')
}

function zodTypeToGql(
  schema: z.ZodTypeAny,
  scalars: Record<string, string>,
  types?: Map<z.ZodTypeAny, string>,
): string {
  const unwrapped = unwrapSchema(schema)
  const isOptional = unwrapped.isOptional
  const inner = unwrapped.schema

  const baseType = resolveBaseType(inner, scalars, types)
  return isOptional ? baseType : `${baseType}!`
}

function unwrapSchema(schema: z.ZodTypeAny): {
  schema: z.ZodTypeAny
  isOptional: boolean
} {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return { schema: schema.unwrap() as z.ZodTypeAny, isOptional: true }
  }
  if (schema instanceof z.ZodDefault) {
    return { schema: schema.removeDefault() as z.ZodTypeAny, isOptional: false }
  }
  return { schema, isOptional: false }
}

type ZodCheck = { kind?: string; format?: string; isInt?: boolean }

function resolveBaseType(
  schema: z.ZodTypeAny,
  scalars: Record<string, string>,
  types?: Map<z.ZodTypeAny, string>,
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
    const itemType = zodTypeToGql(
      schema.element as z.ZodTypeAny,
      scalars,
      types,
    )
    return `[${itemType}]`
  }

  if (schema instanceof z.ZodObject) {
    return scalars.json ?? 'JSON'
  }

  if (schema instanceof z.ZodLiteral) {
    const def = schema._def as { value?: unknown; values?: unknown }
    const value = def.value ?? def.values
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number')
      return Number.isInteger(value) ? 'Int' : 'Float'
    if (typeof value === 'boolean') return 'Boolean'
  }

  if (schema instanceof z.ZodUnion) {
    return 'String'
  }

  return 'String'
}
