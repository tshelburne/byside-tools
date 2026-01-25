import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ensureDate } from './date.js'

describe('ensureDate', () => {
  it('should return Date as-is', () => {
    const date = new Date('2024-01-01')
    const result = ensureDate(date)
    assert.strictEqual(result, date)
  })

  it('should convert string to Date', () => {
    const result = ensureDate('2024-01-01')
    assert.ok(result instanceof Date)
    assert.strictEqual(result.toISOString(), new Date('2024-01-01').toISOString())
  })

  it('should return null when given null', () => {
    const result = ensureDate(null)
    assert.strictEqual(result, null)
  })

  it('should handle ISO string dates', () => {
    const isoString = '2024-01-15T10:30:00.000Z'
    const result = ensureDate(isoString)
    assert.ok(result instanceof Date)
    assert.strictEqual(result.toISOString(), isoString)
  })
})
