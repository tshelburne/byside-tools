/// <reference types="@types/chrome" />
import { describe, it, mock, beforeEach, type Mock } from 'node:test'
import * as assert from 'node:assert/strict'
import { defineMessaging, type MessageResult } from './messaging.js'

// ============================================================================
// Type Safety Tests - these @ts-expect-error comments verify type constraints
// Wrapped in a never-called function so they don't execute at runtime
// ============================================================================

function _typeTests() {
  const typeTest = defineMessaging({
    background: {
      withPayload(req: { id: number }, _sender) {
        return { result: req.id }
      },
      noPayload(_req: void, _sender) {
        return { ok: true }
      },
    },
    content: {
      contentAction(req: { name: string }, _sender) {
        return { greeting: `Hello ${req.name}` }
      },
    },
  })

  // --- Action name must be valid ---
  // @ts-expect-error - 'invalidAction' is not a valid action name
  void typeTest.background.send('invalidAction')

  // @ts-expect-error - 'invalidAction' is not a valid action name
  void typeTest.content.send(1, 'invalidAction')

  // --- Request payload type must match ---
  // @ts-expect-error - payload should be { id: number }, not { id: string }
  void typeTest.background.send('withPayload', { id: 'wrong' })

  // @ts-expect-error - payload should be { id: number }, not { name: string }
  void typeTest.background.send('withPayload', { name: 'wrong' })

  // @ts-expect-error - payload should be { name: string }, not { id: number }
  void typeTest.content.send(1, 'contentAction', { id: 123 })

  // --- Required payload must be provided ---
  // @ts-expect-error - 'withPayload' requires a payload
  void typeTest.background.send('withPayload')

  // --- Void payload should not accept arguments ---
  // @ts-expect-error - 'noPayload' takes void, should not accept payload
  void typeTest.background.send('noPayload', { extra: 'data' })

  // --- These should all compile fine (no errors) ---
  void typeTest.background.send('withPayload', { id: 123 })
  void typeTest.background.send('noPayload')
  void typeTest.content.send(1, 'contentAction', { name: 'Tim' })

  // --- request() should have same type constraints as send() ---
  // @ts-expect-error - 'invalidAction' is not a valid action name
  void typeTest.background.request('invalidAction')

  // @ts-expect-error - payload should be { id: number }, not { id: string }
  void typeTest.background.request('withPayload', { id: 'wrong' })

  // @ts-expect-error - 'withPayload' requires a payload
  void typeTest.background.request('withPayload')

  // @ts-expect-error - 'invalidAction' is not a valid action name for content
  void typeTest.content.request(1, 'invalidAction')

  // --- These request() calls should compile fine ---
  void typeTest.background.request('withPayload', { id: 123 })
  void typeTest.background.request('noPayload')
  void typeTest.content.request(1, 'contentAction', { name: 'Tim' })

  // --- listen() should exist and be callable ---
  typeTest.background.listen()
  typeTest.background.listen({ onRequest: () => {} })
  typeTest.content.listen()
  typeTest.content.listen({ onResponse: () => {} })
}
void _typeTests // Suppress unused warning

// ============================================================================

// Mock Chrome APIs
type Listener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | void

type SendMessageFn = (msg: object) => Promise<MessageResult<unknown>>
type TabSendMessageFn = (tabId: number, msg: object) => Promise<MessageResult<unknown>>
type AddListenerFn = (listener: Listener) => void

const mockChrome = {
  runtime: {
    sendMessage: mock.fn() as Mock<SendMessageFn>,
    onMessage: {
      addListener: mock.fn() as Mock<AddListenerFn>,
    },
  },
  tabs: {
    sendMessage: mock.fn() as Mock<TabSendMessageFn>,
  },
}

// @ts-expect-error - mocking global chrome
globalThis.chrome = mockChrome

beforeEach(() => {
  mockChrome.runtime.sendMessage.mock.resetCalls()
  mockChrome.runtime.onMessage.addListener.mock.resetCalls()
  mockChrome.tabs.sendMessage.mock.resetCalls()
})

/** Get first call from mock, asserting it exists */
function firstCall<T extends (...args: never[]) => unknown>(m: Mock<T>) {
  const call = m.mock.calls[0]
  if (!call) throw new Error('Expected at least one call')
  return call
}

/** Get the registered listener from addListener mock */
function getListener(): Listener {
  return firstCall(mockChrome.runtime.onMessage.addListener).arguments[0]
}

// Test message handlers
const { background, content } = defineMessaging({
  background: {
    async gql(req: { query: string; variables?: unknown }, _sender) {
      return { data: { result: req.query } }
    },
    info(_req: void, sender) {
      return { version: '1.0.0', tabId: sender.tab?.id }
    },
  },
  content: {
    html(_req: void, _sender) {
      return { html: '<html></html>' }
    },
    highlight(_req: { selector: string }, _sender) {
      return undefined
    },
  },
})

