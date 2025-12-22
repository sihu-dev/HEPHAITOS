// ============================================
// useMediaQuery Hook Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeDesktop,
  useBreakpoint,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  usePrefersHighContrast,
  useResponsiveValue,
} from '@/hooks/use-media-query'

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  const listeners: Set<(event: MediaQueryListEvent) => void> = new Set()

  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn((cb) => listeners.add(cb)), // deprecated
    removeListener: vi.fn((cb) => listeners.delete(cb)), // deprecated
    addEventListener: vi.fn((event, cb) => listeners.add(cb)),
    removeEventListener: vi.fn((event, cb) => listeners.delete(cb)),
    dispatchEvent: vi.fn(),
    // Helper for tests to trigger change
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach((cb) => cb({ matches: newMatches } as MediaQueryListEvent))
    },
  }))
}

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('should return initial match state', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
  })

  it('should return false when query does not match', () => {
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)
  })

  it('should update when media query changes', () => {
    const mockMatches = false
    const listeners: ((event: MediaQueryListEvent) => void)[] = []

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: mockMatches,
      media: query,
      addEventListener: vi.fn((_, cb) => listeners.push(cb)),
      removeEventListener: vi.fn((_, cb) => {
        const idx = listeners.indexOf(cb)
        if (idx > -1) listeners.splice(idx, 1)
      }),
    }))

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    act(() => {
      listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent))
    })

    expect(result.current).toBe(true)
  })

  it('should cleanup listeners on unmount', () => {
    const removeEventListener = vi.fn()

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    }))

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('Predefined breakpoint hooks', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('useIsMobile should check max-width 639px', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 639px)')
  })

  it('useIsTablet should check tablet range', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsTablet())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 640px) and (max-width: 1023px)')
  })

  it('useIsDesktop should check min-width 1024px', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsDesktop())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })

  it('useIsLargeDesktop should check min-width 1280px', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsLargeDesktop())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1280px)')
  })
})

describe('useBreakpoint', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('should return mobile for small screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 639px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toBe('mobile')
  })

  it('should return tablet for medium screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 640px) and (max-width: 1023px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toBe('tablet')
  })

  it('should return desktop for large screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toBe('desktop')
  })

  it('should return largeDesktop for extra large screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1280px') || query.includes('1024px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toBe('largeDesktop')
  })
})

describe('Preference hooks', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('usePrefersReducedMotion should check prefers-reduced-motion', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('usePrefersDarkMode should check prefers-color-scheme: dark', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => usePrefersDarkMode())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('usePrefersHighContrast should check prefers-contrast: high', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => usePrefersHighContrast())

    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)')
  })
})

describe('useResponsiveValue', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('should return mobile value on mobile', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 639px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useResponsiveValue({
      mobile: 'small',
      tablet: 'medium',
      desktop: 'large',
      default: 'default',
    }))

    expect(result.current).toBe('small')
  })

  it('should return tablet value on tablet', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 640px) and (max-width: 1023px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useResponsiveValue({
      mobile: 'small',
      tablet: 'medium',
      desktop: 'large',
      default: 'default',
    }))

    expect(result.current).toBe('medium')
  })

  it('should return desktop value on desktop', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useResponsiveValue({
      mobile: 'small',
      tablet: 'medium',
      desktop: 'large',
      default: 'default',
    }))

    expect(result.current).toBe('large')
  })

  it('should fallback to default when value not defined', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 639px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useResponsiveValue({
      desktop: 'large',
      default: 'default',
    }))

    expect(result.current).toBe('default')
  })

  it('should fallback tablet to desktop value when tablet not defined', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 640px) and (max-width: 1023px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useResponsiveValue({
      desktop: 'large',
      default: 'default',
    }))

    expect(result.current).toBe('large')
  })
})
