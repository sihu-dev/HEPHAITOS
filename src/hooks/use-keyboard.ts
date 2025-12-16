// ============================================
// Keyboard Hook
// Handle keyboard shortcuts and events
// ============================================

'use client'

import { useEffect, useCallback, useRef } from 'react'

type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta'
type KeyHandler = (event: KeyboardEvent) => void

interface KeyBinding {
  key: string
  modifiers?: KeyModifier[]
  handler: KeyHandler
  preventDefault?: boolean
  stopPropagation?: boolean
}

/**
 * Single keyboard shortcut
 * @param key - Key to listen for
 * @param handler - Callback when key is pressed
 * @param options - Additional options
 */
export function useKeyPress(
  key: string,
  handler: KeyHandler,
  options: {
    modifiers?: KeyModifier[]
    preventDefault?: boolean
    enabled?: boolean
  } = {}
): void {
  const { modifiers = [], preventDefault = true, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase()
      const isCtrl = modifiers.includes('ctrl') ? event.ctrlKey || event.metaKey : true
      const isAlt = modifiers.includes('alt') ? event.altKey : true
      const isShift = modifiers.includes('shift') ? event.shiftKey : true
      const isMeta = modifiers.includes('meta') ? event.metaKey : true

      // Check for unwanted modifiers
      const hasUnwantedCtrl = !modifiers.includes('ctrl') && (event.ctrlKey || event.metaKey)
      const hasUnwantedAlt = !modifiers.includes('alt') && event.altKey
      const hasUnwantedShift = !modifiers.includes('shift') && event.shiftKey

      if (isKeyMatch && isCtrl && isAlt && isShift && isMeta &&
          !hasUnwantedCtrl && !hasUnwantedAlt && !hasUnwantedShift) {
        if (preventDefault) {
          event.preventDefault()
        }
        handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, handler, modifiers, preventDefault, enabled])
}

/**
 * Multiple keyboard shortcuts
 * @param bindings - Array of key bindings
 */
export function useKeyBindings(bindings: KeyBinding[]): void {
  const bindingsRef = useRef(bindings)
  bindingsRef.current = bindings

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const binding of bindingsRef.current) {
        const { key, modifiers = [], handler, preventDefault = true, stopPropagation = false } = binding

        const isKeyMatch = event.key.toLowerCase() === key.toLowerCase()
        const isCtrl = modifiers.includes('ctrl') ? event.ctrlKey || event.metaKey : true
        const isAlt = modifiers.includes('alt') ? event.altKey : true
        const isShift = modifiers.includes('shift') ? event.shiftKey : true

        const hasUnwantedCtrl = !modifiers.includes('ctrl') && (event.ctrlKey || event.metaKey)
        const hasUnwantedAlt = !modifiers.includes('alt') && event.altKey
        const hasUnwantedShift = !modifiers.includes('shift') && event.shiftKey

        if (isKeyMatch && isCtrl && isAlt && isShift &&
            !hasUnwantedCtrl && !hasUnwantedAlt && !hasUnwantedShift) {
          if (preventDefault) {
            event.preventDefault()
          }
          if (stopPropagation) {
            event.stopPropagation()
          }
          handler(event)
          break // Stop after first match
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

/**
 * Escape key handler
 * @param handler - Callback when Escape is pressed
 * @param enabled - Whether the handler is active
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true): void {
  useKeyPress('Escape', handler, { enabled, preventDefault: false })
}

/**
 * Enter key handler
 * @param handler - Callback when Enter is pressed
 * @param enabled - Whether the handler is active
 */
export function useEnterKey(handler: () => void, enabled: boolean = true): void {
  useKeyPress('Enter', handler, { enabled })
}

/**
 * Common shortcuts hook for the application
 */
export function useAppShortcuts(handlers: {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSearch?: () => void
  onNew?: () => void
  onDelete?: () => void
}): void {
  const bindings: KeyBinding[] = []

  if (handlers.onSave) {
    bindings.push({
      key: 's',
      modifiers: ['ctrl'],
      handler: handlers.onSave,
    })
  }

  if (handlers.onUndo) {
    bindings.push({
      key: 'z',
      modifiers: ['ctrl'],
      handler: handlers.onUndo,
    })
  }

  if (handlers.onRedo) {
    bindings.push({
      key: 'z',
      modifiers: ['ctrl', 'shift'],
      handler: handlers.onRedo,
    })
    bindings.push({
      key: 'y',
      modifiers: ['ctrl'],
      handler: handlers.onRedo,
    })
  }

  if (handlers.onSearch) {
    bindings.push({
      key: 'k',
      modifiers: ['ctrl'],
      handler: handlers.onSearch,
    })
    bindings.push({
      key: 'f',
      modifiers: ['ctrl'],
      handler: handlers.onSearch,
    })
  }

  if (handlers.onNew) {
    bindings.push({
      key: 'n',
      modifiers: ['ctrl'],
      handler: handlers.onNew,
    })
  }

  if (handlers.onDelete) {
    bindings.push({
      key: 'Delete',
      handler: handlers.onDelete,
      preventDefault: false,
    })
    bindings.push({
      key: 'Backspace',
      handler: handlers.onDelete,
      preventDefault: false,
    })
  }

  useKeyBindings(bindings)
}

export default useKeyPress
