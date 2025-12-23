// ============================================
// WebSocket React Hook
// Real-time data connection management
// ============================================

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { WSManager, WSConfig, WSConnectionState, createWSManager } from '@/lib/websocket/ws-manager'
import type { WSMessage, WSSubscription, WSEventType, Ticker } from '@/lib/exchange/types'
import { useExchangeStore } from '@/stores'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  getTickerStreamName,
  formatSubscribeMessage,
  formatUnsubscribeMessage,
  parseBinanceMessage,
} from '@/lib/websocket/binance-adapter'

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
        safeLogger.error('[useWebSocket] Error:', error)
      },
      onMessage: (message) => {
        handleWsMessage(message)
      },
      onReconnect: (attempt) => {
        setConnectionState('reconnecting')
        safeLogger.info(`[useWebSocket] Reconnecting... attempt ${attempt}`)
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
// Uses direct Binance WebSocket with proper protocol
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
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const subscribedRef = useRef<Set<string>>(new Set())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        safeLogger.info('[BinanceWS] Connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0

        // Resubscribe to existing symbols
        if (subscribedRef.current.size > 0) {
          const streams = Array.from(subscribedRef.current).map(s => getTickerStreamName(s))
          const message = formatSubscribeMessage(streams)
          wsRef.current?.send(message)
        }
      }

      wsRef.current.onmessage = (event) => {
        const message = parseBinanceMessage(event.data)
        if (message && message.type === 'ticker') {
          const tickerData = message.data as Ticker
          updateTicker(tickerData.symbol, tickerData)
        }
      }

      wsRef.current.onclose = () => {
        safeLogger.info('[BinanceWS] Disconnected')
        setIsConnected(false)

        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        safeLogger.error('[BinanceWS] Error:', error)
      }
    } catch (error) {
      safeLogger.error('[BinanceWS] Connection failed:', error)
    }
  }, [wsUrl, updateTicker])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Subscribe to a symbol
  const subscribeSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    if (subscribedRef.current.has(upperSymbol)) return

    subscribedRef.current.add(upperSymbol)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = formatSubscribeMessage([getTickerStreamName(upperSymbol)])
      wsRef.current.send(message)
    }
  }, [])

  // Unsubscribe from a symbol
  const unsubscribeSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    if (!subscribedRef.current.has(upperSymbol)) return

    subscribedRef.current.delete(upperSymbol)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = formatUnsubscribeMessage([getTickerStreamName(upperSymbol)])
      wsRef.current.send(message)
    }
  }, [])

  // Initial connection
  useEffect(() => {
    if (symbols.length > 0) {
      connect()
    }
    return () => disconnect()
  }, [connect, disconnect, symbols.length])

  // Handle symbol changes
  useEffect(() => {
    if (!isConnected) return

    const currentSymbols = new Set(symbols.map(s => s.toUpperCase()))

    // Subscribe to new symbols
    for (const symbol of currentSymbols) {
      if (!subscribedRef.current.has(symbol)) {
        subscribeSymbol(symbol)
      }
    }

    // Unsubscribe from removed symbols
    for (const symbol of subscribedRef.current) {
      if (!currentSymbols.has(symbol)) {
        unsubscribeSymbol(symbol)
      }
    }
  }, [symbols, isConnected, subscribeSymbol, unsubscribeSymbol])

  return {
    tickers,
    isConnected,
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
