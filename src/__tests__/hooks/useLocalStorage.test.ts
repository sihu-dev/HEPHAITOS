// ============================================
// useLocalStorage Hook Tests
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored value'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('stored value')
  })

  it('updates localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new value')
    })

    expect(result.current[0]).toBe('new value')
    expect(JSON.parse(localStorage.getItem('test-key') || '')).toBe('new value')
  })

  it('handles objects correctly', () => {
    const initialObject = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('test-key', initialObject))

    expect(result.current[0]).toEqual(initialObject)

    const newObject = { name: 'updated', count: 1 }
    act(() => {
      result.current[1](newObject)
    })

    expect(result.current[0]).toEqual(newObject)
  })

  it('handles arrays correctly', () => {
    const initialArray = [1, 2, 3]
    const { result } = renderHook(() => useLocalStorage('test-key', initialArray))

    expect(result.current[0]).toEqual(initialArray)

    act(() => {
      result.current[1]([4, 5, 6])
    })

    expect(result.current[0]).toEqual([4, 5, 6])
  })

  it('supports function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev: number) => prev + 10)
    })

    expect(result.current[0]).toBe(11)
  })

  it('handles invalid JSON in localStorage', () => {
    localStorage.setItem('test-key', 'invalid json')
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('uses different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'))
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'))

    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')

    act(() => {
      result1.current[1]('updated1')
    })

    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2')
  })
})
