'use client'

import { useState, useCallback } from 'react'

interface StrategyConfig {
  name: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  investmentGoal: 'growth' | 'income' | 'balanced' | 'preservation'
  timeHorizon: 'short' | 'medium' | 'long'
  preferredSectors: string[]
  excludedSectors: string[]
  maxPositionSize: number
  stopLossPercent: number
  takeProfitPercent: number
}

interface GeneratedStrategy {
  id: string
  name: string
  description: string
  signals: {
    type: 'entry' | 'exit'
    condition: string
    indicator: string
    value: string
  }[]
  backtestResult: {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    totalTrades: number
  }
  aiInsights: string
  createdAt: Date
}

interface RecentStrategy {
  id: string
  name: string
  totalReturn: number
  trades: number
  createdAt: Date
}

interface UseAIStrategyReturn {
  generateStrategy: (config: StrategyConfig) => Promise<GeneratedStrategy>
  getRecentStrategies: () => Promise<RecentStrategy[]>
  loading: boolean
  error: string | null
}

/**
 * Hook for AI strategy generation
 */
export function useAIStrategy(): UseAIStrategyReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStrategy = useCallback(async (config: StrategyConfig): Promise<GeneratedStrategy> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate strategy')
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

  const getRecentStrategies = useCallback(async (): Promise<RecentStrategy[]> => {
    try {
      const response = await fetch('/api/ai/strategy')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get strategies')
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    }
  }, [])

  return { generateStrategy, getRecentStrategies, loading, error }
}
