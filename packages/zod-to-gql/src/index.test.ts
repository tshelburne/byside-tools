import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { zodToGql, zodSchemasToGql } from './index.js'

describe('zodToGql', () => {
  it('converts simple object schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().int(),
    })

    const result = zodToGql('Person', schema)

    assert.strictEqual(
      result,
      `type Person {
  name: String!
  age: Int!
}`,
    )
  })

  it('handles optional fields', () => {
    const schema = z.object({
      name: z.string(),
      nickname: z.string().optional(),
    })

    const result = zodToGql('User', schema)

    assert.strictEqual(
      result,
      `type User {
  name: String!
  nickname: String
}`,
    )
  })

  it('handles arrays', () => {
    const schema = z.object({
      tags: z.array(z.string()),
      scores: z.array(z.number().int()).optional(),
    })

    const result = zodToGql('Item', schema)

    assert.strictEqual(
      result,
      `type Item {
  tags: [String!]!
  scores: [Int!]
}`,
    )
  })

  it('handles uuid strings', () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string(),
    })

    const result = zodToGql('Entity', schema)

    assert.strictEqual(
      result,
      `type Entity {
  id: UUID!
  name: String!
}`,
    )
  })

  it('handles boolean fields', () => {
    const schema = z.object({
      isActive: z.boolean(),
      isAdmin: z.boolean().optional(),
    })

    const result = zodToGql('Flags', schema)

    assert.strictEqual(
      result,
      `type Flags {
  isActive: Boolean!
  isAdmin: Boolean
}`,
    )
  })

  it('handles float numbers', () => {
    const schema = z.object({
      count: z.number().int(),
      rating: z.number(),
    })

    const result = zodToGql('Stats', schema)

    assert.strictEqual(
      result,
      `type Stats {
  count: Int!
  rating: Float!
}`,
    )
  })

  it('handles default values as non-optional', () => {
    const schema = z.object({
      status: z.string().default('active'),
      count: z.number().int().default(0),
    })

    const result = zodToGql('Config', schema)

    assert.strictEqual(
      result,
      `type Config {
  status: String!
  count: Int!
}`,
    )
  })

  it('converts enum schema', () => {
    const schema = z.enum(['pending', 'active', 'completed'])

    const result = zodToGql('Status', schema)

    assert.strictEqual(
      result,
      `enum Status {
  PENDING
  ACTIVE
  COMPLETED
}`,
    )
  })

  it('handles enum fields as String', () => {
    const StatusSchema = z.enum(['active', 'inactive'])
    const schema = z.object({
      name: z.string(),
      status: StatusSchema,
    })

    const result = zodToGql('User', schema)

    assert.strictEqual(
      result,
      `type User {
  name: String!
  status: String!
}`,
    )
  })
})

describe('zodSchemasToGql', () => {
  it('converts multiple schemas', () => {
    const schemas = {
      Age: z.object({
        min: z.number().int().optional(),
        max: z.number().int().optional(),
      }),
      Role: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    }

    const result = zodSchemasToGql(schemas)

    assert.strictEqual(
      result,
      `type Age {
  min: Int
  max: Int
}

type Role {
  id: UUID!
  name: String!
}`,
    )
  })

  it('automatically resolves cross-references between schemas', () => {
    const ProductSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
    })

    const LocationSchema = z.object({
      id: z.string().uuid(),
      address: z.string(),
    })

    const InventorySchema = z.object({
      id: z.string().uuid(),
      product: ProductSchema,
      location: LocationSchema.optional(),
      quantity: z.number().int(),
    })

    const result = zodSchemasToGql({
      DomainProduct: ProductSchema,
      DomainLocation: LocationSchema,
      DomainInventory: InventorySchema,
    })

    assert.strictEqual(
      result,
      `type DomainProduct {
  id: UUID!
  name: String!
}

type DomainLocation {
  id: UUID!
  address: String!
}

type DomainInventory {
  id: UUID!
  product: DomainProduct!
  location: DomainLocation
  quantity: Int!
}`,
    )
  })

  it('resolves cross-references in arrays', () => {
    const TagSchema = z.object({
      name: z.string(),
    })

    const ArticleSchema = z.object({
      title: z.string(),
      tags: z.array(TagSchema),
    })

    const result = zodSchemasToGql({
      Tag: TagSchema,
      Article: ArticleSchema,
    })

    assert.strictEqual(
      result,
      `type Tag {
  name: String!
}

type Article {
  title: String!
  tags: [Tag!]!
}`,
    )
  })

  it('throws in strict mode when referencing unregistered schema', () => {
    const UnregisteredSchema = z.object({
      foo: z.string(),
    })

    const MainSchema = z.object({
      ref: UnregisteredSchema,
    })

    assert.throws(
      () => zodSchemasToGql({ Main: MainSchema }, { strict: true }),
      /Strict mode: Field "ref" on type "Main" references an unregistered object schema/,
    )
  })

  it('throws in strict mode for unregistered schemas in arrays', () => {
    const UnregisteredSchema = z.object({
      foo: z.string(),
    })

    const MainSchema = z.object({
      items: z.array(UnregisteredSchema),
    })

    assert.throws(
      () => zodSchemasToGql({ Main: MainSchema }, { strict: true }),
      /Strict mode: Field "items" on type "Main" references an unregistered object schema/,
    )
  })

  it('does not throw in non-strict mode for unregistered schemas', () => {
    const UnregisteredSchema = z.object({
      foo: z.string(),
    })

    const MainSchema = z.object({
      ref: UnregisteredSchema,
    })

    const result = zodSchemasToGql({ Main: MainSchema })

    assert.strictEqual(
      result,
      `type Main {
  ref: JSON!
}`,
    )
  })

  it('merges user-provided types with auto-resolved types', () => {
    const ExternalSchema = z.object({
      value: z.string(),
    })

    const InternalSchema = z.object({
      name: z.string(),
    })

    const MainSchema = z.object({
      external: ExternalSchema,
      internal: InternalSchema,
    })

    const result = zodSchemasToGql(
      {
        Internal: InternalSchema,
        Main: MainSchema,
      },
      {
        types: new Map([[ExternalSchema, 'ExternalType']]),
      },
    )

    assert.strictEqual(
      result,
      `type Internal {
  name: String!
}

type Main {
  external: ExternalType!
  internal: Internal!
}`,
    )
  })
})

describe('zodToGql with types map', () => {
  it('references named types for nested objects', () => {
    const AgeSchema = z.object({
      min: z.number().int().optional(),
      max: z.number().int().optional(),
    })

    const RoleSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      age: AgeSchema.optional(),
    })

    const types = new Map<z.ZodTypeAny, string>([[AgeSchema, 'ExtractedAge']])

    const result = zodToGql('ExtractedRole', RoleSchema, { types })

    assert.strictEqual(
      result,
      `type ExtractedRole {
  id: UUID!
  name: String!
  age: ExtractedAge
}`,
    )
  })

  it('references named types in arrays', () => {
    const TagSchema = z.object({ name: z.string() })
    const ItemSchema = z.object({
      tags: z.array(TagSchema),
    })

    const types = new Map<z.ZodTypeAny, string>([[TagSchema, 'Tag']])

    const result = zodToGql('Item', ItemSchema, { types })

    assert.strictEqual(
      result,
      `type Item {
  tags: [Tag!]!
}`,
    )
  })
})
