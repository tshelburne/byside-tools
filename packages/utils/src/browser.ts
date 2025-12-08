import { waitFor } from './promise.js'

/**
 * Wait for elements matching a selector to appear in the DOM.
 * Resolves when at least one element matches, returns all matching elements.
 */
export function waitForElement<T extends Element = Element>(
  doc: Document,
  selector: string,
  timeoutMs = 10000,
): Promise<T[]> {
  return waitFor(() => {
    const elements = doc.querySelectorAll(selector)
    return elements.length > 0 ? (Array.from(elements) as T[]) : null
  }, timeoutMs)
}
