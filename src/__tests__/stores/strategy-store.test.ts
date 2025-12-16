// ============================================
// Strategy Store Tests
// ============================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { useStrategyStore } from '@/stores/strategy-store'
import type { Strategy, StrategyStatus } from '@/types'

// Mock strategy data
const mockStrategy: Strategy = {
  id: 'test-1',
  name: 'Test Strategy',
  description: 'A test strategy',
  status: 'draft' as StrategyStatus,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'user-1',
  config: {
    symbols: ['BTC/USDT'],
    timeframe: '1h',
    entryConditions: [],
    exitConditions: [],
    riskManagement: {},
    allocation: 10,
  },
}

const mockStrategy2: Strategy = {
  id: 'test-2',
  name: 'Test Strategy 2',
  description: 'Another test strategy',
  status: 'running' as StrategyStatus,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
  userId: 'user-1',
  config: {
    symbols: ['ETH/USDT'],
    timeframe: '4h',
    entryConditions: [],
    exitConditions: [],
    riskManagement: {},
    allocation: 10,
  },
}

describe('Strategy Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useStrategyStore.getState()
    store.setStrategies([])
    store.setActiveStrategy(null)
    store.setLoading(false)
    store.setError(null)
  })

  describe('Sync Actions', () => {
    it('should set strategies', () => {
      const { setStrategies } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy])
      })

      expect(useStrategyStore.getState().strategies).toHaveLength(1)
      expect(useStrategyStore.getState().strategies[0].id).toBe('test-1')
    })

    it('should add strategy', () => {
      const { addStrategy } = useStrategyStore.getState()

      act(() => {
        addStrategy(mockStrategy)
      })

      expect(useStrategyStore.getState().strategies).toHaveLength(1)

      act(() => {
        addStrategy(mockStrategy2)
      })

      expect(useStrategyStore.getState().strategies).toHaveLength(2)
    })

    it('should update strategy', () => {
      const { setStrategies, updateStrategy } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy])
        updateStrategy('test-1', { name: 'Updated Name' })
      })

      expect(useStrategyStore.getState().strategies[0].name).toBe('Updated Name')
    })

    it('should update active strategy when updating its properties', () => {
      const { setStrategies, setActiveStrategy, updateStrategy } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy])
        setActiveStrategy(mockStrategy)
        updateStrategy('test-1', { name: 'Updated Name' })
      })

      expect(useStrategyStore.getState().activeStrategy?.name).toBe('Updated Name')
    })

    it('should delete strategy', () => {
      const { setStrategies, deleteStrategy } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy, mockStrategy2])
        deleteStrategy('test-1')
      })

      expect(useStrategyStore.getState().strategies).toHaveLength(1)
      expect(useStrategyStore.getState().strategies[0].id).toBe('test-2')
    })

    it('should clear active strategy when deleting it', () => {
      const { setStrategies, setActiveStrategy, deleteStrategy } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy])
        setActiveStrategy(mockStrategy)
        deleteStrategy('test-1')
      })

      expect(useStrategyStore.getState().activeStrategy).toBeNull()
    })

    it('should set active strategy', () => {
      const { setActiveStrategy } = useStrategyStore.getState()

      act(() => {
        setActiveStrategy(mockStrategy)
      })

      expect(useStrategyStore.getState().activeStrategy?.id).toBe('test-1')
    })

    it('should update strategy status', () => {
      const { setStrategies, updateStrategyStatus } = useStrategyStore.getState()

      act(() => {
        setStrategies([mockStrategy])
        updateStrategyStatus('test-1', 'running')
      })

      expect(useStrategyStore.getState().strategies[0].status).toBe('running')
    })
  })

  describe('UI State Actions', () => {
    it('should set loading state', () => {
      const { setLoading } = useStrategyStore.getState()

      act(() => {
        setLoading(true)
      })

      expect(useStrategyStore.getState().isLoading).toBe(true)
    })

    it('should set error state', () => {
      const { setError } = useStrategyStore.getState()

      act(() => {
        setError('Something went wrong')
      })

      expect(useStrategyStore.getState().error).toBe('Something went wrong')
    })

    it('should clear error', () => {
      const { setError, clearError } = useStrategyStore.getState()

      act(() => {
        setError('Error')
        clearError()
      })

      expect(useStrategyStore.getState().error).toBeNull()
    })
  })

  describe('Async Actions', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should fetch strategies successfully', async () => {
      const mockResponse = {
        success: true,
        data: [mockStrategy],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const { fetchStrategies } = useStrategyStore.getState()

      await act(async () => {
        await fetchStrategies()
      })

      expect(useStrategyStore.getState().strategies).toHaveLength(1)
      expect(useStrategyStore.getState().isLoading).toBe(false)
      expect(useStrategyStore.getState().error).toBeNull()
    })

    it('should handle fetch error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const { fetchStrategies } = useStrategyStore.getState()

      await act(async () => {
        await fetchStrategies()
      })

      expect(useStrategyStore.getState().error).toBe('HTTP error! status: 500')
      expect(useStrategyStore.getState().isLoading).toBe(false)
    })

    it('should create strategy successfully', async () => {
      const newStrategy = { ...mockStrategy, id: 'new-1' }
      const mockResponse = {
        success: true,
        data: newStrategy,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const { createStrategy } = useStrategyStore.getState()

      let result: Strategy | undefined
      await act(async () => {
        result = await createStrategy({
          name: 'New Strategy',
          description: 'Test',
          config: mockStrategy.config,
        })
      })

      expect(result?.id).toBe('new-1')
      expect(useStrategyStore.getState().strategies).toHaveLength(1)
    })

    it('should handle create strategy error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response)

      const { createStrategy } = useStrategyStore.getState()

      await act(async () => {
        await expect(createStrategy({
          name: 'New Strategy',
          description: 'Test',
          config: mockStrategy.config,
        })).rejects.toThrow()
      })

      expect(useStrategyStore.getState().error).toBe('HTTP error! status: 400')
    })

    it('should save strategy successfully', async () => {
      const { setStrategies, saveStrategy } = useStrategyStore.getState()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await act(async () => {
        setStrategies([mockStrategy])
        await saveStrategy('test-1')
      })

      expect(useStrategyStore.getState().isLoading).toBe(false)
      expect(useStrategyStore.getState().error).toBeNull()
    })

    it('should handle save not found error', async () => {
      const { saveStrategy } = useStrategyStore.getState()

      await act(async () => {
        await saveStrategy('non-existent')
      })

      expect(useStrategyStore.getState().error).toContain('not found')
    })
  })
})
