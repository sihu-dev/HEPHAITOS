// ============================================
// WebSocket React Hook
// Real-time data connection management
// ============================================

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { WSManager, WSConfig, WSConnectionState, createWSManager } from '@/lib/websocket/ws-manager'
import type { WSMessage, WSSubscription, WSEventType, Ticker } from '@/lib/exchange/types'
import { useExchangeStore } from '@/stores'

// ============================================
// Types
// ============================================

interface UseWebSocketOptions {
  url: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  connectionState: WSConnectionState
  connect: () => void
  disconnect: () => void
  subscribe: (subscription: WSSubscription) => void
  unsubscribe: (subscription: WSSubscription) => void
  onMessage: (type: WSEventType, callback: (data: unknown) => void, symbol?: string) => () => void
  send: (data: unknown) => void
}

// ============================================
// Hook: useWebSocket
// ============================================

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, autoConnect = true, reconnectAttempts = 5, reconnectDelay = 1000 } = options

  const managerRef = useRef<WSManager | null>(null)
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected')
  const { setWsConnected, handleWsMessage } = useExchangeStore()

  // Initialize WebSocket manager
  useEffect(() => {
    const config: WSConfig = {
      url,
      exchangeId: 'binance', // Default, can be made configurable
      reconnectAttempts,
      reconnectDelay,
      onOpen: () => {
        setConnectionState('connected')
        setWsConnected(true)
      },
      onClose: () => {
        setConnectionState('disconnected')
        setWsConnected(false)
      },
      onError: (error) => {
        console.error('[useWebSocket] Error:', error)
      },
      onMessage: (message) => {
        handleWsMessage(message)
      },
      onReconnect: (attempt) => {
        setConnectionState('reconnecting')
        console.log(`[useWebSocket] Reconnecting... attempt ${attempt}`)
      },
    }

    managerRef.current = createWSManager(config)

    if (autoConnect) {
      managerRef.current.connect()
    }

    return () => {
      managerRef.current?.disconnect()
    }
  }, [url, autoConnect, reconnectAttempts, reconnectDelay, setWsConnected, handleWsMessage])

  // Connection methods
  const connect = useCallback(() => {
    managerRef.current?.connect()
  }, [])

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect()
  }, [])

  // Subscription methods
  const subscribe = useCallback((subscription: WSSubscription) => {
    managerRef.current?.subscribe(subscription)
  }, [])

  const unsubscribe = useCallback((subscription: WSSubscription) => {
    managerRef.current?.unsubscribe(subscription)
  }, [])

  // Message handling
  const onMessage = useCallback(
    (type: WSEventType, callback: (data: unknown) => void, symbol?: string) => {
      if (!managerRef.current) {
        return () => {}
      }
      return managerRef.current.onMessage(type, callback, symbol)
    },
    []
  )

  // Send method
  const send = useCallback((data: unknown) => {
    managerRef.current?.send(data)
  }, [])

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    onMessage,
    send,
  }
}

// ============================================
// Hook: useTickerStream
// Subscribe to ticker updates for symbols
// ============================================

interface UseTickerStreamOptions {
  symbols: string[]
  wsUrl?: string
}

interface UseTickerStreamReturn {
  tickers: Record<string, Ticker>
  isConnected: boolean
  subscribe: (symbol: string) => void
  unsubscribe: (symbol: string) => void
}

