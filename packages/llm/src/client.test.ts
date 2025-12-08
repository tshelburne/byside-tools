import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import type { LanguageModel } from 'ai'

const mockGenerateText = mock.fn()
const mockGenerateObject = mock.fn()

mock.module('ai', {
  namedExports: {
    generateText: mockGenerateText,
    generateObject: mockGenerateObject,
  },
})

const { generateText, generateObject } = await import('./client.js')

describe('generateText', () => {
  beforeEach(() => {
    mockGenerateText.mock.resetCalls()
  })

  it('returns content and usage from AI response', async () => {
    mockGenerateText.mock.mockImplementation(async () => ({
      text: 'Hello from AI',
      usage: { inputTokens: 10, outputTokens: 5 },
      response: { modelId: 'test-model' },
    }))

    const result = await generateText({
      model: {} as LanguageModel,
      system: 'You are helpful',
      prompt: 'Say hello',
    })

    assert.strictEqual(result.content, 'Hello from AI')
    assert.strictEqual(result.usage.inputTokens, 10)
    assert.strictEqual(result.usage.outputTokens, 5)
    assert.strictEqual(result.usage.model, 'test-model')
    assert.ok(result.usage.latencyMs >= 0)
    assert.strictEqual(result.usage.promptHash.length, 64)
  })

  it('passes text-only message when no image provided', async () => {
    mockGenerateText.mock.mockImplementation(async () => ({
      text: 'response',
      usage: { inputTokens: 1, outputTokens: 1 },
      response: { modelId: 'test' },
    }))

    await generateText({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'hello',
    })

    const call = mockGenerateText.mock.calls[0]
    const opts = call?.arguments[0] as Record<string, unknown>
    const messages = opts.messages as Array<{ role: string; content: unknown }>

    assert.strictEqual(messages.length, 1)
    assert.strictEqual(messages[0]?.role, 'user')
    assert.strictEqual(messages[0]?.content, 'hello')
  })

  it('passes multipart message when image provided', async () => {
    mockGenerateText.mock.mockImplementation(async () => ({
      text: 'response',
      usage: { inputTokens: 1, outputTokens: 1 },
      response: { modelId: 'test' },
    }))

    const imageBase64 = 'iVBORw0KGgoAAAANSUhEUg'
    await generateText({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'describe this',
      imageBase64,
    })

    const call = mockGenerateText.mock.calls[0]
    const opts = call?.arguments[0] as Record<string, unknown>
    const messages = opts.messages as Array<{ role: string; content: unknown }>

    assert.strictEqual(messages.length, 1)
    assert.strictEqual(messages[0]?.role, 'user')
    assert.ok(Array.isArray(messages[0]?.content))

    const content = messages[0]?.content as Array<{ type: string; text?: string; image?: string }>
    assert.deepStrictEqual(content[0], { type: 'text', text: 'describe this' })
    assert.deepStrictEqual(content[1], { type: 'image', image: imageBase64 })
  })

  it('handles missing usage tokens gracefully', async () => {
    mockGenerateText.mock.mockImplementation(async () => ({
      text: 'response',
      usage: {},
      response: { modelId: 'test' },
    }))

    const result = await generateText({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'hello',
    })

    assert.strictEqual(result.usage.inputTokens, 0)
    assert.strictEqual(result.usage.outputTokens, 0)
  })

  it('handles missing modelId gracefully', async () => {
    mockGenerateText.mock.mockImplementation(async () => ({
      text: 'response',
      usage: { inputTokens: 1, outputTokens: 1 },
      response: {},
    }))

    const result = await generateText({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'hello',
    })

    assert.strictEqual(result.usage.model, 'unknown')
  })
})

describe('generateObject', () => {
  beforeEach(() => {
    mockGenerateObject.mock.resetCalls()
  })

  it('returns typed content and usage from AI response', async () => {
    mockGenerateObject.mock.mockImplementation(async () => ({
      object: { name: 'Test', count: 42 },
      usage: { inputTokens: 15, outputTokens: 8 },
      response: { modelId: 'test-model-obj' },
    }))

    const schema = z.object({ name: z.string(), count: z.number() })
    const result = await generateObject({
      model: {} as LanguageModel,
      system: 'Extract data',
      prompt: 'Get the info',
      schema,
    })

    assert.deepStrictEqual(result.content, { name: 'Test', count: 42 })
    assert.strictEqual(result.usage.inputTokens, 15)
    assert.strictEqual(result.usage.outputTokens, 8)
    assert.strictEqual(result.usage.model, 'test-model-obj')
    assert.ok(result.usage.latencyMs >= 0)
    assert.strictEqual(result.usage.promptHash.length, 64)
  })

  it('passes schema to AI SDK', async () => {
    mockGenerateObject.mock.mockImplementation(async () => ({
      object: { value: 1 },
      usage: { inputTokens: 1, outputTokens: 1 },
      response: { modelId: 'test' },
    }))

    const schema = z.object({ value: z.number() })
    await generateObject({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'prompt',
      schema,
    })

    const call = mockGenerateObject.mock.calls[0]
    const opts = call?.arguments[0] as Record<string, unknown>

    assert.strictEqual(opts.schema, schema)
  })

  it('passes multipart message when image provided', async () => {
    mockGenerateObject.mock.mockImplementation(async () => ({
      object: { value: 1 },
      usage: { inputTokens: 1, outputTokens: 1 },
      response: { modelId: 'test' },
    }))

    const imageBase64 = 'abc123'
    await generateObject({
      model: {} as LanguageModel,
      system: 'system',
      prompt: 'extract from image',
      schema: z.object({ value: z.number() }),
      imageBase64,
    })

    const call = mockGenerateObject.mock.calls[0]
    const opts = call?.arguments[0] as Record<string, unknown>
    const messages = opts.messages as Array<{ role: string; content: unknown }>
    const content = messages[0]?.content as Array<{ type: string; text?: string; image?: string }>

    assert.deepStrictEqual(content[1], { type: 'image', image: imageBase64 })
  })
})
