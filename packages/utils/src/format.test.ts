import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatDate,
  formatDuration,
  formatPhone,
} from './format.js'

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    assert.strictEqual(formatNumber(1234567.89), '1,234,567.89')
  })

  it('formats with specified decimals', () => {
    assert.strictEqual(formatNumber(1234.5, { decimals: 2 }), '1,234.50')
  })

  it('formats integers', () => {
    assert.strictEqual(formatNumber(1000), '1,000')
  })
})

describe('formatCurrency', () => {
  it('formats as USD by default', () => {
    assert.strictEqual(formatCurrency(1234.5), '$1,234.50')
  })

  it('formats with custom currency', () => {
    const result = formatCurrency(1234.5, { currency: 'EUR', locale: 'de-DE' })
    assert.ok(result.includes('1.234,50'), `Expected EUR format, got ${result}`)
  })

  it('formats with custom decimals', () => {
    assert.strictEqual(formatCurrency(1234.567, { decimals: 0 }), '$1,235')
  })
})

describe('formatPercent', () => {
  it('formats decimal as percent', () => {
    assert.strictEqual(formatPercent(0.125), '12.5%')
  })

  it('formats with alreadyPercent option', () => {
    assert.strictEqual(formatPercent(12.5, { alreadyPercent: true }), '12.5%')
  })

  it('formats with custom decimals', () => {
    assert.strictEqual(formatPercent(0.12345, { decimals: 2 }), '12.35%')
  })
})

describe('formatBytes', () => {
  it('formats bytes', () => {
    assert.strictEqual(formatBytes(500), '500 Bytes')
  })

  it('formats kilobytes', () => {
    assert.strictEqual(formatBytes(1024), '1 KB')
  })

  it('formats megabytes', () => {
    assert.strictEqual(formatBytes(1234567), '1.18 MB')
  })

  it('formats gigabytes', () => {
    assert.strictEqual(formatBytes(1073741824), '1 GB')
  })

  it('handles zero', () => {
    assert.strictEqual(formatBytes(0), '0 Bytes')
  })
})

describe('formatDate', () => {
  it('formats with medium style by default', () => {
    const date = new Date(2024, 11, 8) // Dec 8, 2024 in local time
    const result = formatDate(date)
    assert.ok(
      result.includes('Dec') && result.includes('8'),
      `Expected medium format, got ${result}`,
    )
  })

  it('formats with iso style', () => {
    const date = new Date('2024-12-08T12:00:00Z')
    assert.strictEqual(formatDate(date, { style: 'iso' }), '2024-12-08')
  })

  it('formats iso with time', () => {
    const date = new Date('2024-12-08T12:30:45.000Z')
    const result = formatDate(date, { style: 'iso', includeTime: true })
    assert.ok(result.includes('2024-12-08') && result.includes('12:30:45'), `Got ${result}`)
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => {
    assert.strictEqual(formatDuration(5000), '5s')
  })

  it('formats minutes and seconds', () => {
    assert.strictEqual(formatDuration(65000), '1m 5s')
  })

  it('formats hours, minutes, seconds', () => {
    assert.strictEqual(formatDuration(3661000), '1h 1m 1s')
  })

  it('formats days', () => {
    assert.strictEqual(formatDuration(86400000 + 3600000), '1d 1h')
  })

  it('handles zero', () => {
    assert.strictEqual(formatDuration(0), '0s')
  })
})

describe('formatPhone', () => {
  it('formats 10-digit US number', () => {
    assert.strictEqual(formatPhone('5551234567'), '(555) 123-4567')
  })

  it('formats 11-digit US number with country code', () => {
    assert.strictEqual(formatPhone('15551234567'), '+1 (555) 123-4567')
  })

  it('strips non-digits', () => {
    assert.strictEqual(formatPhone('555-123-4567'), '(555) 123-4567')
  })

  it('returns original for invalid format', () => {
    assert.strictEqual(formatPhone('12345'), '12345')
  })
})
