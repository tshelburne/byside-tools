/**
 * Type-safe Chrome extension messaging.
 *
 * Define handlers as functions, get fully typed send/receive APIs.
 *
 * @example
 * ```typescript
 * import { defineMessaging } from './messaging'
 *
 * export const { background, content } = defineMessaging({
 *   background: {
 *     async gql(req: { query: string }, sender) {
 *       const res = await fetch('/graphql', { ... })
 *       return res.json()
 *     },
 *     info(req: void, sender) {
 *       return { tabId: sender.tab?.id }
 *     },
 *   },
 *   content: {
 *     html(req: void, sender) {
 *       return { url: location.href, html: document.documentElement.outerHTML }
 *     },
 *   },
 * })
 *
 * // In background worker:
 * background.onMessage()
 * const result = await content.send(tabId, 'html')
 *
 * // In content script:
 * content.onMessage()
 * const result = await background.send('gql', { query: '...' })
 * ```
 */

/** Handler function signature */
export type Handler<TReq = void, TRes = void> = (
  req: TReq,
  sender: chrome.runtime.MessageSender,
) => TRes | Promise<TRes>

/** Map of action names to handlers */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handlers = Record<string, Handler<any, any>>

/** Extract request type from handler */
type InferReq<H> = H extends (req: infer R, sender: chrome.runtime.MessageSender) => unknown
  ? R
  : void

/** Extract response type from handler */
type InferRes<H> = H extends (req: unknown, sender: chrome.runtime.MessageSender) => infer R
  ? Awaited<R>
  : void

/** Result wrapper for message responses */
export type MessageResult<T> = { success: true; data: T } | { success: false; error: string }

/** Configuration for onMessage registration */
export interface OnMessageConfig {
  /** Called before each handler */
  onRequest?: (action: string, req: unknown, sender: chrome.runtime.MessageSender) => void
  /** Called after successful handler response */
  onResponse?: (action: string, res: unknown) => void
  /** Called on handler error, can return custom error message */
  onError?: (action: string, err: unknown, sender: chrome.runtime.MessageSender) => string | void
}

/** Send function from content to background */
type SendToBackground<BG extends Handlers> = <A extends keyof BG & string>(
  action: A,
  ...args: InferReq<BG[A]> extends void ? [] : [InferReq<BG[A]>]
) => Promise<MessageResult<InferRes<BG[A]>>>

/** Send function from background to content */
type SendToContent<CT extends Handlers> = <A extends keyof CT & string>(
  tabId: number,
  action: A,
  ...args: InferReq<CT[A]> extends void ? [] : [InferReq<CT[A]>]
) => Promise<MessageResult<InferRes<CT[A]>>>

/** Background context API - for communicating with the background script */
interface BackgroundContext<BG extends Handlers> {
  send: SendToBackground<BG>
  onMessage: (config?: OnMessageConfig) => void
}

/** Content context API - for communicating with content scripts */
interface ContentContext<CT extends Handlers> {
  send: SendToContent<CT>
  onMessage: (config?: OnMessageConfig) => void
}

/**
 * Creates type-safe messaging for Chrome extension communication.
 *
 * @param config Object with background and content handler definitions
 * @returns Context objects for background and content scripts
 */
export function defineMessaging<BG extends Handlers, CT extends Handlers>(config: {
  background: BG
  content: CT
}): {
  background: BackgroundContext<BG>
  content: ContentContext<CT>
} {
  return {
    background: {
      send: (action, ...args) =>
        sendMessage(action, args[0], (msg) => chrome.runtime.sendMessage(msg)),
      onMessage: (opts?) => {
        chrome.runtime.onMessage.addListener(createListener(config.background, opts))
      },
    },
    content: {
      send: (tabId, action, ...args) =>
        sendMessage(action, args[0], (msg) => chrome.tabs.sendMessage(tabId, msg)),
      onMessage: (opts?) => {
        chrome.runtime.onMessage.addListener(createListener(config.content, opts))
      },
    },
  }
}

function sendMessage<T>(
  action: string,
  req: unknown,
  transport: (msg: { action: string }) => Promise<T>,
): Promise<T> {
  return transport({ action, ...(req as object) })
}

function createListener(handlers: Handlers, opts?: OnMessageConfig) {
  return (
    message: { action?: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResult<unknown>) => void,
  ): boolean => {
    const action = message?.action
    if (!action) return false

    const handler = handlers[action]
    if (!handler) return false

    opts?.onRequest?.(action, message, sender)

    Promise.resolve(handler(message, sender))
      .then((data) => {
        opts?.onResponse?.(action, data)
        sendResponse({ success: true, data })
      })
      .catch((err) => {
        const customMessage = opts?.onError?.(action, err, sender)
        const errorMessage =
          typeof customMessage === 'string'
            ? customMessage
            : err instanceof Error
              ? err.message
              : String(err)
        sendResponse({ success: false, error: errorMessage })
      })

    return true
  }
}
