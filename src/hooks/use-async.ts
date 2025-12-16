// ============================================
// Async Hook
// Handle async operations with loading/error states
// ============================================

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
}

/**
 * Handle async function execution with state management
 * @param asyncFunction - Async function to execute
 * @param immediate - Execute immediately on mount
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  })

  const mountedRef = useRef(true)
  const asyncFunctionRef = useRef(asyncFunction)

  // Update ref when function changes
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction
  }, [asyncFunction])

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await asyncFunctionRef.current(...args)

      if (mountedRef.current) {
        setState({ data: result, isLoading: false, error: null })
      }

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (mountedRef.current) {
        setState({ data: null, isLoading: false, error: err })
      }

      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null })
  }, [])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args))
    }
  }, [immediate, execute])

  return {
    ...state,
    execute,
    reset,
    setData,
  }
}

/**
 * Fetch data with automatic retry
 * @param url - URL to fetch
 * @param options - Fetch options
 */
export function useFetch<T>(
  url: string,
  options?: RequestInit & {
    immediate?: boolean
    retries?: number
    retryDelay?: number
  }
): UseAsyncReturn<T, []> {
  const { immediate = true, retries = 0, retryDelay = 1000, ...fetchOptions } = options || {}

  const fetchWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    }

    throw lastError
  }, [url, fetchOptions, retries, retryDelay])

  return useAsync(fetchWithRetry, immediate)
}

/**
 * Mutation hook for POST/PUT/DELETE operations
 * @param mutationFn - Mutation function
 */
export function useMutation<T, Args extends unknown[] = []>(
  mutationFn: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> & {
  isSuccess: boolean
  isError: boolean
} {
  const asyncState = useAsync(mutationFn, false)

  return {
    ...asyncState,
    isSuccess: asyncState.data !== null && !asyncState.isLoading && !asyncState.error,
    isError: asyncState.error !== null,
  }
}

export default useAsync
