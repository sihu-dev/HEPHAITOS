// ============================================
// Shared Mock Data for MVP
// TODO: Replace with Supabase queries in production
// ============================================

import type { Strategy, Trade, Portfolio } from '@/types'

// Shared mock strategies (used by both /api/strategies and /api/strategies/[id])
export const mockStrategies: Strategy[] = [
  {
    id: '1',
    userId: '00000000-0000-0000-0000-000000000001',
    name: '모멘텀 돌파 전략',
    description: 'RSI와 MACD를 활용한 모멘텀 기반 진입 전략',
    status: 'running',
    config: {
      symbols: ['BTC/USDT', 'ETH/USDT'],
      timeframe: '1h',
      entryConditions: [
        { id: '1', indicator: 'RSI', operator: 'lt', value: 30, params: { period: 14 } },
        { id: '2', indicator: 'MACD', operator: 'crosses_above', value: 0 },
      ],
      exitConditions: [
        { id: '3', indicator: 'RSI', operator: 'gt', value: 70 },
      ],
      riskManagement: {
        stopLoss: 2,
        takeProfit: 5,
        maxPositionSize: 10,
      },
      allocation: 30,
    },
    performance: {
      totalReturn: 18.7,
      winRate: 67.3,
      sharpeRatio: 1.84,
      maxDrawdown: -8.2,
      totalTrades: 45,
      winningTrades: 30,
      losingTrades: 15,
      avgWin: 3.2,
      avgLoss: -1.5,
      profitFactor: 2.1,
    },
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-12'),
  },
  {
    id: '2',
    userId: '00000000-0000-0000-0000-000000000001',
    name: 'RSI 역추세',
    description: '과매도 구간에서 반등을 노리는 역추세 전략',
    status: 'running',
    config: {
      symbols: ['BTC/USDT'],
      timeframe: '4h',
      entryConditions: [
        { id: '1', indicator: 'RSI', operator: 'lt', value: 25, params: { period: 14 } },
      ],
      exitConditions: [
        { id: '2', indicator: 'RSI', operator: 'gt', value: 50 },
      ],
      riskManagement: {
        stopLoss: 3,
        takeProfit: 8,
        maxPositionSize: 15,
      },
      allocation: 20,
    },
    performance: {
      totalReturn: 12.4,
      winRate: 62.5,
      sharpeRatio: 1.52,
      maxDrawdown: -6.8,
      totalTrades: 32,
      winningTrades: 20,
      losingTrades: 12,
      avgWin: 4.1,
      avgLoss: -2.2,
      profitFactor: 1.86,
    },
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: '3',
    userId: '00000000-0000-0000-0000-000000000001',
    name: 'MACD 골든크로스',
    description: 'MACD 교차 시그널 기반 추세 추종 전략',
    status: 'paused',
    config: {
      symbols: ['ETH/USDT', 'SOL/USDT'],
      timeframe: '1d',
      entryConditions: [
        { id: '1', indicator: 'MACD', operator: 'crosses_above', value: 0 },
      ],
      exitConditions: [
        { id: '2', indicator: 'MACD', operator: 'crosses_below', value: 0 },
      ],
      riskManagement: {
        stopLoss: 5,
        takeProfit: 15,
        maxPositionSize: 20,
      },
      allocation: 25,
    },
    performance: {
      totalReturn: -3.2,
      winRate: 44.4,
      sharpeRatio: 0.82,
      maxDrawdown: -12.5,
      totalTrades: 18,
      winningTrades: 8,
      losingTrades: 10,
      avgWin: 6.8,
      avgLoss: -4.2,
      profitFactor: 0.81,
    },
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-12-05'),
  },
]

