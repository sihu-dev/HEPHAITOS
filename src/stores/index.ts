// ============================================
// Zustand Store Exports
// ============================================

// Main stores
export { useStrategyStore } from './strategy-store'
export { usePortfolioStore } from './portfolio-store'
export { useExchangeStore } from './exchange-store'
export { useUIStore } from './ui-store'

// Selector hooks from strategy store
export {
  useStrategies,
  useActiveStrategy,
  useRunningStrategies,
  useStrategyById,
  useStrategyLoading,
  useStrategyError,
  useStrategyCount,
} from './strategy-store'

// Selector hooks from portfolio store
export {
  usePortfolio,
  useTrades,
  useMarketData,
  usePortfolioLoading,
  usePortfolioError,
} from './portfolio-store'

// Selector hooks from exchange store
export {
  useActiveExchange,
  useConnections,
  useTickers,
  useWsConnected,
  useSubscribedSymbols,
  useBalances,
  useTickerBySymbol,
  useConnectedExchangesCount,
  useConnectionByExchange,
} from './exchange-store'

// Selector hooks from UI store
export {
  useSidebarCollapsed,
  useMobileMenuOpen,
  useTheme,
  useNotifications,
  useGlobalLoading,
  useActiveModal,
  useModalData,
  useCommandPaletteOpen,
  useSidebarActions,
  useNotificationActions,
  useModalActions,
} from './ui-store'

// Types
export type {
  // Base types
  AsyncState,
  AsyncActions,
  // Strategy types
  StrategyStore,
  StrategyStoreState,
  StrategyStoreSyncActions,
  StrategyStoreAsyncActions,
  CreateStrategyInput,
  // Portfolio types
  PortfolioStore,
  PortfolioStoreState,
  PortfolioStoreSyncActions,
  PortfolioStoreAsyncActions,
  PortfolioStoreComputed,
  // Exchange types
  ExchangeStore,
  ExchangeStoreState,
  ExchangeConnection,
  AddConnectionInput,
  // UI types
  UIStore,
  UIStoreState,
  UIStoreActions,
  Theme,
  SidebarState,
  ModalState,
  Toast,
  // Selector type
  Selector,
} from './types'

// Selectors
export {
  strategySelectors,
  portfolioSelectors,
  exchangeSelectors,
} from './types'
