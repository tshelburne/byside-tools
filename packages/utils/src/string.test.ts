import { describe, it } from 'node:test'
import assert from 'node:assert'

import { titleCase } from './string.js'

describe('titleCase', () => {
  it('capitalizes single word', () => {
    assert.strictEqual(titleCase('male'), 'Male')
  })

  it('replaces underscores with spaces', () => {
    assert.strictEqual(titleCase('south_asian'), 'South Asian')
  })

  it('handles multiple underscores', () => {
    assert.strictEqual(titleCase('some_long_value'), 'Some Long Value')
  })

  it('preserves existing capitalization', () => {
    assert.strictEqual(titleCase('LOUD_VALUE'), 'LOUD VALUE')
  })

  it('returns empty string for empty input', () => {
    assert.strictEqual(titleCase(''), '')
  })
})
