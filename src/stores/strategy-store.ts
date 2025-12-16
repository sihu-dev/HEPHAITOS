// ============================================
// Strategy Store (Zustand)
// ============================================

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Strategy, StrategyStatus } from '@/types'
import type {
  StrategyStore,
  CreateStrategyInput,
  strategySelectors,
} from './types'

/**
 * Strategy management store with persist middleware
 */
export const useStrategyStore = create<StrategyStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ========================================
        // Initial State
        // ========================================
        strategies: [],
        activeStrategy: null,
        isLoading: false,
        error: null,

        // ========================================
        // Sync Actions
        // ========================================

        setStrategies: (strategies: Strategy[]) => {
          set({ strategies }, false, 'setStrategies')
        },

        addStrategy: (strategy: Strategy) => {
          set(
            (state) => ({
              strategies: [...state.strategies, strategy],
            }),
            false,
            'addStrategy'
          )
        },

        updateStrategy: (id: string, updates: Partial<Strategy>) => {
          set(
            (state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id
                  ? { ...s, ...updates, updatedAt: new Date() }
                  : s
              ),
              activeStrategy:
                state.activeStrategy?.id === id
                  ? { ...state.activeStrategy, ...updates, updatedAt: new Date() }
                  : state.activeStrategy,
            }),
            false,
            'updateStrategy'
          )
        },

        deleteStrategy: (id: string) => {
          set(
            (state) => ({
              strategies: state.strategies.filter((s) => s.id !== id),
              activeStrategy:
                state.activeStrategy?.id === id ? null : state.activeStrategy,
            }),
            false,
            'deleteStrategy'
          )
        },

        setActiveStrategy: (strategy: Strategy | null) => {
          set({ activeStrategy: strategy }, false, 'setActiveStrategy')
        },

        updateStrategyStatus: (id: string, status: StrategyStatus) => {
          set(
            (state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id
                  ? { ...s, status, updatedAt: new Date() }
                  : s
              ),
            }),
            false,
            'updateStrategyStatus'
          )
        },

        // ========================================
        // Async Actions
        // ========================================

        fetchStrategies: async () => {
          set({ isLoading: true, error: null }, false, 'fetchStrategies/pending')

          try {
            const response = await fetch('/api/strategies')

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success && Array.isArray(data.data)) {
              set(
                { strategies: data.data, isLoading: false },
                false,
                'fetchStrategies/fulfilled'
              )
            } else {
              throw new Error(data.error?.message || 'Failed to fetch strategies')
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error occurred'

            set(
              { error: errorMessage, isLoading: false },
              false,
              'fetchStrategies/rejected'
            )
          }
        },

        createStrategy: async (data: CreateStrategyInput) => {
          set({ isLoading: true, error: null }, false, 'createStrategy/pending')

          try {
            const response = await fetch('/api/strategies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success && result.data) {
              const newStrategy: Strategy = result.data

              set(
                (state) => ({
                  strategies: [...state.strategies, newStrategy],
                  isLoading: false,
                }),
                false,
                'createStrategy/fulfilled'
              )

              return newStrategy
            } else {
              throw new Error(result.error?.message || 'Failed to create strategy')
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error occurred'

            set(
              { error: errorMessage, isLoading: false },
              false,
              'createStrategy/rejected'
            )

            throw error
          }
        },

        saveStrategy: async (id: string) => {
          const strategy = get().strategies.find((s) => s.id === id)

          if (!strategy) {
            set(
              { error: `Strategy with id ${id} not found` },
              false,
              'saveStrategy/notFound'
            )
            return
          }

          set({ isLoading: true, error: null }, false, 'saveStrategy/pending')

          try {
            const response = await fetch(`/api/strategies/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(strategy),
            })

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (!result.success) {
              throw new Error(result.error?.message || 'Failed to save strategy')
            }

            set({ isLoading: false }, false, 'saveStrategy/fulfilled')
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error occurred'

            set(
              { error: errorMessage, isLoading: false },
              false,
              'saveStrategy/rejected'
            )
          }
        },

        // ========================================
        // UI State Actions
        // ========================================

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'setLoading')
        },

        setError: (error: string | null) => {
          set({ error }, false, 'setError')
        },

        clearError: () => {
          set({ error: null }, false, 'clearError')
        },
      }),
      {
        name: 'hephaitos-strategy-store',
        version: 1,
        partialize: (state) => ({
          strategies: state.strategies,
        }),
      }
    ),
    { name: 'StrategyStore' }
  )
)

// ========================================
// Selector Hooks for Optimized Re-renders
// ========================================

/**
 * Select all strategies
 */
export const useStrategies = () =>
  useStrategyStore((state) => state.strategies)

/**
 * Select active strategy
 */
export const useActiveStrategy = () =>
  useStrategyStore((state) => state.activeStrategy)

/**
 * Select running strategies only (with shallow comparison for array stability)
 */
export const useRunningStrategies = () =>
  useStrategyStore(
    useShallow((state) =>
      state.strategies.filter((s) => s.status === 'running')
    )
  )

/**
 * Select strategy by ID
 */
export const useStrategyById = (id: string) =>
  useStrategyStore((state) =>
    state.strategies.find((s) => s.id === id)
  )

/**
 * Select loading state
 */
export const useStrategyLoading = () =>
  useStrategyStore((state) => state.isLoading)

/**
 * Select error state
 */
export const useStrategyError = () =>
  useStrategyStore((state) => state.error)

/**
 * Select strategy count
 */
export const useStrategyCount = () =>
  useStrategyStore((state) => state.strategies.length)
