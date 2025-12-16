// ============================================
// Click Outside Hook
// Detect clicks outside of an element
// ============================================

'use client'

import { useEffect, useRef, type RefObject } from 'react'

type Handler = (event: MouseEvent | TouchEvent) => void

/**
 * Detect clicks outside of the referenced element
 * @param handler - Callback when clicking outside
 * @param enabled - Whether the handler is active
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current

      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return
      }

      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, enabled])

  return ref
}

/**
 * Detect clicks outside of multiple elements
 * @param refs - Array of refs to check
 * @param handler - Callback when clicking outside all refs
 * @param enabled - Whether the handler is active
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement>[],
  handler: Handler,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      // Check if click is outside all refs
      const isOutside = refs.every((ref) => {
        const el = ref.current
        return !el || !el.contains(event.target as Node)
      })

      if (isOutside) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [refs, handler, enabled])
}

export default useClickOutside
