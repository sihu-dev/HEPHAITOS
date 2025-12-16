'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  CelebrityProfile,
  CelebrityPortfolio,
  TradeActivity,
} from '@/lib/mirroring/celebrity-portfolio'

interface CelebrityWithPerformance extends CelebrityProfile {
  performance: CelebrityPortfolio['performance'] | null
}

interface CelebrityDetail {
  celebrity: CelebrityProfile
  portfolio: CelebrityPortfolio | null
  recentTrades: TradeActivity[]
}

interface UseCelebritiesReturn {
  celebrities: CelebrityWithPerformance[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseCelebrityDetailReturn {
  data: CelebrityDetail | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch all celebrities with performance data
 */
export function useCelebrities(): UseCelebritiesReturn {
  const [celebrities, setCelebrities] = useState<CelebrityWithPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCelebrities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/celebrities')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch celebrities')
      }

      setCelebrities(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCelebrities()
  }, [fetchCelebrities])

  return { celebrities, loading, error, refetch: fetchCelebrities }
}

/**
 * Hook to fetch specific celebrity detail
 */
export function useCelebrityDetail(celebrityId: string | null): UseCelebrityDetailReturn {
  const [data, setData] = useState<CelebrityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!celebrityId) {
      setData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/celebrities?id=${celebrityId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch celebrity detail')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [celebrityId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { data, loading, error, refetch: fetchDetail }
}

/**
 * Hook to setup mirroring
 */
export function useMirrorSetup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setupMirror = async (celebrityId: string, investmentAmount: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/celebrities/mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celebrityId,
          investmentAmount,
          autoMirror: true,
          notifyOnTrade: true,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to setup mirroring')
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { setupMirror, loading, error }
}
