import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Toggles a CSS class on document.body based on the active state.
 * Automatically cleans up on unmount or when deactivated.
 *
 * @example
 * useBodyClass('modal-open', isModalOpen)
 * useBodyClass('dark-theme', isDarkMode)
 */
export function useBodyClass(className: string, active: boolean) {
  useEffect(() => {
    if (!active) return

    document.body.classList.add(className)
    return () => document.body.classList.remove(className)
  }, [className, active])
}

/**
 * Reads a CSS custom property (variable) from the document root.
 * Uses useLayoutEffect to read synchronously before paint.
 *
 * @example
 * const primaryColor = useCssVariable('--color-primary')
 */
export function useCssVariable(name: string): string {
  const [value, setValue] = useState('')

  useLayoutEffect(() => {
    const computed = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    setValue(computed)
  }, [name])

  return value
}

/**
 * Dynamically injects a <style> element into <head> with the given CSS.
 * Pass null or undefined to remove the styles. Cleans up on unmount.
 *
 * @example
 * useInjectStyles('custom-theme', isDark ? darkCss : lightCss)
 * useInjectStyles('dynamic-styles', showStyles ? css : null)
 */
export function useInjectStyles(id: string, css: string | null | undefined) {
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    if (!css) {
      styleRef.current?.remove()
      styleRef.current = null
      return
    }

    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.id = id
      document.head.appendChild(styleRef.current)
    }
    styleRef.current.textContent = css

    return () => {
      styleRef.current?.remove()
      styleRef.current = null
    }
  }, [id, css])
}

/**
 * Listens for URL changes in single-page applications.
 * Detects both browser navigation (back/forward) and programmatic
 * changes via history.pushState/replaceState.
 *
 * @example
 * useUrlChange(() => {
 *   console.log('URL changed to:', window.location.href)
 *   trackPageView()
 * })
 */
export function useUrlChange(onChange: () => void) {
  useEffect(() => {
    window.addEventListener('popstate', onChange)

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      onChange()
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      onChange()
    }

    return () => {
      window.removeEventListener('popstate', onChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [onChange])
}

/**
 * Returns true when running in development mode.
 * Useful for conditional debugging UI or logging.
 *
 * @example
 * const isDev = useDevMode()
 * {isDev && <DebugPanel />}
 */
export function useDevMode(): boolean {
  // Check for common dev mode indicators across different bundlers
  try {
    // Works with webpack, vite, etc.
    return (
      typeof globalThis !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).process?.env?.NODE_ENV === 'development'
    )
  } catch {
    return false
  }
}

/**
 * Tracks window resize events and returns current dimensions.
 * Optionally accepts a ref to track a specific element's size.
 *
 * @example
 * const { width, height } = useWindowSize()
 */
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight })

    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}

/**
 * Tracks an element's size using ResizeObserver.
 * Returns the element ref and current dimensions.
 *
 * @example
 * const { ref, width, height } = useElementSize<HTMLDivElement>()
 * return <div ref={ref}>...</div>
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}
