// ============================================
// Backtest React Hook
// Run and manage backtests
// ============================================

'use client'

import { useState, useCallback, useRef } from 'react'
import {
  BacktestEngine,
  createBacktestEngine,
  type BacktestConfig,
  type BacktestResult,
  type BacktestProgress,
} from '@/lib/backtest'
import type { OHLCV } from '@/types'

// ============================================
// Types
// ============================================

export type BacktestStatus = 'idle' | 'loading' | 'running' | 'completed' | 'failed' | 'cancelled'

interface UseBacktestReturn {
  status: BacktestStatus
  progress: BacktestProgress | null
  result: BacktestResult | null
  error: string | null
  run: (config: BacktestConfig, data: OHLCV[]) => Promise<BacktestResult | null>
  cancel: () => void
  reset: () => void
}

// ============================================
// Hook
// ============================================

export function useBacktest(): UseBacktestReturn {
  const [status, setStatus] = useState<BacktestStatus>('idle')
  const [progress, setProgress] = useState<BacktestProgress | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const engineRef = useRef<BacktestEngine | null>(null)
  const cancelledRef = useRef(false)

  /**
   * Run backtest
   */
  const run = useCallback(async (
    config: BacktestConfig,
    data: OHLCV[]
  ): Promise<BacktestResult | null> => {
    cancelledRef.current = false
    setStatus('loading')
    setError(null)
    setProgress(null)
    setResult(null)

    try {
      // Create engine
      const engine = createBacktestEngine(config)
      engineRef.current = engine

      // Set data
      engine.setData(data)

      // Set progress callback
      engine.onProgress((p) => {
        if (cancelledRef.current) return
        setProgress(p)
        setStatus('running')
      })

      // Run backtest
      const backtestResult = await engine.run()

      if (cancelledRef.current) {
        setStatus('cancelled')
        return null
      }

      if (backtestResult.status === 'failed') {
        setStatus('failed')
        setError(backtestResult.error || 'Backtest failed')
        return null
      }

      setStatus('completed')
      setResult(backtestResult)
      return backtestResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setStatus('failed')
      setError(message)
      return null
    }
  }, [])

  /**
   * Cancel running backtest
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true
    setStatus('cancelled')
  }, [])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancelledRef.current = false
    engineRef.current = null
    setStatus('idle')
    setProgress(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    status,
    progress,
    result,
    error,
    run,
    cancel,
    reset,
  }
}

// ============================================
// Hook: useBacktestHistory
// Manage backtest history
// ============================================

interface BacktestHistoryEntry {
  id: string
  config: BacktestConfig
  result: BacktestResult
  createdAt: Date
}

interface UseBacktestHistoryReturn {
  history: BacktestHistoryEntry[]
  add: (config: BacktestConfig, result: BacktestResult) => string
  remove: (id: string) => void
  clear: () => void
  getById: (id: string) => BacktestHistoryEntry | undefined
}

export function useBacktestHistory(maxItems: number = 50): UseBacktestHistoryReturn {
  const [history, setHistory] = useState<BacktestHistoryEntry[]>([])

  const add = useCallback((config: BacktestConfig, result: BacktestResult): string => {
    const id = `backtest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const entry: BacktestHistoryEntry = {
      id,
      config,
      result,
      createdAt: new Date(),
    }

    setHistory((prev) => {
      const updated = [entry, ...prev]
      // Limit history size
      return updated.slice(0, maxItems)
    })

    return id
  }, [maxItems])

  const remove = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clear = useCallback(() => {
    setHistory([])
  }, [])

  const getById = useCallback((id: string): BacktestHistoryEntry | undefined => {
    return history.find((e) => e.id === id)
  }, [history])

  return {
    history,
    add,
    remove,
    clear,
    getById,
  }
}
