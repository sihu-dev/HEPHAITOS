// ============================================
// useAsync Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsync, useFetch, useMutation } from '@/hooks/use-async'

describe('useAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with initial state', () => {
    const asyncFn = vi.fn().mockResolvedValue('result')
    const { result } = renderHook(() => useAsync(asyncFn))

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle successful async operation', async () => {
    const asyncFn = vi.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('success')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(asyncFn).toHaveBeenCalledTimes(1)
  })

  it('should handle failed async operation', async () => {
    const error = new Error('Test error')
    const asyncFn = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toEqual(error)
  })

  it('should set loading state during execution', async () => {
    let resolvePromise: (value: string) => void
    const asyncFn = vi.fn().mockImplementation(
      () => new Promise<string>((resolve) => {
        resolvePromise = resolve
      })
    )

    const { result } = renderHook(() => useAsync(asyncFn))

    act(() => {
      result.current.execute()
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolvePromise!('done')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe('done')
  })

  it('should execute immediately when immediate=true', async () => {
    vi.useRealTimers()
    const asyncFn = vi.fn().mockResolvedValue('immediate')

    renderHook(() => useAsync(asyncFn, true))

    await waitFor(() => {
      expect(asyncFn).toHaveBeenCalledTimes(1)
    })
  })

  it('should reset state correctly', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should allow manual data setting', async () => {
    const asyncFn = vi.fn().mockResolvedValue('initial')
    const { result } = renderHook(() => useAsync(asyncFn))

    act(() => {
      result.current.setData('manual')
    })

    expect(result.current.data).toBe('manual')
  })

  it('should pass arguments to async function', async () => {
    const asyncFn = vi.fn().mockImplementation((a: number, b: string) =>
      Promise.resolve(`${a}-${b}`)
    )
    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute(42, 'test')
    })

    expect(asyncFn).toHaveBeenCalledWith(42, 'test')
    expect(result.current.data).toBe('42-test')
  })

  it('should convert non-Error to Error', async () => {
    const asyncFn = vi.fn().mockRejectedValue('string error')
    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('string error')
  })
})

describe('useMutation', () => {
  it('should track success state', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useMutation(mutationFn))

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('should track error state', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('Mutation failed'))
    const { result } = renderHook(() => useMutation(mutationFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(true)
  })
})

describe('useFetch', () => {
  const mockResponse = { data: 'test' }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch data successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const { result } = renderHook(() =>
      useFetch<typeof mockResponse>('https://api.test.com/data', { immediate: false })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
  })

  it('should handle HTTP errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    const { result } = renderHook(() =>
      useFetch('https://api.test.com/data', { immediate: false, retries: 0 })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toContain('404')
  })

  it('should retry on failure', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

    const { result } = renderHook(() =>
      useFetch<typeof mockResponse>('https://api.test.com/data', {
        immediate: false,
        retries: 2,
        retryDelay: 10
      })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(result.current.data).toEqual(mockResponse)
  })
})
