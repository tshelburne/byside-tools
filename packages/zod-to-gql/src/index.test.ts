import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { zodToGql } from './index.js'

describe('zodToGql', () => {
  describe('scalar types', () => {
    it('converts string to String', () => {
      const schema = z.object({ name: z.string() })
      const result = zodToGql('Person', schema)
      assert.strictEqual(result, `type Person {\n  name: String!\n}`)
    })

    it('converts uuid string to UUID', () => {
      const schema = z.object({ id: z.string().uuid() })
      const result = zodToGql('Entity', schema)
      assert.strictEqual(result, `type Entity {\n  id: UUID!\n}`)
    })

    it('converts datetime string to Datetime', () => {
      const schema = z.object({ createdAt: z.string().datetime() })
      const result = zodToGql('Timestamps', schema)
      assert.strictEqual(result, `type Timestamps {\n  createdAt: Datetime!\n}`)
    })

    it('converts number to Float', () => {
      const schema = z.object({ rating: z.number() })
      const result = zodToGql('Stats', schema)
      assert.strictEqual(result, `type Stats {\n  rating: Float!\n}`)
    })

    it('converts number.int to Int', () => {
      const schema = z.object({ count: z.number().int() })
      const result = zodToGql('Stats', schema)
      assert.strictEqual(result, `type Stats {\n  count: Int!\n}`)
    })

    it('converts boolean to Boolean', () => {
      const schema = z.object({ isActive: z.boolean() })
      const result = zodToGql('Flags', schema)
      assert.strictEqual(result, `type Flags {\n  isActive: Boolean!\n}`)
    })
  })

  describe('wrappers', () => {
    it('converts optional to nullable field', () => {
      const schema = z.object({ nickname: z.string().optional() })
      const result = zodToGql('User', schema)
      assert.strictEqual(result, `type User {\n  nickname: String\n}`)
    })

    it('converts nullable to nullable field', () => {
      const schema = z.object({ deletedAt: z.string().datetime().nullable() })
      const result = zodToGql('SoftDelete', schema)
      assert.strictEqual(result, `type SoftDelete {\n  deletedAt: Datetime\n}`)
    })

    it('converts default to non-null field', () => {
      const schema = z.object({ status: z.string().default('active') })
      const result = zodToGql('Config', schema)
      assert.strictEqual(result, `type Config {\n  status: String!\n}`)
    })
  })

  describe('enums', () => {
    it('converts top-level enum to GraphQL enum', () => {
      const schema = z.enum(['pending', 'active', 'completed'])
      const result = zodToGql('Status', schema)
      assert.strictEqual(result, `enum Status {\n  PENDING\n  ACTIVE\n  COMPLETED\n}`)
    })

    it('preserves enum case with preserveEnumCase option', () => {
      const schema = z.enum(['liquor', 'beer', 'Wine'])
      const result = zodToGql('DrinkType', schema, { preserveEnumCase: true })
      assert.strictEqual(result, `enum DrinkType {\n  liquor\n  beer\n  Wine\n}`)
    })

    it('converts enum field to String', () => {
      const schema = z.object({ status: z.enum(['active', 'inactive']) })
      const result = zodToGql('User', schema)
      assert.strictEqual(result, `type User {\n  status: String!\n}`)
    })
  })

  describe('literals', () => {
    it('converts string literal to String', () => {
      const schema = z.object({ type: z.literal('constant') })
      const result = zodToGql('Typed', schema)
      assert.strictEqual(result, `type Typed {\n  type: String!\n}`)
    })

    it('converts integer literal to Int', () => {
      const schema = z.object({ value: z.literal(42) })
      const result = zodToGql('Typed', schema)
      assert.strictEqual(result, `type Typed {\n  value: Int!\n}`)
    })

    it('converts float literal to Float', () => {
      const schema = z.object({ value: z.literal(3.14) })
      const result = zodToGql('Typed', schema)
      assert.strictEqual(result, `type Typed {\n  value: Float!\n}`)
    })

    it('converts boolean literal to Boolean', () => {
      const schema = z.object({ value: z.literal(true) })
      const result = zodToGql('Typed', schema)
      assert.strictEqual(result, `type Typed {\n  value: Boolean!\n}`)
    })
  })

  describe('arrays', () => {
    it('converts array to list type', () => {
      const schema = z.object({ tags: z.array(z.string()) })
      const result = zodToGql('Item', schema)
      assert.strictEqual(result, `type Item {\n  tags: [String!]!\n}`)
    })

    it('converts optional array to nullable list', () => {
      const schema = z.object({ scores: z.array(z.number().int()).optional() })
      const result = zodToGql('Item', schema)
      assert.strictEqual(result, `type Item {\n  scores: [Int!]\n}`)
    })
  })

  describe('unions', () => {
    it('converts string literal union to String', () => {
      const schema = z.object({ status: z.union([z.literal('active'), z.literal('inactive')]) })
      const result = zodToGql('WithUnion', schema)
      assert.strictEqual(result, `type WithUnion {\n  status: String!\n}`)
    })

    it('converts string/enum union to String', () => {
      const schema = z.object({ value: z.union([z.string(), z.enum(['a', 'b'])]) })
      const result = zodToGql('MixedUnion', schema)
      assert.strictEqual(result, `type MixedUnion {\n  value: String!\n}`)
    })

    it('converts integer literal union to Int', () => {
      const schema = z.object({ value: z.union([z.literal(1), z.literal(2), z.literal(3)]) })
      const result = zodToGql('NumberUnion', schema)
      assert.strictEqual(result, `type NumberUnion {\n  value: Int!\n}`)
    })

    it('converts float literal union to Float', () => {
      const schema = z.object({ value: z.union([z.literal(1.5), z.literal(2.5)]) })
      const result = zodToGql('FloatUnion', schema)
      assert.strictEqual(result, `type FloatUnion {\n  value: Float!\n}`)
    })

    it('converts boolean literal union to Boolean', () => {
      const schema = z.object({ value: z.union([z.literal(true), z.literal(false)]) })
      const result = zodToGql('BoolUnion', schema)
      assert.strictEqual(result, `type BoolUnion {\n  value: Boolean!\n}`)
    })

    it('throws for unregistered object union field', () => {
      const A = z.object({ a: z.string() })
      const B = z.object({ b: z.string() })
      const schema = z.object({ value: z.union([A, B]) })

      assert.throws(
        () => zodToGql('ObjectUnion', schema),
        /Object union used as a field must be registered/,
      )
    })

    it('throws for mixed type unions', () => {
      const schema = z.object({ value: z.union([z.literal('a'), z.literal(1)]) })
      assert.throws(() => zodToGql('MixedUnion', schema), /Union contains mixed types/)
    })
  })
})

