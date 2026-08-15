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

    it('converts a Date to the default Date scalar', () => {
      const schema = z.object({ createdAt: z.date() })
      const result = zodToGql('Timestamps', schema)
      assert.strictEqual(result, `type Timestamps {\n  createdAt: Date!\n}`)
    })

    it('maps a Date through the scalars option (e.g. Datetime)', () => {
      const schema = z.object({ createdAt: z.date(), deletedAt: z.date().nullable() })
      const result = zodToGql('Timestamps', schema, { scalars: { date: 'Datetime' } })
      assert.strictEqual(
        result,
        `type Timestamps {\n  createdAt: Datetime!\n  deletedAt: Datetime\n}`,
      )
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

    it('peels nested wrapper chains so registered references resolve', () => {
      // Regression: `MySchema.nullable().optional()` is a chain
      // ZodOptional → ZodNullable → ZodObject. The single-step unwrap
      // returned ZodNullable from the field, which never matched the
      // registered schema in the types map → fell back to JSON/String.
      const Inner = z.object({ x: z.string() })
      const Outer = z.object({
        a: Inner.nullable().optional(),
        b: Inner.optional().nullable(),
        c: Inner.nullable(),
        d: Inner.optional(),
      })
      const result = zodToGql({ Inner, Outer })
      assert.strictEqual(
        result,
        `type Inner {
  x: String!
}

type Outer {
  a: Inner
  b: Inner
  c: Inner
  d: Inner
}`,
      )
    })

    it('peels default + optional chains', () => {
      const Inner = z.object({ y: z.string() })
      const Outer = z.object({
        ref: Inner.default({ y: 'hi' }).optional(),
      })
      const result = zodToGql({ Inner, Outer })
      assert.strictEqual(
        result,
        `type Inner {
  y: String!
}

type Outer {
  ref: Inner
}`,
      )
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

  describe('discriminated unions', () => {
    it('synthesises member types from inline discriminated union', () => {
      // Common pattern: discriminated union members are inline objects
      // that aren't exported individually. Without this, callers had to
      // hand-author the SDL because the generator threw.
      const Event = z.discriminatedUnion('event', [
        z.object({ event: z.literal('session_start'), stamp: z.string() }),
        z.object({ event: z.literal('session_end'), stamp: z.string() }),
        z.object({ event: z.literal('web_navigation'), stamp: z.string(), url: z.string() }),
      ])

      const result = zodToGql({ Event })
      assert.strictEqual(
        result,
        `type EventSessionStart {
  event: String!
  stamp: String!
}

type EventSessionEnd {
  event: String!
  stamp: String!
}

type EventWebNavigation {
  event: String!
  stamp: String!
  url: String!
}

union Event = EventSessionStart | EventSessionEnd | EventWebNavigation`,
      )
    })

    it('reuses registered names for explicitly-named members', () => {
      const Start = z.object({ event: z.literal('start'), at: z.string() })
      const End = z.object({ event: z.literal('end'), at: z.string() })
      const Event = z.discriminatedUnion('event', [Start, End])

      const result = zodToGql({ Start, End, Event })
      // No synthesised types — the existing names are reused in the union.
      assert.strictEqual(
        result,
        `type Start {
  event: String!
  at: String!
}

type End {
  event: String!
  at: String!
}

union Event = Start | End`,
      )
    })

    it('resolves discriminated union as field type in another schema', () => {
      const Event = z.discriminatedUnion('event', [
        z.object({ event: z.literal('a'), x: z.string() }),
        z.object({ event: z.literal('b'), y: z.number() }),
      ])
      const Container = z.object({ items: z.array(Event) })

      const result = zodToGql({ Event, Container })
      // Field type resolves to the union name, members are synthesised once.
      assert.match(result, /union Event = EventA \| EventB/)
      assert.match(result, /items: \[Event!\]!/)
    })

    it('handles snake_case discriminator literals via PascalCase', () => {
      const U = z.discriminatedUnion('type', [
        z.object({ type: z.literal('credit_card'), last4: z.string() }),
        z.object({ type: z.literal('bank_transfer'), routing: z.string() }),
      ])
      const result = zodToGql({ Payment: U })
      assert.match(result, /type PaymentCreditCard \{/)
      assert.match(result, /type PaymentBankTransfer \{/)
      assert.match(result, /union Payment = PaymentCreditCard \| PaymentBankTransfer/)
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

  describe('input types (io: "input")', () => {
    it('emits `input` rather than `type`', () => {
      const Schema = z.object({ name: z.string(), count: z.number().int() })

      assert.strictEqual(
        zodToGql('OrderInput', Schema, { io: 'input' }),
        `input OrderInput {\n  name: String!\n  count: Int!\n}`,
      )
    })

    it('leaves output mode untouched', () => {
      const Schema = z.object({ name: z.string() })

      assert.match(zodToGql('Order', Schema), /^type Order \{/)
    })

    it('merges a union into one input, since GraphQL has no input unions', () => {
      // A reference-or-create: two shapes, one field.
      const Schema = z.union([
        z.object({ id: z.string().uuid() }),
        z.object({ card: z.string(), postcode: z.string().nullable() }),
      ])

      assert.strictEqual(
        zodToGql('PaymentInput', Schema, { io: 'input' }),
        `input PaymentInput {\n  id: UUID\n  card: String\n  postcode: String\n}`,
      )
    })

    it('requires only the fields every member requires', () => {
      // `kind` is in both and required in both; `a` and `b` are in one each.
      const Schema = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('one'), a: z.number().int() }),
        z.object({ kind: z.literal('two'), b: z.number().int() }),
      ])

      const result = zodToGql('ThingInput', Schema, { io: 'input' })

      // Requiring a non-shared field would make the other branch unsendable.
      assert.match(result, /\n {2}kind: String!\n/)
      assert.match(result, /\n {2}a: Int\n/)
      assert.match(result, /\n {2}b: Int\n/)
    })

    it('keeps a shared field required only if it is required in every member', () => {
      const Schema = z.union([
        z.object({ note: z.string() }),
        z.object({ note: z.string().optional() }),
      ])

      // Present in both, optional in one — so optional on the wire.
      assert.strictEqual(
        zodToGql('NoteInput', Schema, { io: 'input' }),
        `input NoteInput {\n  note: String\n}`,
      )
    })

    it('renders a discriminant as String so its value survives unchanged', () => {
      // Enum values are uppercased by default, which would break a discriminant
      // the schema matches with a literal.
      const Schema = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('weighted_reps'), reps: z.number().int() }),
        z.object({ kind: z.literal('bodyweight_reps'), reps: z.number().int() }),
      ])

      const result = zodToGql('MeasurementInput', Schema, { io: 'input' })

      assert.match(result, /kind: String!/)
      assert.doesNotMatch(result, /WEIGHTED_REPS/)
    })

    it('merges a discriminated union into ONE input, not a union plus members', () => {
      // The output-mode rendering is a `union` declaration and a block per
      // member. Neither is legal for an input, and emitting them is the bug
      // that reads as correct.
      const Schema = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('a'), x: z.string() }),
        z.object({ kind: z.literal('b'), y: z.string() }),
      ])

      const result = zodToGql('ThingInput', Schema, { io: 'input' })

      assert.doesNotMatch(result, /union /)
      assert.strictEqual(result.match(/input /g)?.length, 1)
    })

    it('round-trips: what the input accepts, the schema parses', () => {
      // The claim the merge rests on — the wire shape IS the schema's shape,
      // so nothing hand-written sits between a client and `parse`.
      const Schema = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('gbp'), pence: z.number().int() }),
        z.object({ kind: z.literal('usd'), cents: z.number().int() }),
      ])

      assert.deepStrictEqual(Schema.parse({ kind: 'gbp', pence: 500 }), {
        kind: 'gbp',
        pence: 500,
      })
      // And the looseness the merge introduces is the schema's to reject.
      assert.throws(() => Schema.parse({ kind: 'gbp', cents: 500 }))
    })
  })

  describe('registered types and `.describe()`', () => {
    it('matches a described clone of a registered schema', () => {
      // `.describe()` returns a clone sharing its def, and describing a
      // reference at its use site is the idiomatic spelling — so identity alone
      // made the map miss exactly where it is most used.
      const Ref = z.object({ id: z.string() })
      const Main = z.object({ ref: Ref.describe('the thing') })

      assert.strictEqual(
        zodToGql('Main', Main, { types: new Map([[Ref, 'RefType']]) }),
        `type Main {\n  ref: RefType!\n}`,
      )
    })

    it('still matches the plain registered schema', () => {
      const Ref = z.object({ id: z.string() })
      const Main = z.object({ ref: Ref })

      assert.strictEqual(
        zodToGql('Main', Main, { types: new Map([[Ref, 'RefType']]) }),
        `type Main {\n  ref: RefType!\n}`,
      )
    })

    it('matches through a described clone in input mode too', () => {
      const Ref = z.object({ id: z.string() })
      const Main = z.object({ ref: Ref.describe('the thing') })

      assert.strictEqual(
        zodToGql('MainInput', Main, { types: new Map([[Ref, 'RefInput']]), io: 'input' }),
        `input MainInput {\n  ref: RefInput!\n}`,
      )
    })

    it('an unregistered schema still falls back rather than matching by shape', () => {
      // Two structurally identical schemas are still two schemas; matching on
      // the shared def must not become structural matching.
      const Ref = z.object({ id: z.string() })
      const Other = z.object({ id: z.string() })
      const Main = z.object({ ref: Other })

      assert.strictEqual(
        zodToGql('Main', Main, { types: new Map([[Ref, 'RefType']]) }),
        `type Main {\n  ref: JSON!\n}`,
      )
    })
  })

  describe('zod 4 top-level formats', () => {
    /**
     * Every format has two spellings, and they store the format in different
     * places — a check for `z.string().uuid()`, the def's own `format` for
     * `z.uuid()`. Only the first was read, and `z.string().uuid()` is the
     * deprecated half of the pair, so the spelling that worked was the one
     * people are migrating away from.
     *
     * Both spellings for each, because the failure is that one of them looks
     * fine on its own.
     */
    const cases: Array<[string, z.ZodTypeAny, z.ZodTypeAny, string]> = [
      ['uuid', z.uuid(), z.string().uuid(), 'UUID'],
      ['datetime', z.iso.datetime(), z.string().datetime(), 'Datetime'],
      ['int', z.int(), z.number().int(), 'Int'],
    ]

    for (const [name, topLevel, chained, expected] of cases) {
      it(`${name}: both spellings resolve to ${expected}`, () => {
        assert.strictEqual(
          zodToGql('A', z.object({ f: topLevel })),
          `type A {\n  f: ${expected}!\n}`,
          `top-level spelling of ${name}`,
        )
        assert.strictEqual(
          zodToGql('A', z.object({ f: chained })),
          `type A {\n  f: ${expected}!\n}`,
          `chained spelling of ${name}`,
        )
      })
    }

    it('resolves z.iso.date(), which never had a chained equivalent here', () => {
      assert.strictEqual(
        zodToGql('A', z.object({ f: z.iso.date() })),
        `type A {\n  f: Date!\n}`,
      )
    })

    it('lets a caller name a scalar for any format', () => {
      // The format name is looked up rather than branched on, so a server that
      // publishes an Email scalar gets it without this package knowing.
      assert.strictEqual(
        zodToGql('A', z.object({ f: z.email() }), { scalars: { email: 'Email' } }),
        `type A {\n  f: Email!\n}`,
      )
    })

    it('falls back to String for a format with no declared scalar', () => {
      assert.strictEqual(zodToGql('A', z.object({ f: z.email() })), `type A {\n  f: String!\n}`)
    })

    it('finds a format behind other checks', () => {
      // The format is not necessarily the first check.
      assert.strictEqual(
        zodToGql('A', z.object({ f: z.string().min(1).uuid() })),
        `type A {\n  f: UUID!\n}`,
      )
    })

    it('leaves a plain string and a plain number alone', () => {
      assert.strictEqual(
        zodToGql('A', z.object({ s: z.string().min(1), n: z.number().positive() })),
        `type A {\n  s: String!\n  n: Float!\n}`,
      )
    })
  })
})