export function useTickerStream(options: UseTickerStreamOptions): UseTickerStreamReturn {
  const { symbols, wsUrl = 'wss://stream.binance.com:9443/ws' } = options

  const { tickers, updateTicker } = useExchangeStore()
  const subscribedRef = useRef<Set<string>>(new Set())

  const ws = useWebSocket({
    url: wsUrl,
    autoConnect: true,
  })

  // Subscribe to symbols
  useEffect(() => {
    if (!ws.isConnected) return

    // Capture ref at effect start for cleanup
    const subscribed = subscribedRef.current

    // Subscribe to new symbols
    for (const symbol of symbols) {
      if (!subscribed.has(symbol)) {
        ws.subscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
        subscribed.add(symbol)
      }
    }

    // Unsubscribe from removed symbols
    const toRemove: string[] = []
    for (const symbol of subscribed) {
      if (!symbols.includes(symbol)) {
        ws.unsubscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
        toRemove.push(symbol)
      }
    }
    toRemove.forEach((s) => subscribed.delete(s))

    // Cleanup on unmount
    return () => {
      subscribed.forEach((symbol) => {
        ws.unsubscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
      })
      subscribed.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, ws.isConnected, ws.subscribe, ws.unsubscribe])

  // Handle ticker updates
  useEffect(() => {
    const unsubscribe = ws.onMessage('ticker', (data) => {
      const tickerData = data as Partial<Ticker> & { s?: string }
      const symbol = tickerData.symbol || tickerData.s

      if (symbol) {
        const ticker: Ticker = {
          symbol,
          lastPrice: tickerData.lastPrice || 0,
          bidPrice: tickerData.bidPrice || 0,
          askPrice: tickerData.askPrice || 0,
          high24h: tickerData.high24h || 0,
          low24h: tickerData.low24h || 0,
          volume24h: tickerData.volume24h || 0,
          quoteVolume24h: tickerData.quoteVolume24h || 0,
          change24h: tickerData.change24h || 0,
          changePercent24h: tickerData.changePercent24h || 0,
          timestamp: Date.now(),
        }
        updateTicker(symbol, ticker)
      }
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.onMessage, updateTicker])

  const subscribeSymbol = useCallback(
    (symbol: string) => {
      if (ws.isConnected && !subscribedRef.current.has(symbol)) {
        ws.subscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
        subscribedRef.current.add(symbol)
      }
    },
    [ws]
  )

  const unsubscribeSymbol = useCallback(
    (symbol: string) => {
      if (ws.isConnected && subscribedRef.current.has(symbol)) {
        ws.unsubscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
        subscribedRef.current.delete(symbol)
      }
    },
    [ws]
  )

  return {
    tickers,
    isConnected: ws.isConnected,
    subscribe: subscribeSymbol,
    unsubscribe: unsubscribeSymbol,
  }
}

// ============================================
// Hook: useOrderBookStream
// Subscribe to orderbook updates
// ============================================

interface OrderBookData {
  bids: [number, number][]
  asks: [number, number][]
  lastUpdateId: number
}

interface UseOrderBookStreamReturn {
  orderBook: OrderBookData | null
  isConnected: boolean
}

export function useOrderBookStream(
  symbol: string,
  wsUrl?: string
): UseOrderBookStreamReturn {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null)

  const ws = useWebSocket({
    url: wsUrl || 'wss://stream.binance.com:9443/ws',
    autoConnect: true,
  })

  useEffect(() => {
    if (!ws.isConnected || !symbol) return

    ws.subscribe({ type: 'orderbook', symbol: symbol.toLowerCase() })

    const unsubscribe = ws.onMessage('orderbook', (data) => {
      const obData = data as OrderBookData
      setOrderBook(obData)
    }, symbol.toLowerCase())

    return () => {
      ws.unsubscribe({ type: 'orderbook', symbol: symbol.toLowerCase() })
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, ws.isConnected, ws.subscribe, ws.unsubscribe, ws.onMessage])

  return {
    orderBook,
    isConnected: ws.isConnected,
  }
}

// ============================================
// Hook: useRealtimePrice
// Simple hook for real-time price of single symbol
// ============================================

interface UseRealtimePriceReturn {
  price: number | null
  change24h: number | null
  changePercent24h: number | null
  isConnected: boolean
}

export function useRealtimePrice(symbol: string): UseRealtimePriceReturn {
  const [priceData, setPriceData] = useState<{
    price: number | null
    change24h: number | null
    changePercent24h: number | null
  }>({
    price: null,
    change24h: null,
    changePercent24h: null,
  })

  const ws = useWebSocket({
    url: 'wss://stream.binance.com:9443/ws',
    autoConnect: !!symbol,
  })

  useEffect(() => {
    if (!ws.isConnected || !symbol) return

    ws.subscribe({ type: 'ticker', symbol: symbol.toLowerCase() })

    const unsubscribe = ws.onMessage('ticker', (data) => {
      const tickerData = data as Partial<Ticker>
      setPriceData({
        price: tickerData.lastPrice || null,
        change24h: tickerData.change24h || null,
        changePercent24h: tickerData.changePercent24h || null,
      })
    }, symbol.toLowerCase())

    return () => {
      ws.unsubscribe({ type: 'ticker', symbol: symbol.toLowerCase() })
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, ws.isConnected, ws.subscribe, ws.unsubscribe, ws.onMessage])

  return {
    ...priceData,
    isConnected: ws.isConnected,
  }
}