// Mock trades
export const mockTrades: Trade[] = [
  {
    id: 't1',
    strategyId: '1',
    symbol: 'BTC/USDT',
    type: 'buy',
    status: 'filled',
    price: 42150.50,
    amount: 0.05,
    total: 2107.53,
    fee: 2.11,
    pnl: 156.32,
    pnlPercent: 7.42,
    executedAt: new Date('2024-12-12T08:30:00'),
    createdAt: new Date('2024-12-12T08:30:00'),
  },
  {
    id: 't2',
    strategyId: '1',
    symbol: 'ETH/USDT',
    type: 'buy',
    status: 'filled',
    price: 2245.80,
    amount: 0.5,
    total: 1122.90,
    fee: 1.12,
    pnl: 45.20,
    pnlPercent: 4.02,
    executedAt: new Date('2024-12-12T07:15:00'),
    createdAt: new Date('2024-12-12T07:15:00'),
  },
  {
    id: 't3',
    strategyId: '2',
    symbol: 'BTC/USDT',
    type: 'sell',
    status: 'filled',
    price: 42890.25,
    amount: 0.03,
    total: 1286.71,
    fee: 1.29,
    pnl: -32.50,
    pnlPercent: -2.53,
    executedAt: new Date('2024-12-11T22:45:00'),
    createdAt: new Date('2024-12-11T22:45:00'),
  },
  {
    id: 't4',
    strategyId: '1',
    symbol: 'SOL/USDT',
    type: 'buy',
    status: 'filled',
    price: 98.45,
    amount: 10,
    total: 984.50,
    fee: 0.98,
    pnl: 67.80,
    pnlPercent: 6.89,
    executedAt: new Date('2024-12-11T18:20:00'),
    createdAt: new Date('2024-12-11T18:20:00'),
  },
  {
    id: 't5',
    strategyId: '3',
    symbol: 'ETH/USDT',
    type: 'sell',
    status: 'filled',
    price: 2198.30,
    amount: 0.3,
    total: 659.49,
    fee: 0.66,
    pnl: -18.75,
    pnlPercent: -2.84,
    executedAt: new Date('2024-12-11T14:10:00'),
    createdAt: new Date('2024-12-11T14:10:00'),
  },
]

// Mock portfolio
export const mockPortfolio: Portfolio = {
  totalValue: 125847.32,
  cashBalance: 45230.50,
  investedValue: 80616.82,
  totalPnl: 8547.23,
  totalPnlPercent: 7.28,
  positions: [
    {
      symbol: 'BTC/USDT',
      amount: 1.25,
      avgPrice: 41250.00,
      currentPrice: 43150.75,
      value: 53938.44,
      pnl: 2375.94,
      pnlPercent: 4.61,
    },
    {
      symbol: 'ETH/USDT',
      amount: 8.5,
      avgPrice: 2150.00,
      currentPrice: 2285.50,
      value: 19426.75,
      pnl: 1151.75,
      pnlPercent: 6.30,
    },
    {
      symbol: 'SOL/USDT',
      amount: 75,
      avgPrice: 85.50,
      currentPrice: 96.68,
      value: 7251.00,
      pnl: 838.50,
      pnlPercent: 13.07,
    },
  ],
}

// Helper functions for CRUD operations
export function findStrategyById(id: string): Strategy | undefined {
  return mockStrategies.find(s => s.id === id)
}

export function findStrategyIndex(id: string): number {
  return mockStrategies.findIndex(s => s.id === id)
}

export function addStrategy(strategy: Strategy): void {
  mockStrategies.push(strategy)
}

export function updateStrategy(id: string, updates: Partial<Strategy>): Strategy | null {
  const index = findStrategyIndex(id)
  if (index === -1) return null

  mockStrategies[index] = {
    ...mockStrategies[index],
    ...updates,
    id, // Ensure ID cannot be changed
    updatedAt: new Date(),
  }
  return mockStrategies[index]
}

export function deleteStrategy(id: string): boolean {
  const index = findStrategyIndex(id)
  if (index === -1) return false

  mockStrategies.splice(index, 1)
  return true
}
