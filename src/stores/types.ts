// ============================================
// Zustand Store Type Definitions
// ============================================

import type {
  Strategy,
  StrategyStatus,
  Portfolio,
  Position,
  Trade,
  MarketData,
  ExchangeId,
} from '@/types'
import type { Ticker, AccountBalance, WSMessage } from '@/lib/exchange/types'

// ============================================
// Base Store Types
// ============================================

/**
 * Common loading/error state for async stores
 */
export interface AsyncState {
  isLoading: boolean
  error: string | null
}

/**
 * Common actions for loading/error management
 */
export interface AsyncActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// ============================================
// Strategy Store Types
// ============================================

/**
 * Strategy store state (data only)
 */
export interface StrategyStoreState extends AsyncState {
  strategies: Strategy[]
  activeStrategy: Strategy | null
}

/**
 * Strategy store sync actions
 */
export interface StrategyStoreSyncActions {
  setStrategies: (strategies: Strategy[]) => void
  addStrategy: (strategy: Strategy) => void
  updateStrategy: (id: string, updates: Partial<Strategy>) => void
  deleteStrategy: (id: string) => void
  setActiveStrategy: (strategy: Strategy | null) => void
  updateStrategyStatus: (id: string, status: StrategyStatus) => void
}

/**
 * Strategy store async actions
 */
export interface StrategyStoreAsyncActions {
  fetchStrategies: () => Promise<void>
  createStrategy: (data: CreateStrategyInput) => Promise<Strategy>
  saveStrategy: (id: string) => Promise<void>
}

/**
 * Input type for creating a new strategy
 */
export interface CreateStrategyInput {
  name: string
  description?: string
  config?: Partial<Strategy['config']>
}

/**
 * Complete strategy store type
 */
export type StrategyStore = StrategyStoreState &
  StrategyStoreSyncActions &
  StrategyStoreAsyncActions &
  AsyncActions

// ============================================
// Portfolio Store Types
// ============================================

/**
 * Portfolio store state (data only)
 */
export interface PortfolioStoreState extends AsyncState {
  portfolio: Portfolio | null
  trades: Trade[]
  marketData: MarketData[]
}

/**
 * Portfolio store sync actions
 */
export interface PortfolioStoreSyncActions {
  setPortfolio: (portfolio: Portfolio) => void
  updatePosition: (symbol: string, updates: Partial<Position>) => void
  addTrade: (trade: Trade) => void
  setTrades: (trades: Trade[]) => void
  setMarketData: (data: MarketData[]) => void
  updateMarketPrice: (symbol: string, price: number, change: number) => void
}

/**
 * Portfolio store async actions
 */
export interface PortfolioStoreAsyncActions {
  fetchPortfolio: () => Promise<void>
  fetchTrades: (limit?: number) => Promise<void>
  fetchMarketData: () => Promise<void>
}

/**
 * Portfolio store computed values
 */
export interface PortfolioStoreComputed {
  getTotalPnl: () => number
  getWinRate: () => number
}

/**
 * Complete portfolio store type
 */
export type PortfolioStore = PortfolioStoreState &
  PortfolioStoreSyncActions &
  PortfolioStoreAsyncActions &
  PortfolioStoreComputed &
  AsyncActions

// ============================================
// Exchange Store Types
// ============================================

/**
 * Exchange connection data
 */
export interface ExchangeConnection {
  exchangeId: ExchangeId
  apiKey: string
  secretKey: string
  isConnected: boolean
  lastConnected?: Date
  permissions: string[]
}

/**
 * Input for adding a new exchange connection
 */
export interface AddConnectionInput {
  exchangeId: ExchangeId
  apiKey: string
  secretKey: string
}

/**
 * Exchange store state (data only)
 */
export interface ExchangeStoreState {
  connections: ExchangeConnection[]
  activeExchange: ExchangeId | null
  tickers: Record<string, Ticker>
  balances: Partial<Record<ExchangeId, AccountBalance>>
  wsConnected: boolean
  subscribedSymbols: string[]
}

/**
 * Exchange store connection actions
 */