describe('defineMessaging', () => {
  it('returns background and content context objects with all methods', () => {
    assert.equal(typeof background.send, 'function')
    assert.equal(typeof background.request, 'function')
    assert.equal(typeof background.onMessage, 'function')
    assert.equal(typeof background.listen, 'function')
    assert.equal(typeof content.send, 'function')
    assert.equal(typeof content.request, 'function')
    assert.equal(typeof content.onMessage, 'function')
    assert.equal(typeof content.listen, 'function')
  })

  it('request is an alias for send', () => {
    assert.equal(background.request, background.send)
    assert.equal(content.request, content.send)
  })

  it('listen is an alias for onMessage', () => {
    assert.equal(background.listen, background.onMessage)
    assert.equal(content.listen, content.onMessage)
  })
})

describe('background.send (to background)', () => {
  it('sends message with action and payload', async () => {
    mockChrome.runtime.sendMessage.mock.mockImplementation(() =>
      Promise.resolve({ success: true, data: { data: {} } }),
    )

    await background.send('gql', { query: 'query { users }', variables: { id: 1 } })

    assert.equal(mockChrome.runtime.sendMessage.mock.calls.length, 1)
    assert.deepEqual(firstCall(mockChrome.runtime.sendMessage).arguments, [
      { action: 'gql', query: 'query { users }', variables: { id: 1 } },
    ])
  })

  it('sends message with only action for void request', async () => {
    mockChrome.runtime.sendMessage.mock.mockImplementation(() =>
      Promise.resolve({ success: true, data: { version: '1.0.0' } }),
    )

    await background.send('info')

    assert.equal(mockChrome.runtime.sendMessage.mock.calls.length, 1)
    assert.deepEqual(firstCall(mockChrome.runtime.sendMessage).arguments, [{ action: 'info' }])
  })

  it('returns the chrome.runtime.sendMessage result', async () => {
    const expectedResult = { success: true as const, data: { version: '1.0.0', tabId: 1 } }
    mockChrome.runtime.sendMessage.mock.mockImplementation(() => Promise.resolve(expectedResult))

    const result = await background.send('info')

    assert.deepEqual(result, expectedResult)
  })
})

describe('content.send (to content)', () => {
  it('sends message to specific tab with action and payload', async () => {
    mockChrome.tabs.sendMessage.mock.mockImplementation(() =>
      Promise.resolve({ success: true, data: undefined }),
    )

    await content.send(123, 'highlight', { selector: '.target' })

    assert.equal(mockChrome.tabs.sendMessage.mock.calls.length, 1)
    assert.deepEqual(firstCall(mockChrome.tabs.sendMessage).arguments, [
      123,
      { action: 'highlight', selector: '.target' },
    ])
  })

  it('sends message with only action for void request', async () => {
    mockChrome.tabs.sendMessage.mock.mockImplementation(() =>
      Promise.resolve({ success: true, data: { html: '<html></html>' } }),
    )

    await content.send(456, 'html')

    assert.equal(mockChrome.tabs.sendMessage.mock.calls.length, 1)
    assert.deepEqual(firstCall(mockChrome.tabs.sendMessage).arguments, [456, { action: 'html' }])
  })
})

describe('background.onMessage', () => {
  it('registers a listener with chrome.runtime.onMessage', () => {
    background.onMessage()

    assert.equal(mockChrome.runtime.onMessage.addListener.mock.calls.length, 1)
  })

  it('ignores messages with non-matching action', () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    background.onMessage()

    const listener = getListener()
    const result = listener({ action: 'unknownAction' }, {}, () => {})

    assert.equal(result, false)
  })

  it('calls handler for matching action and wraps success response', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    background.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()
    const message = { action: 'gql', query: 'query { users }' }
    const sender = { tab: { id: 1 } } as chrome.runtime.MessageSender

    const result = listener(message, sender, sendResponse)

    assert.equal(result, true) // Keep channel open for async

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(sendResponse.mock.calls.length, 1)
    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: true, data: { data: { result: 'query { users }' } } },
    ])
  })

  it('passes sender to handler', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    background.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()
    const message = { action: 'info' }
    const sender = { tab: { id: 42 } } as chrome.runtime.MessageSender

    listener(message, sender, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: true, data: { version: '1.0.0', tabId: 42 } },
    ])
  })

  it('wraps error response when handler throws Error', async () => {
    const { background: bgWithError } = defineMessaging({
      background: {
        async failing() {
          throw new Error('Database connection failed')
        },
      },
      content: {},
    })

    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    bgWithError.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()

    listener({ action: 'failing' }, {}, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(sendResponse.mock.calls.length, 1)
    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: false, error: 'Database connection failed' },
    ])
  })

  it('wraps error response when handler throws non-Error', async () => {
    const { background: bgWithError } = defineMessaging({
      background: {
        async failing() {
          throw 'string error'
        },
      },
      content: {},
    })

    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    bgWithError.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()

    listener({ action: 'failing' }, {}, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(sendResponse.mock.calls.length, 1)
    assert.deepEqual(firstCall(sendResponse).arguments, [{ success: false, error: 'string error' }])
  })

  it('ignores null/undefined messages', () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    background.onMessage()

    const listener = getListener()

    assert.equal(
      listener(null, {}, () => {}),
      false,
    )
    assert.equal(
      listener(undefined, {}, () => {}),
      false,
    )
  })
})