describe('zodToGql with record', () => {
  describe('basic usage', () => {
    it('converts multiple schemas', () => {
      const result = zodToGql({
        Age: z.object({ min: z.number().int().optional(), max: z.number().int().optional() }),
        Role: z.object({ id: z.string().uuid(), name: z.string() }),
      })

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

    it('preserves enum case with preserveEnumCase option', () => {
      const result = zodToGql(
        { DrinkType: z.enum(['liquor', 'beer', 'Wine']) },
        { preserveEnumCase: true },
      )
      assert.strictEqual(result, `enum DrinkType {\n  liquor\n  beer\n  Wine\n}`)
    })
  })

  describe('cross-references', () => {
    it('resolves object field references', () => {
      const ProductSchema = z.object({ id: z.string().uuid(), name: z.string() })
      const LocationSchema = z.object({ id: z.string().uuid(), address: z.string() })
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

    it('resolves array of object references', () => {
      const TagSchema = z.object({ name: z.string() })
      const ArticleSchema = z.object({ title: z.string(), tags: z.array(TagSchema) })

      const result = zodToGql({ Tag: TagSchema, Article: ArticleSchema })

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

    it('merges user-provided types with auto-resolved types', () => {
      const ExternalSchema = z.object({ value: z.string() })
      const InternalSchema = z.object({ name: z.string() })
      const MainSchema = z.object({ external: ExternalSchema, internal: InternalSchema })

      const result = zodToGql(
        { Internal: InternalSchema, Main: MainSchema },
        { types: new Map([[ExternalSchema, 'ExternalType']]) },
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

  describe('object unions', () => {
    it('generates GraphQL union declaration', () => {
      const DogSchema = z.object({ breed: z.string() })
      const CatSchema = z.object({ meows: z.boolean() })
      const PetUnion = z.union([DogSchema, CatSchema])

      const result = zodToGql({ Dog: DogSchema, Cat: CatSchema, Pet: PetUnion })

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
      const DogSchema = z.object({ breed: z.string() })
      const CatSchema = z.object({ meows: z.boolean() })
      const PetUnion = z.union([DogSchema, CatSchema])
      const OwnerSchema = z.object({ name: z.string(), pet: PetUnion })

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

  describe('strict mode', () => {
    it('throws for unregistered object field', () => {
      const UnregisteredSchema = z.object({ foo: z.string() })
      const MainSchema = z.object({ ref: UnregisteredSchema })

      assert.throws(
        () => zodToGql({ Main: MainSchema }, { strict: true }),
        /Strict mode: Field "ref" on type "Main" references an unregistered object schema/,
      )
    })

    it('throws for unregistered object in array', () => {
      const UnregisteredSchema = z.object({ foo: z.string() })
      const MainSchema = z.object({ items: z.array(UnregisteredSchema) })

      assert.throws(
        () => zodToGql({ Main: MainSchema }, { strict: true }),
        /Strict mode: Field "items" on type "Main" references an unregistered object schema/,
      )
    })

    it('falls back to JSON in non-strict mode', () => {
      const UnregisteredSchema = z.object({ foo: z.string() })
      const MainSchema = z.object({ ref: UnregisteredSchema })

      const result = zodToGql({ Main: MainSchema })

      assert.strictEqual(result, `type Main {\n  ref: JSON!\n}`)
    })
  })
})