export interface ExchangeStoreConnectionActions {
  addConnection: (connection: AddConnectionInput) => void
  removeConnection: (exchangeId: ExchangeId) => void
  setActiveExchange: (exchangeId: ExchangeId | null) => void
  updateConnectionStatus: (
    exchangeId: ExchangeId,
    isConnected: boolean,
    permissions?: string[]
  ) => void
}

/**
 * Exchange store market data actions
 */
export interface ExchangeStoreMarketActions {
  updateTicker: (symbol: string, ticker: Ticker) => void
  updateTickers: (tickers: Record<string, Ticker>) => void
  updateBalance: (exchangeId: ExchangeId, balance: AccountBalance) => void
}

/**
 * Exchange store WebSocket actions
 */
export interface ExchangeStoreWsActions {
  setWsConnected: (connected: boolean) => void
  addSubscription: (symbol: string) => void
  removeSubscription: (symbol: string) => void
  handleWsMessage: (message: WSMessage) => void
}

/**
 * Exchange store getter functions
 */
export interface ExchangeStoreGetters {
  getConnection: (exchangeId: ExchangeId) => ExchangeConnection | undefined
  getTicker: (symbol: string) => Ticker | undefined
  getBalance: (exchangeId: ExchangeId) => AccountBalance | undefined
}

/**
 * Complete exchange store type
 */
export type ExchangeStore = ExchangeStoreState &
  ExchangeStoreConnectionActions &
  ExchangeStoreMarketActions &
  ExchangeStoreWsActions &
  ExchangeStoreGetters

// ============================================
// UI Store Types
// ============================================

/**
 * Theme types
 */
export type Theme = 'dark' | 'light' | 'system'

/**
 * Sidebar state
 */
export interface SidebarState {
  isCollapsed: boolean
  activeItem: string | null
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean
  modalId: string | null
  data?: unknown
}

/**
 * Toast/Notification
 */
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

/**
 * UI Store state
 */
export interface UIStoreState {
  theme: Theme
  sidebar: SidebarState
  modal: ModalState
  toasts: Toast[]
  isMobileMenuOpen: boolean
}

/**
 * UI Store actions
 */
export interface UIStoreActions {
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveItem: (item: string | null) => void
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  toggleMobileMenu: () => void
}

/**
 * Complete UI store type
 */
export type UIStore = UIStoreState & UIStoreActions

// ============================================
// Store Selector Types
// ============================================

/**
 * Generic selector function type
 */
export type Selector<TState, TResult> = (state: TState) => TResult

/**
 * Strategy store selectors
 */
export const strategySelectors = {
  selectStrategies: (state: StrategyStore) => state.strategies,
  selectActiveStrategy: (state: StrategyStore) => state.activeStrategy,
  selectIsLoading: (state: StrategyStore) => state.isLoading,
  selectError: (state: StrategyStore) => state.error,
  selectRunningStrategies: (state: StrategyStore) =>
    state.strategies.filter(s => s.status === 'running'),
  selectStrategyById: (id: string) => (state: StrategyStore) =>
    state.strategies.find(s => s.id === id),
}

/**
 * Portfolio store selectors
 */
export const portfolioSelectors = {
  selectPortfolio: (state: PortfolioStore) => state.portfolio,
  selectTrades: (state: PortfolioStore) => state.trades,
  selectMarketData: (state: PortfolioStore) => state.marketData,
  selectPositions: (state: PortfolioStore) => state.portfolio?.positions ?? [],
  selectTotalValue: (state: PortfolioStore) => state.portfolio?.totalValue ?? 0,
}

/**
 * Exchange store selectors
 */
export const exchangeSelectors = {
  selectConnections: (state: ExchangeStore) => state.connections,
  selectActiveExchange: (state: ExchangeStore) => state.activeExchange,
  selectTickers: (state: ExchangeStore) => state.tickers,
  selectWsConnected: (state: ExchangeStore) => state.wsConnected,
  selectConnectedExchanges: (state: ExchangeStore) =>
    state.connections.filter(c => c.isConnected),
}
