import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createModel, openai, anthropic, ollama } from './models.js'

describe('createModel', () => {
  it('creates an openai model', () => {
    const model = createModel({ provider: 'openai', model: 'gpt-4o' })
    assert.ok(model)
    assert.strictEqual(typeof model, 'object')
  })

  it('creates an anthropic model', () => {
    const model = createModel({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-latest',
    })
    assert.ok(model)
    assert.strictEqual(typeof model, 'object')
  })

  it('creates an ollama model', () => {
    const model = createModel({ provider: 'ollama', model: 'mistral' })
    assert.ok(model)
    assert.strictEqual(typeof model, 'object')
  })
})

describe('provider helpers', () => {
  it('openai creates a model', () => {
    const model = openai('gpt-4o')
    assert.ok(model)
  })

  it('anthropic creates a model', () => {
    const model = anthropic('claude-3-5-sonnet-latest')
    assert.ok(model)
  })

  it('ollama creates a model', () => {
    const model = ollama('mistral')
    assert.ok(model)
  })
})
