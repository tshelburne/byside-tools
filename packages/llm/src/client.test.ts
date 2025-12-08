import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('generateText', () => {
  it('exports the function', async () => {
    const { generateText } = await import('./client.js')
    assert.ok(generateText)
    assert.strictEqual(typeof generateText, 'function')
  })
})

describe('generateObject', () => {
  it('exports the function', async () => {
    const { generateObject } = await import('./client.js')
    assert.ok(generateObject)
    assert.strictEqual(typeof generateObject, 'function')
  })
})
