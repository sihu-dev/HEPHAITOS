// ============================================
// Local Storage Hook
// Persist state to localStorage with SSR safety
// ============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeLogger } from '@/lib/utils/safe-logger';

type SetValue<T> = T | ((prevValue: T) => T)

/**
 * Use localStorage with React state
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store value
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      safeLogger.warn(`Error reading localStorage key "${key}":`, error)
    }
    setIsInitialized(true)
  }, [key])

  // Sync to localStorage when value changes
  useEffect(() => {
    if (!isInitialized) return

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      safeLogger.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue, isInitialized])

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          safeLogger.warn(`Error parsing localStorage value for "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  // Setter function
  const setValue = useCallback((value: SetValue<T>) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value
      return newValue
    })
  }, [])

  // Remove function
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      safeLogger.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Read localStorage value once (no state updates)
 * @param key - localStorage key
 * @param defaultValue - Default value if no stored value exists
 */
export function getLocalStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    safeLogger.warn(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Set localStorage value directly
 * @param key - localStorage key
 * @param value - Value to store
 */
export function setLocalStorageValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    safeLogger.warn(`Error setting localStorage key "${key}":`, error)
  }
}

export default useLocalStorage
