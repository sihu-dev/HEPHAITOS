'use client'

import { useState, useCallback } from 'react'

interface UserHolding {
  symbol: string
  value: number
}

interface ComparisonResult {
  symbol: string
  name: string
  celebrityWeight: number
  userWeight: number
  difference: number
  suggestion: 'buy' | 'sell' | 'hold'
}

interface ComparisonData {
  celebrity: {
    id: string
    name: string
    performance: {
      ytd: number
      oneMonth: number
      threeMonth: number
      oneYear: number
      sharpeRatio?: number
      maxDrawdown?: number
    }
  }
  comparison: ComparisonResult[]
  summary: {
    totalSymbols: number
    buys: number
    sells: number
    holds: number
    syncScore: number
  }
}

interface UsePortfolioCompareReturn {
  compare: (celebrityId: string, userHoldings: UserHolding[]) => Promise<ComparisonData>
  sync: (celebrityId: string, syncItems: ComparisonResult[]) => Promise<void>
  loading: boolean
  error: string | null
}

/**
 * Hook for portfolio comparison
 */
export function usePortfolioCompare(): UsePortfolioCompareReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(async (
    celebrityId: string,
    userHoldings: UserHolding[]
  ): Promise<ComparisonData> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/portfolio/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityId, userHoldings }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to compare portfolios')
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sync = useCallback(async (
    celebrityId: string,
    syncItems: ComparisonResult[]
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/portfolio/compare', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityId, syncItems }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync portfolio')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { compare, sync, loading, error }
}
