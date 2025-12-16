// ============================================
// Utils Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCompactNumber,
  formatCurrency,
  formatPercentage,
  delay,
  generateId,
  debounce,
  throttle,
} from '@/lib/utils'

describe('cn (className merger)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('should resolve Tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})

describe('formatCompactNumber', () => {
  it('should format billions', () => {
    expect(formatCompactNumber(1500000000)).toBe('1.5B')
    expect(formatCompactNumber(1000000000)).toBe('1.0B')
  })

  it('should format millions', () => {
    expect(formatCompactNumber(2500000)).toBe('2.5M')
    expect(formatCompactNumber(1000000)).toBe('1.0M')
  })

  it('should format thousands', () => {
    expect(formatCompactNumber(5500)).toBe('5.5K')
    expect(formatCompactNumber(1000)).toBe('1.0K')
  })

  it('should return raw number for small values', () => {
    expect(formatCompactNumber(999)).toBe('999')
    expect(formatCompactNumber(0)).toBe('0')
  })
})

describe('formatCurrency', () => {
  it('should format KRW by default', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1,000,000')
  })

  it('should format with different currencies', () => {
    const result = formatCurrency(1000, 'USD')
    expect(result).toContain('1,000')
  })

  it('should handle zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

describe('formatPercentage', () => {
  it('should add + sign for positive values', () => {
    expect(formatPercentage(5.25)).toBe('+5.25%')
    expect(formatPercentage(0)).toBe('+0.00%')
  })

  it('should not add sign for negative values', () => {
    expect(formatPercentage(-3.5)).toBe('-3.50%')
  })

  it('should respect decimal places', () => {
    expect(formatPercentage(5.2567, 1)).toBe('+5.3%')
    expect(formatPercentage(5.2567, 3)).toBe('+5.257%')
  })
})

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should resolve after specified time', async () => {
    const promise = delay(1000)
    vi.advanceTimersByTime(1000)
    await expect(promise).resolves.toBeUndefined()
  })
})

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should use custom prefix', () => {
    const id = generateId('custom')
    expect(id).toMatch(/^custom-[a-z0-9]+$/)
  })

  it('should use default prefix', () => {
    const id = generateId()
    expect(id).toMatch(/^id-[a-z0-9]+$/)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce function calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    vi.advanceTimersByTime(50)
    debouncedFn()
    vi.advanceTimersByTime(50)
    debouncedFn()
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments correctly', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('arg1', 'arg2')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle function calls', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should allow calls after throttle period', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttledFn()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should pass arguments correctly', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn('arg1', 'arg2')

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
