// ============================================
// useDebounce Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback, useLeadingDebounce } from '@/hooks/use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Now value should be updated
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Multiple rapid updates
    rerender({ value: 'update1', delay: 500 })
    act(() => vi.advanceTimersByTime(200))

    rerender({ value: 'update2', delay: 500 })
    act(() => vi.advanceTimersByTime(200))

    rerender({ value: 'update3', delay: 500 })

    // Should still be initial
    expect(result.current).toBe('initial')

    // Complete the debounce
    act(() => vi.advanceTimersByTime(500))

    // Should be the final value
    expect(result.current).toBe('update3')
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    // Call the debounced function multiple times
    result.current('arg1')
    result.current('arg2')
    result.current('arg3')

    // Callback should not be called yet
    expect(callback).not.toHaveBeenCalled()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Callback should be called once with last arguments
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg3')
  })
})

describe('useLeadingDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call immediately on first invocation', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLeadingDebounce(callback, 500))

    // Call the debounced function
    result.current('arg1')

    // Should be called immediately
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg1')
  })

  it('should debounce subsequent calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLeadingDebounce(callback, 500))

    // First call is immediate
    result.current('arg1')
    expect(callback).toHaveBeenCalledTimes(1)

    // Subsequent calls within delay should be ignored
    result.current('arg2')
    result.current('arg3')
    expect(callback).toHaveBeenCalledTimes(1)

    // After delay, can call again
    act(() => vi.advanceTimersByTime(500))

    result.current('arg4')
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('arg4')
  })
})
