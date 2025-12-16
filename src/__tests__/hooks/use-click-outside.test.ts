// ============================================
// useClickOutside Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClickOutside, useClickOutsideMultiple } from '@/hooks/use-click-outside'
import { useRef } from 'react'

describe('useClickOutside', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('should return a ref', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside(handler))

    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('should call handler when clicking outside', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))

    // Create and attach element to ref
    const element = document.createElement('div')
    element.setAttribute('data-testid', 'inside')
    container.appendChild(element)

    // Manually set ref
    Object.defineProperty(result.current, 'current', {
      value: element,
      writable: true,
    })

    // Click outside
    const outsideElement = document.createElement('div')
    container.appendChild(outsideElement)

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outsideElement.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when clicking inside', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))

    const element = document.createElement('div')
    const childElement = document.createElement('span')
    element.appendChild(childElement)
    container.appendChild(element)

    Object.defineProperty(result.current, 'current', {
      value: element,
      writable: true,
    })

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      childElement.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not call handler when disabled', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler, false))

    const element = document.createElement('div')
    container.appendChild(element)

    Object.defineProperty(result.current, 'current', {
      value: element,
      writable: true,
    })

    const outsideElement = document.createElement('div')
    container.appendChild(outsideElement)

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outsideElement.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle touch events', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))

    const element = document.createElement('div')
    container.appendChild(element)

    Object.defineProperty(result.current, 'current', {
      value: element,
      writable: true,
    })

    const outsideElement = document.createElement('div')
    container.appendChild(outsideElement)

    act(() => {
      const event = new TouchEvent('touchstart', { bubbles: true })
      outsideElement.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should cleanup listeners on unmount', () => {
    const handler = vi.fn()
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useClickOutside(handler))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})

describe('useClickOutsideMultiple', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('should call handler when clicking outside all refs', () => {
    const handler = vi.fn()
    const ref1 = { current: document.createElement('div') }
    const ref2 = { current: document.createElement('div') }

    container.appendChild(ref1.current)
    container.appendChild(ref2.current)

    renderHook(() => useClickOutsideMultiple([ref1, ref2], handler))

    const outsideElement = document.createElement('div')
    container.appendChild(outsideElement)

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outsideElement.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when clicking inside any ref', () => {
    const handler = vi.fn()
    const ref1 = { current: document.createElement('div') }
    const ref2 = { current: document.createElement('div') }

    container.appendChild(ref1.current)
    container.appendChild(ref2.current)

    renderHook(() => useClickOutsideMultiple([ref1, ref2], handler))

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      ref1.current.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      ref2.current.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not call handler when disabled', () => {
    const handler = vi.fn()
    const ref1 = { current: document.createElement('div') }
    const ref2 = { current: document.createElement('div') }

    container.appendChild(ref1.current)
    container.appendChild(ref2.current)

    renderHook(() => useClickOutsideMultiple([ref1, ref2], handler, false))

    const outsideElement = document.createElement('div')
    container.appendChild(outsideElement)

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outsideElement.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })
})
