import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Portfolio, Position, Trade, MarketData } from '@/types'
import { apiClient, getErrorMessage } from '@/lib/api-client'
import { safeLogger } from '@/lib/utils/safe-logger'
import type {
  PortfolioStore,
  PortfolioStoreState,
  PortfolioStoreSyncActions,
  PortfolioStoreAsyncActions,
  PortfolioStoreComputed,
} from './types'

export const usePortfolioStore = create<PortfolioStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      portfolio: null,
      trades: [],
      marketData: [],
      isLoading: false,
      error: null,

      // Sync Actions
      setPortfolio: (portfolio) =>
        set({ portfolio }, false, 'setPortfolio'),

      updatePosition: (symbol, updates) =>
        set((state) => {
          if (!state.portfolio) return state
          return {
            portfolio: {
              ...state.portfolio,
              positions: state.portfolio.positions.map((p) =>
                p.symbol === symbol ? { ...p, ...updates } : p
              ),
            },
          }
        }, false, 'updatePosition'),

      addTrade: (trade) =>
        set((state) => ({
          trades: [trade, ...state.trades],
        }), false, 'addTrade'),

      setTrades: (trades) =>
        set({ trades }, false, 'setTrades'),

      setMarketData: (data) =>
        set({ marketData: data }, false, 'setMarketData'),

      updateMarketPrice: (symbol, price, change) =>
        set((state) => ({
          marketData: state.marketData.map((m) =>
            m.symbol === symbol ? { ...m, price, change24h: change } : m
          ),
        }), false, 'updateMarketPrice'),

      // Async Actions with apiClient
      fetchPortfolio: async () => {
        set({ isLoading: true, error: null }, false, 'fetchPortfolio/pending')
        try {
          const portfolio = await apiClient.get<Portfolio>('/api/portfolio')
          set(
            { portfolio, isLoading: false },
            false,
            'fetchPortfolio/fulfilled'
          )
        } catch (error) {
          const message = getErrorMessage(error)
          set(
            { error: message, isLoading: false },
            false,
            'fetchPortfolio/rejected'
          )
        }
      },

      fetchTrades: async (limit = 50) => {
        set({ isLoading: true, error: null }, false, 'fetchTrades/pending')
        try {
          const trades = await apiClient.get<Trade[]>(`/api/trades?limit=${limit}`)
          set(
            { trades, isLoading: false },
            false,
            'fetchTrades/fulfilled'
          )
        } catch (error) {
          const message = getErrorMessage(error)
          set(
            { error: message, isLoading: false },
            false,
            'fetchTrades/rejected'
          )
        }
      },

      fetchMarketData: async () => {
        try {
          const marketData = await apiClient.get<MarketData[]>('/api/market')
          set({ marketData }, false, 'fetchMarketData/fulfilled')
        } catch (error) {
          // Silent fail for market data - non-critical
          safeLogger.error('Failed to fetch market data:', getErrorMessage(error))
        }
      },

      // Computed Values
      getTotalPnl: () => {
        const { trades } = get()
        return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      },

      getWinRate: () => {
        const { trades } = get()
        const completedTrades = trades.filter((t) => t.pnl !== undefined)
        if (completedTrades.length === 0) return 0
        const winningTrades = completedTrades.filter((t) => (t.pnl || 0) > 0)
        return (winningTrades.length / completedTrades.length) * 100
      },

      // UI State Actions
      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),
      setError: (error) =>
        set({ error }, false, 'setError'),
      clearError: () =>
        set({ error: null }, false, 'clearError'),
    }),
    { name: 'PortfolioStore' }
  )
)

// Selector hooks for optimized re-renders
export const usePortfolio = () => usePortfolioStore((state) => state.portfolio)
export const useTrades = () => usePortfolioStore((state) => state.trades)
export const useMarketData = () => usePortfolioStore((state) => state.marketData)
export const usePortfolioLoading = () => usePortfolioStore((state) => state.isLoading)
export const usePortfolioError = () => usePortfolioStore((state) => state.error)
