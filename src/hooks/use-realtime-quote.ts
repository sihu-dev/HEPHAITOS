// ============================================
// Real-time Quote Hook
// KIS WebSocket 실시간 시세를 React에서 사용
// ============================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Quote } from '@/lib/broker/types'

interface UseRealtimeQuoteOptions {
  /** 연결된 브로커 인스턴스 */
  broker?: {
    subscribeQuote: (stockCode: string, callback: (quote: Quote) => void) => () => void
    getQuote: (stockCode: string) => Promise<Quote>
  }
  /** 초기 데이터 로드 여부 */
  fetchInitial?: boolean
  /** 업데이트 디바운스 (ms) */
  debounceMs?: number
}

interface UseRealtimeQuoteResult {
  quote: Quote | null
  isLoading: boolean
  error: Error | null
  isConnected: boolean
  refresh: () => Promise<void>
}

/**
 * 실시간 시세 구독 Hook
 * 
 * @example
 * ```tsx
 * const { quote, isLoading, error } = useRealtimeQuote('005930', { broker })
 * ```
 */
export function useRealtimeQuote(
  stockCode: string | null,
  options: UseRealtimeQuoteOptions = {}
): UseRealtimeQuoteResult {
  const { broker, fetchInitial = true, debounceMs = 100 } = options

  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const lastUpdateRef = useRef<number>(0)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // 시세 업데이트 핸들러 (디바운스)
  const handleQuoteUpdate = useCallback((newQuote: Quote) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < debounceMs) return

    lastUpdateRef.current = now
    setQuote(newQuote)
    setIsConnected(true)
    setError(null)
  }, [debounceMs])

  // 수동 새로고침
  const refresh = useCallback(async () => {
    if (!stockCode || !broker) return

    setIsLoading(true)
    try {
      const data = await broker.getQuote(stockCode)
      setQuote(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('시세 조회 실패'))
    } finally {
      setIsLoading(false)
    }
  }, [stockCode, broker])

  // 구독 설정
  useEffect(() => {
    if (!stockCode) {
      setQuote(null)
      return
    }

    // 초기 데이터 로드
    if (fetchInitial && broker) {
      refresh()
    }

    // 실시간 구독
    if (broker) {
      unsubscribeRef.current = broker.subscribeQuote(stockCode, handleQuoteUpdate)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setIsConnected(false)
    }
  }, [stockCode, broker, fetchInitial, handleQuoteUpdate, refresh])

  return {
    quote,
    isLoading,
    error,
    isConnected,
    refresh,
  }
}

/**
 * 여러 종목 실시간 시세 구독 Hook
 */
export function useRealtimeQuotes(
  stockCodes: string[],
  options: UseRealtimeQuoteOptions = {}
): Map<string, UseRealtimeQuoteResult> {
  const { broker, debounceMs = 100 } = options

  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())
  const [connected, setConnected] = useState<Set<string>>(new Set())

  const unsubscribesRef = useRef<Map<string, () => void>>(new Map())
  const lastUpdatesRef = useRef<Map<string, number>>(new Map())

  // 구독 설정
  useEffect(() => {
    if (!broker) return

    // 새로운 종목 구독
    stockCodes.forEach((code) => {
      if (unsubscribesRef.current.has(code)) return

      const handleUpdate = (quote: Quote) => {
        const now = Date.now()
        const lastUpdate = lastUpdatesRef.current.get(code) || 0
        if (now - lastUpdate < debounceMs) return

        lastUpdatesRef.current.set(code, now)
        setQuotes((prev) => new Map(prev).set(code, quote))
        setConnected((prev) => new Set(prev).add(code))
        setErrors((prev) => {
          const next = new Map(prev)
          next.delete(code)
          return next
        })
      }

      const unsubscribe = broker.subscribeQuote(code, handleUpdate)
      unsubscribesRef.current.set(code, unsubscribe)
    })

    // 제거된 종목 구독 해제
    unsubscribesRef.current.forEach((unsubscribe, code) => {
      if (!stockCodes.includes(code)) {
        unsubscribe()
        unsubscribesRef.current.delete(code)
        setConnected((prev) => {
          const next = new Set(prev)
          next.delete(code)
          return next
        })
      }
    })

    // Capture ref value for cleanup
    const unsubscribesMap = unsubscribesRef.current
    return () => {
      unsubscribesMap.forEach((unsubscribe) => unsubscribe())
      unsubscribesMap.clear()
    }
  }, [stockCodes, broker, debounceMs])

  // 결과 맵 구성
  const results = new Map<string, UseRealtimeQuoteResult>()
  stockCodes.forEach((code) => {
    results.set(code, {
      quote: quotes.get(code) || null,
      isLoading: loading.has(code),
      error: errors.get(code) || null,
      isConnected: connected.has(code),
      refresh: async () => {
        if (!broker) return
        setLoading((prev) => new Set(prev).add(code))
        try {
          const data = await broker.getQuote(code)
          setQuotes((prev) => new Map(prev).set(code, data))
        } catch (e) {
          setErrors((prev) => new Map(prev).set(code, e instanceof Error ? e : new Error('시세 조회 실패')))
        } finally {
          setLoading((prev) => {
            const next = new Set(prev)
            next.delete(code)
            return next
          })
        }
      },
    })
  })

  return results
}

export default useRealtimeQuote
