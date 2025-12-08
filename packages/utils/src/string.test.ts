import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  titleCase,
  capitalize,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
  truncate,
  pluralize,
} from './string.js'

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

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    assert.strictEqual(capitalize('hello'), 'Hello')
  })

  it('leaves rest of string unchanged', () => {
    assert.strictEqual(capitalize('hello world'), 'Hello world')
  })

  it('handles empty string', () => {
    assert.strictEqual(capitalize(''), '')
  })

  it('handles single character', () => {
    assert.strictEqual(capitalize('a'), 'A')
  })
})

describe('camelCase', () => {
  it('converts snake_case', () => {
    assert.strictEqual(camelCase('hello_world'), 'helloWorld')
  })

  it('converts kebab-case', () => {
    assert.strictEqual(camelCase('hello-world'), 'helloWorld')
  })

  it('converts space separated', () => {
    assert.strictEqual(camelCase('Hello World'), 'helloWorld')
  })

  it('converts PascalCase', () => {
    assert.strictEqual(camelCase('HelloWorld'), 'helloWorld')
  })

  it('handles empty string', () => {
    assert.strictEqual(camelCase(''), '')
  })
})

describe('pascalCase', () => {
  it('converts snake_case', () => {
    assert.strictEqual(pascalCase('hello_world'), 'HelloWorld')
  })

  it('converts kebab-case', () => {
    assert.strictEqual(pascalCase('hello-world'), 'HelloWorld')
  })

  it('converts camelCase', () => {
    assert.strictEqual(pascalCase('helloWorld'), 'HelloWorld')
  })
})

describe('snakeCase', () => {
  it('converts camelCase', () => {
    assert.strictEqual(snakeCase('helloWorld'), 'hello_world')
  })

  it('converts PascalCase', () => {
    assert.strictEqual(snakeCase('HelloWorld'), 'hello_world')
  })

  it('converts space separated', () => {
    assert.strictEqual(snakeCase('Hello World'), 'hello_world')
  })

  it('converts kebab-case', () => {
    assert.strictEqual(snakeCase('hello-world'), 'hello_world')
  })
})

describe('kebabCase', () => {
  it('converts camelCase', () => {
    assert.strictEqual(kebabCase('helloWorld'), 'hello-world')
  })

  it('converts PascalCase', () => {
    assert.strictEqual(kebabCase('HelloWorld'), 'hello-world')
  })

  it('converts snake_case', () => {
    assert.strictEqual(kebabCase('hello_world'), 'hello-world')
  })
})

describe('constantCase', () => {
  it('converts camelCase', () => {
    assert.strictEqual(constantCase('helloWorld'), 'HELLO_WORLD')
  })

  it('converts space separated', () => {
    assert.strictEqual(constantCase('hello world'), 'HELLO_WORLD')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    assert.strictEqual(truncate('hello world', 8), 'hello...')
  })

  it('leaves short strings unchanged', () => {
    assert.strictEqual(truncate('hello', 10), 'hello')
  })

  it('uses custom suffix', () => {
    assert.strictEqual(truncate('hello world', 8, '…'), 'hello w…')
  })

  it('handles exact length', () => {
    assert.strictEqual(truncate('hello', 5), 'hello')
  })
})

describe('pluralize', () => {
  it('returns singular for count of 1', () => {
    assert.strictEqual(pluralize(1, 'item'), 'item')
  })

  it('returns plural for count > 1', () => {
    assert.strictEqual(pluralize(5, 'item'), 'items')
  })

  it('returns plural for count of 0', () => {
    assert.strictEqual(pluralize(0, 'item'), 'items')
  })

  it('uses custom plural form', () => {
    assert.strictEqual(pluralize(2, 'person', 'people'), 'people')
  })

  it('uses custom plural for count of 1', () => {
    assert.strictEqual(pluralize(1, 'person', 'people'), 'person')
  })
})
