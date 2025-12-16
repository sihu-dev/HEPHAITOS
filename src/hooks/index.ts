// ============================================
// Custom Hooks Export
// ============================================

// Strategy hooks
export { useStrategyPersistence } from './use-strategy-persistence'
export { useUndoRedo } from './use-undo-redo'

// WebSocket hooks
export {
  useWebSocket,
  useTickerStream,
  useOrderBookStream,
  useRealtimePrice,
} from './use-websocket'

// Real-time Quote hooks (KIS WebSocket)
export {
  useRealtimeQuote,
  useRealtimeQuotes,
} from './use-realtime-quote'

// Backtest hooks
export { useBacktest, useBacktestHistory } from './use-backtest'
export type { BacktestStatus } from './use-backtest'

// Utility hooks
export {
  useDebounce,
  useDebouncedCallback,
  useLeadingDebounce,
} from './use-debounce'

export {
  useLocalStorage,
  getLocalStorageValue,
  setLocalStorageValue,
} from './use-local-storage'

export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeDesktop,
  useBreakpoint,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  usePrefersHighContrast,
  useResponsiveValue,
} from './use-media-query'
export type { Breakpoint } from './use-media-query'

export {
  useKeyPress,
  useKeyBindings,
  useEscapeKey,
  useEnterKey,
  useAppShortcuts,
} from './use-keyboard'

export {
  useClickOutside,
  useClickOutsideMultiple,
} from './use-click-outside'

export {
  useAsync,
  useFetch,
  useMutation,
} from './use-async'

// Copy-Learn-Build hooks
export { useCelebrities, useCelebrityDetail, useMirrorSetup } from './use-celebrities'
export { useAIStrategy } from './use-ai-strategy'
export { useCoaching } from './use-coaching'
export { usePortfolioCompare } from './use-portfolio-compare'

// Notification hooks
export {
  useNotifications,
  usePriceAlerts,
  useStrategySignals,
  useCelebrityTradeAlerts,
} from './use-notifications'

// Onboarding hooks
export { useOnboarding } from './use-onboarding'
export type { UserProfile, OnboardingData } from './use-onboarding'