describe('content.onMessage', () => {
  it('registers a listener with chrome.runtime.onMessage', () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    content.onMessage()

    assert.equal(mockChrome.runtime.onMessage.addListener.mock.calls.length, 1)
  })

  it('ignores messages with non-matching action', () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    content.onMessage()

    const listener = getListener()
    const result = listener({ action: 'unknownAction' }, {}, () => {})

    assert.equal(result, false)
  })

  it('calls handler and wraps response', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    content.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()
    const message = { action: 'html' }

    const result = listener(message, {}, sendResponse)

    assert.equal(result, true) // Keep channel open for async

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(sendResponse.mock.calls.length, 1)
    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: true, data: { html: '<html></html>' } },
    ])
  })

  it('passes message payload to handler', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    content.onMessage()

    const listener = getListener()
    const sendResponse = mock.fn()
    const message = { action: 'highlight', selector: '.my-class' }

    listener(message, {}, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(sendResponse.mock.calls.length, 1)
    assert.deepEqual(firstCall(sendResponse).arguments, [{ success: true, data: undefined }])
  })
})

describe('onMessage hooks', () => {
  it('calls onRequest before handler', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    const onRequest = mock.fn()
    background.onMessage({ onRequest })

    const listener = getListener()
    const sender = { tab: { id: 1 } } as chrome.runtime.MessageSender
    const message = { action: 'info' }

    listener(message, sender, () => {})

    assert.equal(onRequest.mock.calls.length, 1)
    assert.deepEqual(firstCall(onRequest).arguments, ['info', message, sender])
  })

  it('calls onResponse after successful handler', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    const onResponse = mock.fn()
    background.onMessage({ onResponse })

    const listener = getListener()
    listener({ action: 'info' }, { tab: { id: 1 } } as chrome.runtime.MessageSender, () => {})

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(onResponse.mock.calls.length, 1)
    const call = firstCall(onResponse)
    assert.equal(call.arguments[0], 'info')
    assert.deepEqual(call.arguments[1], { version: '1.0.0', tabId: 1 })
  })

  it('calls onError on handler failure and uses custom message', async () => {
    const { background: bgWithError } = defineMessaging({
      background: {
        async failing() {
          throw new Error('Original error')
        },
      },
      content: {},
    })

    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    type OnErrorFn = (action: string, err: unknown, sender: chrome.runtime.MessageSender) => string
    const onError = mock.fn<OnErrorFn>(() => 'Custom error message')
    bgWithError.onMessage({ onError })

    const listener = getListener()
    const sendResponse = mock.fn()
    const sender = { tab: { id: 1 } } as chrome.runtime.MessageSender

    listener({ action: 'failing' }, sender, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(onError.mock.calls.length, 1)
    const errorCall = firstCall(onError)
    assert.equal(errorCall.arguments[0], 'failing')
    assert.ok(errorCall.arguments[1] instanceof Error)
    assert.deepEqual(errorCall.arguments[2], sender)
    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: false, error: 'Custom error message' },
    ])
  })

  it('uses default error message if onError returns void', async () => {
    const { background: bgWithError } = defineMessaging({
      background: {
        async failing() {
          throw new Error('Original error')
        },
      },
      content: {},
    })

    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    const onError = mock.fn(() => undefined)
    bgWithError.onMessage({ onError })

    const listener = getListener()
    const sendResponse = mock.fn()

    listener({ action: 'failing' }, {}, sendResponse)

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.deepEqual(firstCall(sendResponse).arguments, [
      { success: false, error: 'Original error' },
    ])
  })

  it('content.onMessage also supports hooks', async () => {
    mockChrome.runtime.onMessage.addListener.mock.resetCalls()
    const onRequest = mock.fn()
    const onResponse = mock.fn()
    content.onMessage({ onRequest, onResponse })

    const listener = getListener()
    const sender = {} as chrome.runtime.MessageSender
    const message = { action: 'html' }

    listener(message, sender, () => {})

    assert.equal(onRequest.mock.calls.length, 1)
    assert.deepEqual(firstCall(onRequest).arguments, ['html', message, sender])

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(onResponse.mock.calls.length, 1)
    assert.equal(firstCall(onResponse).arguments[0], 'html')
  })
})
