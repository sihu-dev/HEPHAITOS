// ============================================
// useLocalStorage Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage, getLocalStorageValue, setLocalStorageValue } from '@/hooks/use-local-storage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    expect(result.current[0]).toBe('defaultValue')
  })

  it('should return stored value from localStorage', () => {
    localStorage.setItem('testKey', JSON.stringify('storedValue'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    expect(result.current[0]).toBe('storedValue')
  })

  it('should update localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))

    act(() => {
      result.current[1]('newValue')
    })

    expect(result.current[0]).toBe('newValue')
    expect(JSON.parse(localStorage.getItem('testKey') || '')).toBe('newValue')
  })

  it('should handle objects correctly', () => {
    const initialObject = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('objectKey', initialObject))

    expect(result.current[0]).toEqual(initialObject)

    const updatedObject = { name: 'updated', count: 1 }
    act(() => {
      result.current[1](updatedObject)
    })

    expect(result.current[0]).toEqual(updatedObject)
    expect(JSON.parse(localStorage.getItem('objectKey') || '')).toEqual(updatedObject)
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counterKey', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(6)
  })

  it('should remove item when removeValue is called', () => {
    localStorage.setItem('testKey', JSON.stringify('value'))

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'))

    expect(result.current[0]).toBe('value')

    act(() => {
      result.current[2]() // removeValue
    })

    // After removal, the value should reset to default
    expect(result.current[0]).toBe('default')
  })
})

describe('getLocalStorageValue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return default value for non-existent keys', () => {
    expect(getLocalStorageValue('nonExistent', undefined)).toBeUndefined()
  })

  it('should return parsed value for existing keys', () => {
    localStorage.setItem('testKey', JSON.stringify({ data: 'test' }))
    expect(getLocalStorageValue('testKey', null)).toEqual({ data: 'test' })
  })

  it('should return default value when key does not exist', () => {
    expect(getLocalStorageValue('nonExistent', 'default')).toBe('default')
  })
})

describe('setLocalStorageValue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should set value in localStorage', () => {
    setLocalStorageValue('testKey', 'testValue')
    expect(JSON.parse(localStorage.getItem('testKey') || '')).toBe('testValue')
  })

  it('should handle objects', () => {
    const obj = { name: 'test', count: 42 }
    setLocalStorageValue('objectKey', obj)
    expect(JSON.parse(localStorage.getItem('objectKey') || '')).toEqual(obj)
  })
})
