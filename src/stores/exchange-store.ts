// ============================================
// Exchange Store (Zustand)
// ============================================

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { ExchangeId } from '@/types'
import type { Ticker, AccountBalance, WSMessage } from '@/lib/exchange/types'

// Exchange Connection State
interface ExchangeConnection {
  exchangeId: ExchangeId
  apiKey: string
  secretKey: string
  isConnected: boolean
  lastConnected?: Date
  permissions: string[]
}

// Store State
interface ExchangeState {
  // Connections
  connections: ExchangeConnection[]
  activeExchange: ExchangeId | null

  // Market Data
  tickers: Record<string, Ticker>
  balances: Partial<Record<ExchangeId, AccountBalance>>

  // WebSocket
  wsConnected: boolean
  subscribedSymbols: string[]

  // Actions - Connections
  addConnection: (connection: Omit<ExchangeConnection, 'isConnected' | 'permissions'>) => void
  removeConnection: (exchangeId: ExchangeId) => void
  setActiveExchange: (exchangeId: ExchangeId | null) => void
  updateConnectionStatus: (exchangeId: ExchangeId, isConnected: boolean, permissions?: string[]) => void

  // Actions - Market Data
  updateTicker: (symbol: string, ticker: Ticker) => void
  updateTickers: (tickers: Record<string, Ticker>) => void
  updateBalance: (exchangeId: ExchangeId, balance: AccountBalance) => void

  // Actions - WebSocket
  setWsConnected: (connected: boolean) => void
  addSubscription: (symbol: string) => void
  removeSubscription: (symbol: string) => void
  handleWsMessage: (message: WSMessage) => void

  // Getters
  getConnection: (exchangeId: ExchangeId) => ExchangeConnection | undefined
  getTicker: (symbol: string) => Ticker | undefined
  getBalance: (exchangeId: ExchangeId) => AccountBalance | undefined
}

export const useExchangeStore = create<ExchangeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        connections: [],
        activeExchange: null,
        tickers: {},
        balances: {},
        wsConnected: false,
        subscribedSymbols: [],

        // Connection Actions
        addConnection: (connection) => {
          set((state) => ({
            connections: [
              ...state.connections.filter(c => c.exchangeId !== connection.exchangeId),
              {
                ...connection,
                isConnected: false,
                permissions: [],
              },
            ],
          }))
        },

        removeConnection: (exchangeId) => {
          set((state) => ({
            connections: state.connections.filter(c => c.exchangeId !== exchangeId),
            activeExchange: state.activeExchange === exchangeId ? null : state.activeExchange,
          }))
        },

        setActiveExchange: (exchangeId) => {
          set({ activeExchange: exchangeId })
        },

        updateConnectionStatus: (exchangeId, isConnected, permissions) => {
          set((state) => ({
            connections: state.connections.map(c =>
              c.exchangeId === exchangeId
                ? {
                    ...c,
                    isConnected,
                    permissions: permissions ?? c.permissions,
                    lastConnected: isConnected ? new Date() : c.lastConnected,
                  }
                : c
            ),
          }))
        },

        // Market Data Actions
        updateTicker: (symbol, ticker) => {
          set((state) => ({
            tickers: {
              ...state.tickers,
              [symbol]: ticker,
            },
          }))
        },

        updateTickers: (tickers) => {
          set((state) => ({
            tickers: {
              ...state.tickers,
              ...tickers,
            },
          }))
        },

        updateBalance: (exchangeId, balance) => {
          set((state) => ({
            balances: {
              ...state.balances,
              [exchangeId]: balance,
            },
          }))
        },

        // WebSocket Actions
        setWsConnected: (connected) => {
          set({ wsConnected: connected })
        },

        addSubscription: (symbol) => {
          set((state) => ({
            subscribedSymbols: state.subscribedSymbols.includes(symbol)
              ? state.subscribedSymbols
              : [...state.subscribedSymbols, symbol],
          }))
        },

        removeSubscription: (symbol) => {
          set((state) => ({
            subscribedSymbols: state.subscribedSymbols.filter(s => s !== symbol),
          }))
        },

        handleWsMessage: (message) => {
          if (message.type === 'ticker' && message.symbol && message.data) {
            set((state) => ({
              tickers: {
                ...state.tickers,
                [message.symbol!]: message.data as Ticker,
              },
            }))
          }
        },

        // Getters
        getConnection: (exchangeId) => {
          return get().connections.find(c => c.exchangeId === exchangeId)
        },

        getTicker: (symbol) => {
          return get().tickers[symbol]
        },

        getBalance: (exchangeId) => {
          return get().balances[exchangeId]
        },
      }),
      {
        name: 'hephaitos-exchange-store',
        partialize: (state) => ({
          connections: state.connections.map(c => ({
            ...c,
            // Don't persist secret key in localStorage for security
            secretKey: '',
          })),
          activeExchange: state.activeExchange,
        }),
      }
    ),
    { name: 'ExchangeStore' }
  )
)

// ========================================
// Selector Hooks for Optimized Re-renders
// ========================================

/** Select active exchange ID */
export const useActiveExchange = () => useExchangeStore(state => state.activeExchange)

/** Select all connections */
export const useConnections = () => useExchangeStore(state => state.connections)

/** Select all tickers */
export const useTickers = () => useExchangeStore(state => state.tickers)

/** Select WebSocket connection status */
export const useWsConnected = () => useExchangeStore(state => state.wsConnected)

/** Select subscribed symbols */
export const useSubscribedSymbols = () => useExchangeStore(state => state.subscribedSymbols)

/** Select balances */
export const useBalances = () => useExchangeStore(state => state.balances)

/** Select ticker by symbol */
export const useTickerBySymbol = (symbol: string) =>
  useExchangeStore(state => state.tickers[symbol])

/** Select connected exchanges count */
export const useConnectedExchangesCount = () =>
  useExchangeStore(state => state.connections.filter(c => c.isConnected).length)

/** Select connection by exchange ID */
export const useConnectionByExchange = (exchangeId: ExchangeId) =>
  useExchangeStore(state => state.connections.find(c => c.exchangeId === exchangeId))
