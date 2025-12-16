// ============================================
// useKeyboard Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useKeyPress,
  useKeyBindings,
  useEscapeKey,
  useEnterKey,
  useAppShortcuts
} from '@/hooks/use-keyboard'

describe('useKeyPress', () => {
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call handler when key is pressed', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('a', handler))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      window.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler for different key', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('a', handler))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'b' })
      window.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle modifier keys', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('s', handler, { modifiers: ['ctrl'] }))

    // Without modifier - should not trigger
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 's' })
      window.dispatchEvent(event)
    })
    expect(handler).not.toHaveBeenCalled()

    // With modifier - should trigger
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
      window.dispatchEvent(event)
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple modifiers', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('z', handler, { modifiers: ['ctrl', 'shift'] }))

    // Only ctrl - should not trigger
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
      window.dispatchEvent(event)
    })
    expect(handler).not.toHaveBeenCalled()

    // Both modifiers - should trigger
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })
      window.dispatchEvent(event)
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should preventDefault by default', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('a', handler))

    const event = new KeyboardEvent('keydown', { key: 'a' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should not preventDefault when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('a', handler, { preventDefault: false }))

    const event = new KeyboardEvent('keydown', { key: 'a' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('should not call handler when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('a', handler, { enabled: false }))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      window.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should be case insensitive', () => {
    const handler = vi.fn()
    renderHook(() => useKeyPress('A', handler))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      window.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should cleanup on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyPress('a', handler))

    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})

describe('useKeyBindings', () => {
  it('should handle multiple key bindings', () => {
    const saveHandler = vi.fn()
    const undoHandler = vi.fn()

    renderHook(() => useKeyBindings([
      { key: 's', modifiers: ['ctrl'], handler: saveHandler },
      { key: 'z', modifiers: ['ctrl'], handler: undoHandler },
    ]))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }))
    })
    expect(saveHandler).toHaveBeenCalledTimes(1)
    expect(undoHandler).not.toHaveBeenCalled()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })
    expect(undoHandler).toHaveBeenCalledTimes(1)
  })

  it('should stop after first match', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    renderHook(() => useKeyBindings([
      { key: 'a', handler: handler1 },
      { key: 'a', handler: handler2 },
    ]))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should handle stopPropagation option', () => {
    const handler = vi.fn()

    renderHook(() => useKeyBindings([
      { key: 'a', handler, stopPropagation: true },
    ]))

    const event = new KeyboardEvent('keydown', { key: 'a' })
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(stopPropagationSpy).toHaveBeenCalled()
  })
})

describe('useEscapeKey', () => {
  it('should call handler on Escape key', () => {
    const handler = vi.fn()
    renderHook(() => useEscapeKey(handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useEscapeKey(handler, false))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('useEnterKey', () => {
  it('should call handler on Enter key', () => {
    const handler = vi.fn()
    renderHook(() => useEnterKey(handler))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('useAppShortcuts', () => {
  it('should handle save shortcut (Ctrl+S)', () => {
    const handlers = { onSave: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }))
    })

    expect(handlers.onSave).toHaveBeenCalledTimes(1)
  })

  it('should handle undo shortcut (Ctrl+Z)', () => {
    const handlers = { onUndo: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })

    expect(handlers.onUndo).toHaveBeenCalledTimes(1)
  })

  it('should handle redo shortcut (Ctrl+Shift+Z)', () => {
    const handlers = { onRedo: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }))
    })

    expect(handlers.onRedo).toHaveBeenCalledTimes(1)
  })

  it('should handle redo shortcut (Ctrl+Y)', () => {
    const handlers = { onRedo: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }))
    })

    expect(handlers.onRedo).toHaveBeenCalledTimes(1)
  })

  it('should handle search shortcut (Ctrl+K)', () => {
    const handlers = { onSearch: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    })

    expect(handlers.onSearch).toHaveBeenCalledTimes(1)
  })

  it('should handle new shortcut (Ctrl+N)', () => {
    const handlers = { onNew: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    })

    expect(handlers.onNew).toHaveBeenCalledTimes(1)
  })

  it('should handle delete shortcut (Delete key)', () => {
    const handlers = { onDelete: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
    })

    expect(handlers.onDelete).toHaveBeenCalledTimes(1)
  })

  it('should not bind shortcuts for undefined handlers', () => {
    const handlers = { onSave: vi.fn() }
    renderHook(() => useAppShortcuts(handlers))

    // Should not throw and should not have undo binding
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })

    expect(handlers.onSave).not.toHaveBeenCalled()
  })
})
