import { describe, test } from 'node:test'
import assert from 'node:assert'
import { JSDOM } from 'jsdom'
import { waitForElement } from './browser.js'

describe('waitForElement', () => {
  function createDomWithGlobals(html: string) {
    const dom = new JSDOM(html)
    global.MutationObserver = dom.window.MutationObserver
    return dom
  }

  test('resolves immediately if element exists', async () => {
    const html = '<div id="target">Hello</div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const [element] = await waitForElement(doc, '#target')

    assert.ok(element, 'should return the element')
    assert.strictEqual(
      element.textContent,
      'Hello',
      'should be the correct element',
    )
  })

  test('waits for element to appear via appendChild', async () => {
    const html = '<div id="container"></div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const waitPromise = waitForElement(doc, '#target')

    setTimeout(() => {
      const container = doc.getElementById('container')
      const target = doc.createElement('div')
      target.id = 'target'
      target.textContent = 'Appeared'
      container?.appendChild(target)
    }, 10)

    const [element] = await waitPromise

    assert.ok(element, 'should resolve when element appears')
    assert.strictEqual(
      element.textContent,
      'Appeared',
      'should be the correct element',
    )
  })

  test('waits for deeply nested element', async () => {
    const html = '<div id="root"><div id="level1"></div></div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const waitPromise = waitForElement(doc, '#target')

    setTimeout(() => {
      const level1 = doc.getElementById('level1')
      const level2 = doc.createElement('div')
      level2.id = 'level2'
      level1?.appendChild(level2)

      const target = doc.createElement('div')
      target.id = 'target'
      level2.appendChild(target)
    }, 10)

    const [element] = await waitPromise

    assert.ok(element, 'should find deeply nested element')
    assert.strictEqual(element.id, 'target')
  })

  test('works with class selectors', async () => {
    const html = '<div id="container"></div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const waitPromise = waitForElement(doc, '.my-class')

    setTimeout(() => {
      const element = doc.createElement('div')
      element.className = 'my-class'
      doc.getElementById('container')?.appendChild(element)
    }, 10)

    const [element] = await waitPromise

    assert.ok(element, 'should find element by class')
    assert.ok(element.classList.contains('my-class'))
  })

  test('works with attribute selectors', async () => {
    const html = '<div id="container"></div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const waitPromise = waitForElement(doc, '[data-role="button"]')

    setTimeout(() => {
      const element = doc.createElement('button')
      element.setAttribute('data-role', 'button')
      doc.getElementById('container')?.appendChild(element)
    }, 10)

    const [element] = await waitPromise

    assert.ok(element, 'should find element by attribute')
    assert.strictEqual(element.getAttribute('data-role'), 'button')
  })

  test('works with complex selectors', async () => {
    const html = '<div id="container"><ul id="list"></ul></div>'
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const waitPromise = waitForElement(doc, 'ul > li.active')

    setTimeout(() => {
      const list = doc.getElementById('list')
      const li = doc.createElement('li')
      li.className = 'active'
      li.textContent = 'Item'
      list?.appendChild(li)
    }, 10)

    const [element] = await waitPromise

    assert.ok(element, 'should find element with complex selector')
    assert.strictEqual(element.tagName, 'LI')
    assert.ok(element.classList.contains('active'))
  })

  test('returns all matching elements', async () => {
    const html = `
      <div class="item">Item 1</div>
      <div class="item">Item 2</div>
      <div class="item">Item 3</div>
    `
    const dom = createDomWithGlobals(html)
    const doc = dom.window.document

    const elements = await waitForElement(doc, '.item')

    assert.strictEqual(elements.length, 3)
    assert.strictEqual(elements[0]?.textContent, 'Item 1')
    assert.strictEqual(elements[1]?.textContent, 'Item 2')
    assert.strictEqual(elements[2]?.textContent, 'Item 3')
  })
})
