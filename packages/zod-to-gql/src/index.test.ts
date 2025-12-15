import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { zodToGql } from './index.js'

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

  it('handles datetime strings', () => {
    const schema = z.object({
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime().optional(),
    })

    const result = zodToGql('Timestamps', schema)

    assert.strictEqual(
      result,
      `type Timestamps {
  createdAt: Datetime!
  updatedAt: Datetime
}`,
    )
  })

  it('handles nullable fields', () => {
    const schema = z.object({
      name: z.string(),
      deletedAt: z.string().datetime().nullable(),
    })

    const result = zodToGql('SoftDelete', schema)

    assert.strictEqual(
      result,
      `type SoftDelete {
  name: String!
  deletedAt: Datetime
}`,
    )
  })

  it('handles literal types', () => {
    const schema = z.object({
      stringLiteral: z.literal('constant'),
      intLiteral: z.literal(42),
      floatLiteral: z.literal(3.14),
      boolLiteral: z.literal(true),
    })

    const result = zodToGql('Literals', schema)

    assert.strictEqual(
      result,
      `type Literals {
  stringLiteral: String!
  intLiteral: Int!
  floatLiteral: Float!
  boolLiteral: Boolean!
}`,
    )
  })

  it('handles union of string literals as String', () => {
    const schema = z.object({
      status: z.union([z.literal('active'), z.literal('inactive')]),
    })

    const result = zodToGql('WithUnion', schema)

    assert.strictEqual(
      result,
      `type WithUnion {
  status: String!
}`,
    )
  })

  it('handles union of strings and enums as String', () => {
    const schema = z.object({
      value: z.union([z.string(), z.enum(['a', 'b'])]),
    })

    const result = zodToGql('MixedUnion', schema)

    assert.strictEqual(
      result,
      `type MixedUnion {
  value: String!
}`,
    )
  })

  it('handles union of number literals as Int', () => {
    const schema = z.object({
      value: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    })

    const result = zodToGql('NumberUnion', schema)

    assert.strictEqual(
      result,
      `type NumberUnion {
  value: Int!
}`,
    )
  })

  it('handles union of floats as Float', () => {
    const schema = z.object({
      value: z.union([z.literal(1.5), z.literal(2.5)]),
    })

    const result = zodToGql('FloatUnion', schema)

    assert.strictEqual(
      result,
      `type FloatUnion {
  value: Float!
}`,
    )
  })

  it('handles union of booleans as Boolean', () => {
    const schema = z.object({
      value: z.union([z.literal(true), z.literal(false)]),
    })

    const result = zodToGql('BoolUnion', schema)

    assert.strictEqual(
      result,
      `type BoolUnion {
  value: Boolean!
}`,
    )
  })

  it('throws for unregistered object union field', () => {
    const A = z.object({ a: z.string() })
    const B = z.object({ b: z.string() })
    const schema = z.object({
      value: z.union([A, B]),
    })

    assert.throws(
      () => zodToGql('ObjectUnion', schema),
      /Object union used as a field must be registered/,
    )
  })

  it('throws for mixed type unions', () => {
    const schema = z.object({
      value: z.union([z.literal('a'), z.literal(1)]),
    })

    assert.throws(() => zodToGql('MixedUnion', schema), /Union contains mixed types/)
  })
})

describe('zodToGql with record', () => {
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

    const result = zodToGql(schemas)

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

    const result = zodToGql({
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

    const result = zodToGql({
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
      () => zodToGql({ Main: MainSchema }, { strict: true }),
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
      () => zodToGql({ Main: MainSchema }, { strict: true }),
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

    const result = zodToGql({ Main: MainSchema })

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

    const result = zodToGql(
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

  it('generates GraphQL union for object unions', () => {
    const DogSchema = z.object({
      breed: z.string(),
    })

    const CatSchema = z.object({
      meows: z.boolean(),
    })

    const PetUnion = z.union([DogSchema, CatSchema])

    const result = zodToGql({
      Dog: DogSchema,
      Cat: CatSchema,
      Pet: PetUnion,
    })

    assert.strictEqual(
      result,
      `type Dog {
  breed: String!
}

type Cat {
  meows: Boolean!
}

union Pet = Dog | Cat`,
    )
  })

  it('resolves registered union as field type', () => {
    const DogSchema = z.object({
      breed: z.string(),
    })

    const CatSchema = z.object({
      meows: z.boolean(),
    })

    const PetUnion = z.union([DogSchema, CatSchema])

    const OwnerSchema = z.object({
      name: z.string(),
      pet: PetUnion,
    })

    const result = zodToGql({
      Dog: DogSchema,
      Cat: CatSchema,
      Pet: PetUnion,
      Owner: OwnerSchema,
    })

    assert.strictEqual(
      result,
      `type Dog {
  breed: String!
}

type Cat {
  meows: Boolean!
}

union Pet = Dog | Cat

type Owner {
  name: String!
  pet: Pet!
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
