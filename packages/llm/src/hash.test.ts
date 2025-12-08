import { describe, it } from 'node:test'
import assert from 'node:assert'
import { hashPrompt } from './hash.js'

describe('hashPrompt', () => {
  it('produces a consistent hash for the same input', () => {
    const hash1 = hashPrompt('system prompt', 'user prompt')
    const hash2 = hashPrompt('system prompt', 'user prompt')
    assert.strictEqual(hash1, hash2)
  })

  it('produces different hashes for different inputs', () => {
    const hash1 = hashPrompt('system prompt', 'user prompt')
    const hash2 = hashPrompt('different system', 'user prompt')
    assert.notStrictEqual(hash1, hash2)
  })

  it('produces a 64-character hex string (SHA-256)', () => {
    const hash = hashPrompt('system', 'user')
    assert.strictEqual(hash.length, 64)
    assert.match(hash, /^[a-f0-9]+$/)
  })

  it('handles empty strings', () => {
    const hash = hashPrompt('', '')
    assert.strictEqual(hash.length, 64)
  })

  it('handles unicode characters', () => {
    const hash = hashPrompt('システム', '用户提示')
    assert.strictEqual(hash.length, 64)
  })
})
