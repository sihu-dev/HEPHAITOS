// ============================================
// Media Query Hook
// Responsive design utilities
// ============================================

'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Check if a media query matches
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Predefined breakpoint hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}

/**
 * Get current breakpoint
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop'

export function useBreakpoint(): Breakpoint {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isLargeDesktop = useIsLargeDesktop()

  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  if (isLargeDesktop) return 'largeDesktop'
  return 'desktop'
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Check if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Check if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)')
}

/**
 * Responsive value selector
 * @param values - Object with breakpoint values
 */
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  largeDesktop?: T
  default: T
}): T {
  const breakpoint = useBreakpoint()

  switch (breakpoint) {
    case 'mobile':
      return values.mobile ?? values.default
    case 'tablet':
      return values.tablet ?? values.desktop ?? values.default
    case 'largeDesktop':
      return values.largeDesktop ?? values.desktop ?? values.default
    default:
      return values.desktop ?? values.default
  }
}

export default useMediaQuery
